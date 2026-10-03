import { describe, expect, it } from "vitest";
import { validateXpHistoryPayload, xpHistoryDate } from "../../src/utils/xpHistory";

const validEntry = {
  amountXp: 200,
  balanceXp: 1_200,
  reason: "Recovered the relic",
  source: "session-award",
  actorUid: "dm-1",
  actorRole: "dm",
  createdAt: new Date("2026-10-01T18:30:00.000Z"),
};

describe("XP history payloads", () => {
  it("accepts a complete server-written history entry", () => {
    expect(validateXpHistoryPayload(validEntry)).toBe(true);
  });

  it("rejects invalid balances, sources and actor roles", () => {
    expect(validateXpHistoryPayload({ ...validEntry, balanceXp: -1 })).toBe(false);
    expect(validateXpHistoryPayload({ ...validEntry, source: "manual" })).toBe(false);
    expect(validateXpHistoryPayload({ ...validEntry, actorRole: "admin" })).toBe(false);
  });

  it("normalises Firestore timestamps and stored dates", () => {
    const date = new Date("2026-10-01T18:30:00.000Z");
    expect(xpHistoryDate(date)).toBe(date);
    expect(xpHistoryDate({ toDate: () => date } as never)).toBe(date);
  });
});
