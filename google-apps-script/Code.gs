/* Parkbad Members write gateway. One deployment/project for ALL writers.
 * Enable the advanced Google Sheets service. Reads and atomic batches use
 * the official Sheets API; LockService serializes the read/validate/write.
 * Script properties: SPREADSHEET_ID, WRITE_SECRET (>=32 random characters).
 */
var PB_HEADERS = {
  Members: ['MemberID','Voornaam','Achternaam','Email','LidSinds','Niveau','Status','CreatedAt','UpdatedAt'],
  Bezoeken: ['VisitID','MemberID','Boekingsnummer','Aankomstdatum','Status','AangemeldOp','GoedgekeurdOp','GoedgekeurdDoor'],
  Beloningen: ['RewardID','Naam','Omschrijving','Actief'],
  MemberBeloningen: ['UserRewardID','MemberID','RewardID','VerdiendOp','GebruiktOp','Status'],
  Voordelen: ['BenefitID','Titel','Omschrijving','Categorie','Afbeelding','Actief'],
  Acties: ['PromotionID','Titel','Omschrijving','Afbeelding','StartDatum','EindDatum','Actief'],
  Instellingen: ['Key','Value']
};
function pbFail(code) { var error = new Error(code); error.pbCode = code; throw error; }
function pbText(value, min, max) { if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) pbFail('INVALID_INPUT'); return value.trim(); }
function pbEmail(value) { var email = pbText(value,3,254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) pbFail('INVALID_INPUT'); return email; }
function pbUuid(value) { if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) pbFail('INVALID_INPUT'); return value; }
function pbDate(value) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) pbFail('INVALID_INPUT'); return value; }
function pbBool(value) { return value === true || String(value).toUpperCase() === 'TRUE'; }
function pbJson(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function pbVerify(envelope, secret, now) {
  if (!secret || secret.length < 32 || typeof envelope.payload !== 'string' || envelope.payload.length > 10000 || !/^[a-f0-9]{64}$/.test(envelope.signature || '')) pbFail('FORBIDDEN');
  var bytes = Utilities.computeHmacSha256Signature(envelope.payload, secret, Utilities.Charset.UTF_8);
  var expected = bytes.map(function(b) { return ('0'+((b+256)%256).toString(16)).slice(-2); }).join('');
  var diff = 0; for (var i=0;i<64;i++) diff |= expected.charCodeAt(i)^envelope.signature.charCodeAt(i);
  if (diff!==0) pbFail('FORBIDDEN');
  var command = JSON.parse(envelope.payload);
  if (typeof command.issuedAt !== 'number' || !isFinite(command.issuedAt) || Math.abs(now-command.issuedAt)>300000) pbFail('FORBIDDEN');
  if (!command.actor || typeof command.actor.isAdmin !== 'boolean') pbFail('FORBIDDEN');
  command.actor.email=pbEmail(command.actor.email);
  return command;
}
function doPost(event) {
  var lock;
  try {
    if (!event || !event.postData || event.postData.contents.length>15000) pbFail('INVALID_INPUT');
    var props = PropertiesService.getScriptProperties();
    var command = pbVerify(JSON.parse(event.postData.contents),props.getProperty('WRITE_SECRET'),Date.now());
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) pbFail('BUSY');
    var id=props.getProperty('SPREADSHEET_ID'); if (!id) pbFail('CONFIGURATION');
    var db=pbRead(id);
    var result=pbPlan(command,db,new Date());
    if (result.changes.length) Sheets.Spreadsheets.batchUpdate({requests:pbRequests(result.changes,db.sheetIds)},id);
    return pbJson({ok:true,data:result.data});
  } catch(error) {
    return pbJson({ok:false,code:error.pbCode || 'INTERNAL'});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function pbRead(id) {
  var names=Object.keys(PB_HEADERS);
  var result=Sheets.Spreadsheets.Values.batchGet(id,{ranges:names.map(function(name){return "'"+name+"'!A:"+String.fromCharCode(64+PB_HEADERS[name].length);}),valueRenderOption:'UNFORMATTED_VALUE',dateTimeRenderOption:'FORMATTED_STRING'});
  var db={sheetIds:{}};
  names.forEach(function(name,index){
    var values=result.valueRanges[index].values || [];
    var headers=PB_HEADERS[name];
    if (!values[0] || headers.some(function(h,i){return values[0][i]!==h;})) pbFail('SCHEMA');
    var seen={};
    db[name]=[];
    values.slice(1).forEach(function(row,i){
      if (row.every(function(v){return v==='' || v===null;})) return;
      var record={_row:i+2}; headers.forEach(function(h,j){record[h]=String(row[j]===undefined?'':row[j]);});
      if (!record[headers[0]] || seen[record[headers[0]]]) pbFail('SCHEMA');
      seen[record[headers[0]]]=true; db[name].push(record);
    });
  });
  var meta=Sheets.Spreadsheets.get(id,{fields:'sheets(properties(sheetId,title))'});
  meta.sheets.forEach(function(sheet){db.sheetIds[sheet.properties.title]=sheet.properties.sheetId;});
  return db;
}
function pbRequests(changes,ids) {
  return changes.map(function(change){
    var values=PB_HEADERS[change.table].map(function(key){return {userEnteredValue:{stringValue:String(change.data[key]===undefined?'':change.data[key])}};});
    if (change.row) return {updateCells:{start:{sheetId:ids[change.table],rowIndex:change.row-1,columnIndex:0},rows:[{values:values}],fields:'userEnteredValue'}};
    return {appendCells:{sheetId:ids[change.table],rows:[{values:values}],fields:'userEnteredValue'}};
  });
}
function pbClean(record) { var copy={};Object.keys(record).forEach(function(k){if(k!=='_row')copy[k]=record[k];});return copy; }
function pbSetting(db,key) { var found=db.Instellingen.find(function(r){return r.Key===key;}); return found ? found.Value : null; }
function pbSet(db,key,value) { var found=db.Instellingen.find(function(r){return r.Key===key;}); return {table:'Instellingen',row:found && found._row,data:{Key:key,Value:String(value)}}; }
function pbOwn(db,email) {
  var matches=db.Members.filter(function(m){return m.Email.trim().toLowerCase()===email;});
  if(matches.length>1)pbFail('SCHEMA'); if(!matches.length)pbFail('MEMBER_MISSING');
  if(matches[0].Status!=='ACTIVE')pbFail('FORBIDDEN');return matches[0];
}
function pbPlan(command,db,now) {
  var actor=command.actor, input=command.input || {}, stamp=now.toISOString(), today=Utilities.formatDate(now,'Europe/Amsterdam','yyyy-MM-dd');
  var data, changes=[], member, existing;
  if(command.operation==='createMember') {
    var firstName=pbText(input.firstName,1,100),lastName=pbText(input.lastName,0,100);
    existing=db.Members.filter(function(m){return m.Email.trim().toLowerCase()===actor.email;});
    if(existing.length>1)pbFail('SCHEMA');
    if(existing.length) { if(existing[0].Status!=='ACTIVE')pbFail('FORBIDDEN');return {data:pbClean(existing[0]),changes:[]}; }
    var counter=Number(pbSetting(db,'lastMemberSequence')||'0');
    if(!Number.isSafeInteger(counter)||counter<0)pbFail('SCHEMA');
    db.Members.forEach(function(m){if(!/^KV-\d{3,}$/.test(m.MemberID))pbFail('SCHEMA');counter=Math.max(counter,Number(m.MemberID.slice(3)));});
    if(!Number.isSafeInteger(counter+1))pbFail('SCHEMA');
    data={MemberID:'KV-'+String(counter+1).padStart(3,'0'),Voornaam:firstName,Achternaam:lastName,Email:actor.email,LidSinds:today,Niveau:'MEMBER',Status:'ACTIVE',CreatedAt:stamp,UpdatedAt:stamp};
    changes=[{table:'Members',data:data},pbSet(db,'lastMemberSequence',counter+1)];
  } else if(command.operation==='createVisit') {
    member=pbOwn(db,actor.email);
    var booking=pbText(input.bookingNumber,4,30).toUpperCase();if(!/^[A-Z0-9-]+$/.test(booking))pbFail('INVALID_INPUT');
    var arrival=pbDate(input.arrivalDate),visitId=pbUuid(input.requestId);
    existing=db.Bezoeken.find(function(v){return v.VisitID===visitId;});
    if(existing) { if(existing.MemberID!==member.MemberID||existing.Boekingsnummer.toUpperCase()!==booking||existing.Aankomstdatum!==arrival)pbFail('CONFLICT');return {data:pbClean(existing),changes:[]}; }
    if(arrival<today)pbFail('INVALID_INPUT');
    if(db.Bezoeken.some(function(v){return v.Boekingsnummer.trim().toUpperCase()===booking;}))pbFail('DUPLICATE_BOOKING');
    data={VisitID:visitId,MemberID:member.MemberID,Boekingsnummer:booking,Aankomstdatum:arrival,Status:'PENDING',AangemeldOp:stamp,GoedgekeurdOp:'',GoedgekeurdDoor:''};
    changes=[{table:'Bezoeken',data:data}];
  } else if(command.operation==='updateVisitStatus') {
    if(actor.isAdmin!==true)pbFail('FORBIDDEN');
    var visit=db.Bezoeken.find(function(v){return v.VisitID===input.visitId;});if(!visit)pbFail('INVALID_INPUT');
    if(visit.Status===input.status)return {data:pbClean(visit),changes:[]};
    var transitions={PENDING:['APPROVED','REJECTED'],APPROVED:['COMPLETED'],COMPLETED:[],REJECTED:[]};
    if(!transitions[visit.Status] || transitions[visit.Status].indexOf(input.status)===-1)pbFail('CONFLICT');
    data=pbClean(visit);data.Status=input.status;
    if(input.status==='APPROVED'){data.GoedgekeurdOp=stamp;data.GoedgekeurdDoor=actor.email;}
    changes=[{table:'Bezoeken',row:visit._row,data:data}];
  } else if(command.operation==='assignReward') {
    if(actor.isAdmin!==true)pbFail('FORBIDDEN');
    var userRewardId=pbUuid(input.requestId);
    existing=db.MemberBeloningen.find(function(r){return r.UserRewardID===userRewardId;});
    if(existing){if(existing.MemberID!==input.memberId||existing.RewardID!==input.rewardId)pbFail('CONFLICT');return {data:pbClean(existing),changes:[]};}
    member=db.Members.find(function(m){return m.MemberID===input.memberId && m.Status==='ACTIVE';});if(!member)pbFail('MEMBER_MISSING');
    var reward=db.Beloningen.find(function(r){return r.RewardID===input.rewardId && pbBool(r.Actief);});if(!reward)pbFail('INVALID_INPUT');
    var required=Number(pbSetting(db,'visitsRequiredForReward'));
    var consumed=Number(pbSetting(db,'rewardVisitsConsumed.'+member.MemberID)||'0');
    if(!Number.isInteger(required)||required<1||required>100||!Number.isInteger(consumed)||consumed<0)pbFail('SCHEMA');
    var valid=db.Bezoeken.filter(function(v){return v.MemberID===member.MemberID && (v.Status==='APPROVED'||v.Status==='COMPLETED');}).length;
    if(valid-consumed<required)pbFail('INELIGIBLE');
    data={UserRewardID:userRewardId,MemberID:member.MemberID,RewardID:reward.RewardID,VerdiendOp:stamp,GebruiktOp:'',Status:'AVAILABLE'};
    changes=[{table:'MemberBeloningen',data:data},pbSet(db,'rewardVisitsConsumed.'+member.MemberID,consumed+required)];
  } else pbFail('INVALID_INPUT');
  return {data:data,changes:changes};
}

/** Run manually ONCE before deploying. Never replaces existing data. */
function initializeDatabase() {
  var props=PropertiesService.getScriptProperties(),id=props.getProperty('SPREADSHEET_ID');
  if(!id)throw new Error('Set SPREADSHEET_ID first');
  var lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    var meta=Sheets.Spreadsheets.get(id,{fields:'sheets(properties(sheetId,title))'}),known={};
    meta.sheets.forEach(function(s){known[s.properties.title]=s.properties.sheetId;});
    var requests=[],nextId=Math.max.apply(null,meta.sheets.map(function(s){return s.properties.sheetId;}))+1;
    Object.keys(PB_HEADERS).forEach(function(name){
      var isNew=known[name]===undefined;
      if(isNew){known[name]=nextId++;requests.push({addSheet:{properties:{sheetId:known[name],title:name,gridProperties:{frozenRowCount:1}}}});}
      var existing=isNew?[]:(Sheets.Spreadsheets.Values.get(id,"'"+name+"'!A1:Z1").values||[]);
      if(existing.length && PB_HEADERS[name].some(function(h,i){return existing[0][i]!==h;}))throw new Error('Unexpected headers: '+name);
      if(!existing.length)requests.push({updateCells:{start:{sheetId:known[name],rowIndex:0,columnIndex:0},rows:[{values:PB_HEADERS[name].map(function(h){return {userEnteredValue:{stringValue:h}};})}],fields:'userEnteredValue'}});
    });
    if(requests.length)Sheets.Spreadsheets.batchUpdate({requests:requests},id);
    var db=pbRead(id),changes=[];
    if(pbSetting(db,'visitsRequiredForReward')===null)changes.push(pbSet(db,'visitsRequiredForReward',4));
    if(changes.length)Sheets.Spreadsheets.batchUpdate({requests:pbRequests(changes,known)},id);
  } finally { lock.releaseLock(); }
}
