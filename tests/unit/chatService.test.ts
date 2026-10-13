// tests/unit/chatService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCallSend, mockDoc, mockUpdateDoc } = vi.hoisted(() => ({
  mockCallSend: vi.fn(),
  mockDoc: vi.fn((...args: unknown[]) => ({ path: args.slice(1).join("/") })),
  mockUpdateDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => mockCallSend),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db", functions: "mock-functions" }));

vi.mock("../../src/performance/performanceMetrics", () => ({
  measurePerformanceMutation: <T>(_name: string, operation: () => Promise<T>) => operation(),
}));

import { markChatRead, sendChatMessage } from "../../src/services/chatService";

beforeEach(() => {
  vi.clearAllMocks();
  mockCallSend.mockResolvedValue({ data: { chatId: "c1__char-1__player-1", messageId: "m1" } });
  mockUpdateDoc.mockResolvedValue(undefined);
});

describe("sendChatMessage", () => {
  it("sends the trimmed text with a fresh operation id and returns the result", async () => {
    const result = await sendChatMessage("c1", "char-1", "  Hello there  ");

    expect(result).toEqual({ chatId: "c1__char-1__player-1", messageId: "m1" });
    expect(mockCallSend).toHaveBeenCalledTimes(1);
    expect(mockCallSend).toHaveBeenCalledWith({
      campaignId: "c1",
      characterId: "char-1",
      text: "Hello there",
      operationId: expect.any(String),
    });
  });

  it("uses a different operation id for each separate send", async () => {
    await sendChatMessage("c1", "char-1", "First");
    await sendChatMessage("c1", "char-1", "First");

    const ids = mockCallSend.mock.calls.map(([payload]) => payload.operationId);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("makes one call when the same message is sent twice at once", async () => {
    let finish: (value: unknown) => void = () => {};
    mockCallSend.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );

    const first = sendChatMessage("c1", "char-1", "Once only");
    const second = sendChatMessage("c1", "char-1", "Once only");
    finish({ data: { chatId: "chat", messageId: "m1" } });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { chatId: "chat", messageId: "m1" },
      { chatId: "chat", messageId: "m1" },
    ]);
    expect(mockCallSend).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid id, empty text and over-long text without calling the function", async () => {
    await expect(sendChatMessage("c1/threads/x", "char-1", "hi")).rejects.toThrow("invalid");
    await expect(sendChatMessage("c1", "", "hi")).rejects.toThrow("invalid");
    await expect(sendChatMessage("c1", "char-1", "   ")).rejects.toThrow("cannot be empty");
    await expect(sendChatMessage("c1", "char-1", "a".repeat(2001))).rejects.toThrow(
      "cannot exceed 2000"
    );
    expect(mockCallSend).not.toHaveBeenCalled();
  });
});

describe("markChatRead", () => {
  it("sets this account's unread count on the chat to zero", async () => {
    await markChatRead("acc-1", "chat-1", 3);

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "users", "acc-1", "chats", "chat-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "users/acc-1/chats/chat-1" },
      { unreadCount: 0 }
    );
  });

  it("writes nothing when there is nothing unread", async () => {
    await markChatRead("acc-1", "chat-1", 0);

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("rejects a bad count or id without writing", async () => {
    await expect(markChatRead("acc-1", "chat-1", -1)).rejects.toThrow("non-negative");
    await expect(markChatRead("acc-1", "chat-1", 1.5)).rejects.toThrow("non-negative");
    await expect(markChatRead("a/b", "chat-1", 1)).rejects.toThrow("invalid");
    await expect(markChatRead("acc-1", "", 1)).rejects.toThrow("invalid");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
