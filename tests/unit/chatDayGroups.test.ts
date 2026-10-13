// tests/unit/chatDayGroups.test.ts
import { describe, it, expect } from "vitest";
import type { Timestamp } from "firebase/firestore";
import type { ChatMessage } from "../../src/types/Firestore";
import { buildChatListItems } from "../../src/utils/chatDayGroups";

function message(id: string, date: Date | null): ChatMessage {
  return {
    id,
    fromAccountId: "account-1",
    text: id,
    timestamp: date ? ({ toDate: () => date } as Timestamp) : null,
  };
}

const now = new Date(2026, 9, 13, 15, 0);

describe("buildChatListItems", () => {
  it("returns nothing when there are no messages", () => {
    expect(buildChatListItems([], now)).toEqual([]);
  });

  it("puts one Today divider above messages from the same day", () => {
    const items = buildChatListItems(
      [message("a", new Date(2026, 9, 13, 9, 0)), message("b", new Date(2026, 9, 13, 10, 0))],
      now
    );

    expect(items.map((item) => item.kind)).toEqual(["divider", "message", "message"]);
    expect(items[0]).toMatchObject({ label: "Today" });
  });

  it("labels the previous day Yesterday", () => {
    const items = buildChatListItems([message("a", new Date(2026, 9, 12, 20, 0))], now);

    expect(items[0]).toMatchObject({ label: "Yesterday" });
  });

  it("writes older days as a full date", () => {
    const older = new Date(2026, 9, 3, 12, 0);
    const items = buildChatListItems([message("a", older)], now);

    expect(items[0]).toMatchObject({
      label: older.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
  });

  it("starts a new divider when the day changes across midnight", () => {
    const items = buildChatListItems(
      [message("a", new Date(2026, 9, 12, 23, 59)), message("b", new Date(2026, 9, 13, 0, 1))],
      now
    );

    expect(items.map((item) => item.kind)).toEqual(["divider", "message", "divider", "message"]);
    expect(items.filter((item) => item.kind === "divider").map((item) => item.label)).toEqual([
      "Yesterday",
      "Today",
    ]);
  });

  it("treats a message still waiting for its server time as today", () => {
    const items = buildChatListItems([message("a", null)], now);

    expect(items[0]).toMatchObject({ label: "Today" });
  });

  it("keys each message by its id so the list keeps its place", () => {
    const items = buildChatListItems([message("a", new Date(2026, 9, 13, 9, 0))], now);

    expect(items[1]).toMatchObject({ kind: "message", key: "a" });
  });
});
