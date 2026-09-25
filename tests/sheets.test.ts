import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHmac, randomUUID } from "node:crypto";
import {
  headers,
  parseTable,
  newVisitInput,
  type Tables,
} from "../src/lib/google-sheets/schema";
import { MemberService } from "../src/services/member-service";
import { rewardProgress } from "../src/lib/loyalty";
import { initialVisits } from "../src/lib/mock-data";

function harness() {
  const rows: Record<string, string[][]> = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k, [[...v]]]),
  );
  rows.Instellingen.push(["visitsRequiredForReward", "4"]);
  const names = Object.keys(headers);
  let held = false,
    externallyHeld = false,
    reads = 0,
    writes = 0;
  const secret = randomUUID() + randomUUID();
  const context = vm.createContext({
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) =>
          key === "WRITE_SECRET" ? secret : "test-sheet",
      }),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (externallyHeld || held) return false;
          held = true;
          return true;
        },
        hasLock: () => held,
        releaseLock: () => {
          held = false;
        },
      }),
    },
    Utilities: {
      Charset: { UTF_8: "UTF-8" },
      computeHmacSha256Signature: (p: string, s: string) =>
        Array.from(createHmac("sha256", s).update(p).digest()),
      formatDate: (d: Date) => d.toISOString().slice(0, 10),
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (s: string) => ({ setMimeType: () => s }),
    },
    Sheets: {
      Spreadsheets: {
        get: () => ({
          sheets: names.map((title, sheetId) => ({
            properties: { title, sheetId },
          })),
        }),
        Values: {
          batchGet: () => {
            assert.equal(held, true);
            reads++;
            return { valueRanges: names.map((n) => ({ values: rows[n] })) };
          },
        },
        batchUpdate: (batch: {
          requests: Array<{
            appendCells?: {
              sheetId: number;
              rows: {
                values: { userEnteredValue: { stringValue: string } }[];
              }[];
            };
            updateCells?: {
              start: { sheetId: number; rowIndex: number };
              rows: {
                values: { userEnteredValue: { stringValue: string } }[];
              }[];
            };
          }>;
        }) => {
          assert.equal(held, true);
          writes++;
          for (const request of batch.requests) {
            const cell = request.appendCells ?? request.updateCells!;
            const values = cell.rows[0].values.map(
              (v) => v.userEnteredValue.stringValue,
            );
            if (request.appendCells)
              rows[names[request.appendCells.sheetId]].push(values);
            else
              rows[names[request.updateCells!.start.sheetId]][
                request.updateCells!.start.rowIndex
              ] = values;
          }
        },
      },
    },
  });
  vm.runInContext(readFileSync("google-apps-script/Code.gs", "utf8"), context);
  function command(
    operation: string,
    input: unknown,
    email = "one@example.com",
    isAdmin = false,
  ) {
    return {
      operation,
      input,
      actor: {
        authUserId: `user_${email}`,
        email,
        firstName: "Guest",
        lastName: "Member",
        isAdmin,
      },
      issuedAt: Date.now(),
    };
  }
  function send(c: ReturnType<typeof command>, tamper = false) {
    const payload = JSON.stringify(c),
      signature = createHmac("sha256", secret).update(payload).digest("hex");
    return JSON.parse(
      context.doPost({
        postData: {
          contents: JSON.stringify({
            payload: tamper ? payload + " " : payload,
            signature,
          }),
        },
      }),
    );
  }
  return {
    rows,
    command,
    send,
    context,
    busy: (value: boolean) => {
      externallyHeld = value;
    },
    stats: () => ({ reads, writes, held }),
  };
}

test("Apps Script rejects forged, expired and contending requests before data access", () => {
  const h = harness(),
    c = h.command("activateMember", {});
  assert.equal(h.send(c, true).code, "FORBIDDEN");
  assert.equal(h.send({ ...c, issuedAt: 0 }).code, "FORBIDDEN");
  h.busy(true);
  assert.equal(h.send(c).code, "BUSY");
  h.busy(false);
  assert.deepEqual(h.stats(), { reads: 0, writes: 0, held: false });
  assert.equal(h.send(c).data.MemberID, "KV-001");
  assert.equal(h.stats().held, false);
});
test("serialized members remain unique, retry is idempotent and counter survives deletion", () => {
  const h = harness();
  for (let i = 0; i < 30; i++)
    assert.equal(
      h.send(
        h.command(
          "activateMember",
          {},
          i + "@example.com",
        ),
      ).data.MemberID,
      "KV-" + String(i + 1).padStart(3, "0"),
    );
  assert.equal(
    h.send(
      h.command(
        "activateMember",
        {},
        "0@example.com",
      ),
    ).data.MemberID,
    "KV-001",
  );
  h.rows.Members.pop();
  assert.equal(
    h.send(h.command("activateMember", {})).data
      .MemberID,
    "KV-031",
  );
  assert.equal(h.stats().writes, 31);
});
test("a verified account claims an existing member without creating a second MemberID", () => {
  const h = harness();
  h.rows.Members.push([
    "KV-042",
    "",
    "Existing",
    "Member",
    "existing@example.com",
    "2025-01-01",
    "MEMBER",
    "ACTIVE",
    "2025-01-01T10:00:00+01:00",
    "2025-01-01T10:00:00+01:00",
  ]);
  const result = h.send(h.command("activateMember", {}, "existing@example.com"));
  assert.equal(result.data.MemberID, "KV-042");
  assert.equal(result.data.AuthUserID, "user_existing@example.com");
  assert.equal(h.rows.Members.length, 2);
});
test("booking uniqueness is global and normalized, retries cannot switch owners", () => {
  const h = harness();
  for (const email of ["one@example.com", "two@example.com"])
    h.send(
      h.command("activateMember", {}, email),
    );
  const input = {
    bookingNumber: " abcd ",
    arrivalDate: "2099-01-01",
    requestId: randomUUID(),
  };
  const first = h.send(h.command("createVisit", input));
  assert.equal(first.data.Status, "PENDING");
  assert.equal(
    h.send(h.command("createVisit", input)).data.VisitID,
    first.data.VisitID,
  );
  assert.equal(
    h.send(
      h.command(
        "createVisit",
        { ...input, bookingNumber: "ABCD", requestId: randomUUID() },
        "two@example.com",
      ),
    ).code,
    "DUPLICATE_BOOKING",
  );
  assert.equal(
    h.send(h.command("createVisit", input, "two@example.com")).code,
    "CONFLICT",
  );
  assert.equal(h.rows.Bezoeken.length, 2);
  assert.equal(h.stats().held, false);
});
test("only admins approve and award, awards consume visits once in the same batch", () => {
  const h = harness();
  h.send(h.command("activateMember", {}));
  h.rows.Beloningen.push(["gift", "Gift", "A gift", "TRUE"]);
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const id = randomUUID();
    ids.push(id);
    h.send(
      h.command("createVisit", {
        bookingNumber: "BOOK" + i,
        arrivalDate: "2099-01-01",
        requestId: id,
      }),
    );
  }
  const reward = {
    memberId: "KV-001",
    rewardId: "gift",
    requestId: randomUUID(),
  };
  assert.equal(h.send(h.command("assignReward", reward)).code, "FORBIDDEN");
  assert.equal(
    h.send(h.command("assignReward", reward, "admin@example.com", true)).code,
    "INELIGIBLE",
  );
  assert.equal(
    h.send(
      h.command("updateVisitStatus", { visitId: ids[0], status: "APPROVED" }),
    ).code,
    "FORBIDDEN",
  );
  for (const id of ids.slice(0, 4))
    assert.equal(
      h.send(
        h.command(
          "updateVisitStatus",
          { visitId: id, status: "APPROVED" },
          "admin@example.com",
          true,
        ),
      ).data.GoedgekeurdDoor,
      "admin@example.com",
    );
  const before = h.stats().writes;
  assert.equal(
    h.send(h.command("assignReward", reward, "admin@example.com", true)).data
      .Status,
    "AVAILABLE",
  );
  assert.equal(h.stats().writes, before + 1);
  assert.equal(
    h.send(h.command("assignReward", reward, "admin@example.com", true)).data
      .UserRewardID,
    reward.requestId,
  );
  assert.equal(h.stats().writes, before + 1);
  assert.equal(
    h.send(
      h.command(
        "assignReward",
        { ...reward, requestId: randomUUID() },
        "admin@example.com",
        true,
      ),
    ).code,
    "INELIGIBLE",
  );
  assert.equal(
    h.rows.Instellingen.find(
      (r) => r[0] === "rewardVisitsConsumed.KV-001",
    )?.[1],
    "4",
  );
  assert.equal(
    h.send(
      h.command(
        "updateVisitStatus",
        { visitId: ids[0], status: "REJECTED" },
        "admin@example.com",
        true,
      ),
    ).code,
    "CONFLICT",
  );
});
test("formula-like text is stored as literal text and failed writes release lock", () => {
  const h = harness();
  const formulaCommand = h.command("activateMember", {});
  formulaCommand.actor.firstName = '=IMPORTXML("example")';
  assert.equal(
    h.send(formulaCommand).ok,
    true,
  );
  assert.equal(h.rows.Members[1][2], '=IMPORTXML("example")');
  h.context.Sheets.Spreadsheets.batchUpdate = () => {
    throw Error("secret error");
  };
  const response = h.send(
    h.command(
      "activateMember",
      {},
      "two@example.com",
    ),
  );
  assert.deepEqual(response, { ok: false, code: "INTERNAL" });
  assert.equal(h.stats().held, false);
});
test("strict schemas reject user-supplied identity, malformed dates, headers and duplicate keys", () => {
  assert.equal(
    newVisitInput.safeParse({
      bookingNumber: "BOOK",
      arrivalDate: "2026-02-30",
    }).success,
    false,
  );
  assert.equal(
    newVisitInput.safeParse({
      bookingNumber: "BOOK",
      arrivalDate: "2099-01-01",
      memberId: "KV-002",
    }).success,
    false,
  );
  assert.throws(() => parseTable("Instellingen", [["Value", "Key"]]));
  assert.throws(() =>
    parseTable("Instellingen", [
      [...headers.Instellingen],
      ["x", "1"],
      ["x", "2"],
    ]),
  );
  assert.equal(
    parseTable("Beloningen", [
      [...headers.Beloningen],
      ["r", "Gift", "", true],
    ])[0].value.Actief,
    true,
  );
});
test("service isolates members in batched portal reads and denies foreign email and blocked account", async () => {
  const h = harness();
  for (const email of ["one@example.com", "two@example.com"])
    h.send(
      h.command("activateMember", {}, email),
    );
  h.send(
    h.command(
      "createVisit",
      {
        bookingNumber: "BOOK",
        arrivalDate: "2099-01-01",
        requestId: randomUUID(),
      },
      "two@example.com",
    ),
  );
  const tables = Object.fromEntries(
    Object.keys(headers).map((name) => [
      name,
      parseTable(name as keyof Tables, h.rows[name]),
    ]),
  ) as Tables;
  let reads = 0;
  const service = new MemberService(
    {
      read: async () => {
        reads++;
        return tables;
      },
    },
    {
      execute: async () => {
        throw Error("unexpected write");
      },
    },
  );
  const actor = {
    authUserId: "user_one@example.com",
    email: "one@example.com",
    firstName: "One",
    lastName: "Member",
    isAdmin: false,
  };
  const portal = await service.getPortal(actor);
  assert.equal(portal.member.MemberID, "KV-001");
  assert.deepEqual(portal.visits, []);
  assert.equal(reads, 1);
  assert.equal(portal.required, 4);
  await assert.rejects(
    service.getMemberByEmail(actor, "two@example.com"),
    /Geen toegang/,
  );
  await assert.rejects(
    service.updateVisitStatus(actor, "id", "APPROVED"),
    /Geen toegang/,
  );
  tables.Members[0].value.Status = "BLOCKED";
  await assert.rejects(service.getMember(actor), /geblokkeerd/);
});
test("progress honors changed threshold and exact previously consumed visits", () => {
  const p = rewardProgress([...initialVisits, ...initialVisits], 0, 3, 4);
  assert.equal(p.total, 6);
  assert.equal(p.current, 2);
  assert.equal(p.percent, 67);
  assert.equal(p.remaining, 1);
});
