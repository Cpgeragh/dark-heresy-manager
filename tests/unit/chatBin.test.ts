// tests/unit/chatBin.test.ts
import { describe, it, expect } from "vitest";
import type { Timestamp } from "firebase/firestore";
import { daysLeftInBin, isChatBinned } from "../../src/utils/chatBin";

const at = (millis: number) => ({ toMillis: () => millis }) as unknown as Timestamp;

describe("isChatBinned", () => {
  it("is false for a chat that was never moved to the bin", () => {
    expect(isChatBinned({ lastTimestamp: at(1000) })).toBe(false);
    expect(isChatBinned({ clearedAt: null, lastTimestamp: at(1000) })).toBe(false);
  });

  it("is true when nothing was sent after it was moved to the bin", () => {
    expect(isChatBinned({ clearedAt: at(2000), lastTimestamp: at(1000) })).toBe(true);
  });

  it("is true when the last message has the same time as the bin time", () => {
    expect(isChatBinned({ clearedAt: at(2000), lastTimestamp: at(2000) })).toBe(true);
  });

  it("is false when a newer message arrived after it was moved to the bin", () => {
    expect(isChatBinned({ clearedAt: at(2000), lastTimestamp: at(3000) })).toBe(false);
  });

  it("is true when it has a bin time but no recorded last message", () => {
    expect(isChatBinned({ clearedAt: at(2000), lastTimestamp: null })).toBe(true);
  });
});

describe("daysLeftInBin", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = new Date(2026, 9, 14, 12, 0);

  it("gives the whole retention period for a chat deleted just now", () => {
    expect(daysLeftInBin(at(now.getTime()), now)).toBe(7);
  });

  it("rounds a part day up, so the last day still counts", () => {
    expect(daysLeftInBin(at(now.getTime() - 3.5 * DAY), now)).toBe(4);
    expect(daysLeftInBin(at(now.getTime() - 6.9 * DAY), now)).toBe(1);
  });

  it("gives zero once the retention period has passed", () => {
    expect(daysLeftInBin(at(now.getTime() - 7 * DAY), now)).toBe(0);
    expect(daysLeftInBin(at(now.getTime() - 20 * DAY), now)).toBe(0);
  });
});
