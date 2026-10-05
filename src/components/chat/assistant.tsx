"use client";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat/core";
const suggestions = ["🍽️ Restaurants", "♨️ Thermaalbad", "🥐 Ontbijt", "🛎️ Receptie", "🅿️ Parkeren", "🕐 Openingstijden", "🏨 Hotel", "❓ Veelgestelde vragen"];
export function QuickReply({text,onSelect,disabled}:{text:string;onSelect:(value:string)=>void;disabled:boolean}) {
  return <button className="chat-quick" type="button" disabled={disabled} onClick={()=>onSelect(text)}>{text}</button>;
}
export function Assistant() {
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [draft,setDraft]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [greeting,setGreeting]=useState("Welkom");
  const locked=useRef(false);
  const bottom=useRef<HTMLDivElement>(null);
  const abort=useRef<AbortController | null>(null);
  useEffect(()=>{const update=()=>{const hour=new Date().getHours();setGreeting(hour<12?"Goedemorgen":hour<18?"Goedemiddag":"Goedenavond");}; const start=setTimeout(update,0); const clock=setInterval(update,60000); return ()=>{clearTimeout(start);clearInterval(clock);abort.current?.abort();};},[]);
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"end"});},[messages,busy,error]);
  async function send(value:string) {
    const content=value.trim(); if(!content || locked.current || content.length>1200)return;
    locked.current=true;setBusy(true);setError("");setDraft("");
    const next:ChatMessage[]=[...messages,{role:"user",content}];setMessages(next);
    const controller=new AbortController();abort.current=controller;
    const timer=setTimeout(()=>controller.abort(),55000);
    try {
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-6)}),signal:controller.signal});
      const data=await response.json();
      if(!response.ok || typeof data.answer!=="string")throw new Error("UNAVAILABLE");
      setMessages([...next,{role:"assistant",content:data.answer}]);
    }catch {setError("Het lukt nu niet om te antwoorden. Probeer opnieuw of neem contact op met de receptie.");setDraft(content);setMessages(messages);}
    finally{clearTimeout(timer);locked.current=false;setBusy(false);}
  }
  return <main className="chat-page">
    <header className="chat-header"><Link href="/" aria-label="Terug naar Home"><ArrowLeft/></Link><div><h1>Parkhotel Assistent</h1><p>Digitale hotelassistent · AI</p></div><button type="button" aria-label="Nieuw gesprek" disabled={busy} onClick={()=>{setMessages([]);setError("");setDraft("");}}><RotateCcw size={20}/></button></header>
    <div className="chat-scroll">
      {!messages.length && <section className="chat-welcome"><MessageCircle size={32}/><h2>{greeting} 👋<br/>Waarmee kan ik je helpen?</h2><p>Stel je vraag in het Nederlands, Duits of Engels.</p><div className="chat-actions">{suggestions.map(text=><QuickReply key={text} text={text} onSelect={send} disabled={busy}/>)}</div></section>}
      <div role="log" aria-live="polite" aria-label="Gesprek">{messages.map((m,i)=><article key={i} className={`chat-message ${m.role}`}><span>{m.role==="user"?"Jij":"Parkhotel Assistent"}</span><p>{m.content}</p></article>)}</div>
      {busy && <div className="chat-typing" role="status" aria-label="De assistent denkt na"><i/><i/><i/></div>}
      {error && <p role="alert" className="chat-error">{error}</p>}
      <div ref={bottom}/>
    </div>
    <form className="chat-composer" onSubmit={e=>{e.preventDefault();void send(draft);}}><label className="chat-label" htmlFor="chat-question">Stel je vraag</label><div><textarea id="chat-question" rows={2} maxLength={1200} placeholder="Stel je vraag…" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send(draft);}}}/><button type="submit" disabled={busy||!draft.trim()} aria-label="Versturen"><Send size={21}/></button></div><small>Deel geen persoonlijke of boekingsgegevens. <Link href="/contact">Receptie</Link></small></form>
  </main>;
}


