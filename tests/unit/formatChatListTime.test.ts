// tests/unit/formatChatListTime.test.ts
import { describe, it, expect } from "vitest";
import { formatChatListTime } from "../../src/utils/formatChatListTime";

const now = new Date(2026, 9, 13, 15, 0);

describe("formatChatListTime", () => {
  it("shows the clock time for today", () => {
    const date = new Date(2026, 9, 13, 9, 5);

    expect(formatChatListTime(date, now)).toBe(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  });

  it("says Yesterday for the previous day", () => {
    expect(formatChatListTime(new Date(2026, 9, 12, 23, 0), now)).toBe("Yesterday");
  });

  it("shows a short date for older days this year", () => {
    const date = new Date(2026, 9, 3, 12, 0);

    expect(formatChatListTime(date, now)).toBe(
      date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    );
  });

  it("includes the year for days in an earlier year", () => {
    const date = new Date(2025, 11, 30, 12, 0);

    expect(formatChatListTime(date, now)).toBe(
      date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    );
  });
});
