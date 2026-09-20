import test from "node:test";
import assert from "node:assert/strict";
import { rewardProgress, validateVisit } from "../src/lib/loyalty";
import { initialVisits } from "../src/lib/mock-data";
test("pending/rejected visits do not count", () => {
  assert.equal(rewardProgress(initialVisits).percent, 75);
  assert.equal(
    rewardProgress([
      ...initialVisits,
      { ...initialVisits[0], status: "REJECTED" },
    ]).total,
    3,
  );
});
test("cycle stays at 100% until an award then resets", () => {
  const visits = [
    ...initialVisits,
    { ...initialVisits[0], id: "extra", status: "COMPLETED" as const },
  ];
  assert.equal(rewardProgress(visits).percent, 100);
  assert.equal(rewardProgress(visits, 1).percent, 0);
  assert.equal(rewardProgress(visits, 0, 8).percent, 50);
});
test("duplicate, malformed and past bookings rejected", () => {
  assert.match(
    validateVisit("25358026", "2026-11-21", initialVisits, "2026-09-20")!,
    /al geregistreerd/,
  );
  assert.ok(validateVisit("new1", "2026-02-30", [], "2026-01-01"));
  assert.ok(validateVisit("new1", "2026-01-01", [], "2026-09-20"));
  assert.equal(validateVisit("new1", "2026-11-21", [], "2026-09-20"), null);
});
