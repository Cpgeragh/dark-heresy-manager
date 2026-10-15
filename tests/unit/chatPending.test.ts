// tests/unit/chatPending.test.ts
import { describe, it, expect } from "vitest";
import { isPendingMessage, pendingToMessage } from "../../src/utils/chatPending";

const pending = { localId: "abc", text: "On my way", sentAt: 1_700_000_000_000, serverId: null };

describe("pendingToMessage", () => {
  it("makes a message from the sender's account with the client time", () => {
    const message = pendingToMessage(pending, "player-1");

    expect(message.fromAccountId).toBe("player-1");
    expect(message.text).toBe("On my way");
    expect(message.timestamp?.toMillis()).toBe(1_700_000_000_000);
  });

  it("gives an id that cannot clash with a real message id", () => {
    expect(pendingToMessage(pending, "player-1").id).toBe("pending:abc");
  });
});

describe("isPendingMessage", () => {
  it("recognises a pending message and no other", () => {
    expect(isPendingMessage(pendingToMessage(pending, "player-1"))).toBe(true);
    expect(isPendingMessage({ id: "m1", fromAccountId: "dm-1", text: "Hi", timestamp: null })).toBe(
      false
    );
  });
});
