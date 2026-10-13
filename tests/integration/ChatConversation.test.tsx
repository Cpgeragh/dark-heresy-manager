// tests/integration/ChatConversation.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import type { ChatMessage, ChatSummaryWithId } from "../../src/types/Firestore";

const useChatMessagesMock = vi.fn();
vi.mock("../../src/hooks/useChatMessages", () => ({
  useChatMessages: (...args: unknown[]) => useChatMessagesMock(...args),
}));

const sendChatMessageMock = vi.fn();
const markChatReadMock = vi.fn();
vi.mock("../../src/services/chatService", () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessageMock(...args),
  markChatRead: (...args: unknown[]) => markChatReadMock(...args),
}));

const mockToastError = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: vi.fn() }),
}));

import { ChatConversation } from "../../src/components/chat/ChatConversation";

const CHAT_ID = "c1__char-1__player-1";
const target = { campaignId: "c1", characterId: "char-1", playerAccountId: "player-1" };

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  useChatMessagesMock.mockReturnValue(messagesState());
  sendChatMessageMock.mockResolvedValue({ chatId: CHAT_ID, messageId: "m9" });
  markChatReadMock.mockResolvedValue(undefined);
});

function messagesState(over: Record<string, unknown> = {}) {
  return {
    messages: [] as ChatMessage[],
    loading: false,
    error: null,
    loadOlder: vi.fn(),
    loadingOlder: false,
    olderError: null,
    hasOlderMessages: false,
    ...over,
  };
}

function message(over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m1",
    fromAccountId: "dm-1",
    text: "Hello there",
    timestamp: Timestamp.fromDate(new Date()),
    ...over,
  };
}

function chat(over: Partial<ChatSummaryWithId> = {}): ChatSummaryWithId {
  return {
    id: CHAT_ID,
    campaignId: "c1",
    characterId: "char-1",
    playerAccountId: "player-1",
    role: "player",
    otherAccountId: "dm-1",
    otherName: "Marcus",
    campaignName: "Calixis",
    characterName: "Brother Kael",
    lastMessage: "Hello there",
    lastTimestamp: null,
    unreadCount: 0,
    closed: false,
    ...over,
  };
}

function renderConversation(props: Partial<React.ComponentProps<typeof ChatConversation>> = {}) {
  const element = (
    <ChatConversation accountId="player-1" target={target} chat={chat()} {...props} />
  );
  const result = render(element);
  return {
    ...result,
    rerenderWith: (next: Partial<React.ComponentProps<typeof ChatConversation>>) =>
      result.rerender(
        <ChatConversation accountId="player-1" target={target} chat={chat()} {...next} />
      ),
  };
}

describe("ChatConversation", () => {
  it("reads the messages of this account's copy of the chat", () => {
    renderConversation();

    expect(useChatMessagesMock).toHaveBeenCalledWith("player-1", CHAT_ID);
  });

  it("shows the messages and a reply box addressed to the other person", () => {
    useChatMessagesMock.mockReturnValue(
      messagesState({ messages: [message({ text: "Watch the eastern gate" })] })
    );
    renderConversation();

    expect(screen.getByText("Watch the eastern gate")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Message Marcus…")).toBeInTheDocument();
  });

  it("works before the first message exists, with no chat entry yet", () => {
    renderConversation({ chat: null });

    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a message…")).toBeInTheDocument();
  });

  it("sends with the campaign and character ids", async () => {
    const user = userEvent.setup();
    renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "On my way");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(sendChatMessageMock).toHaveBeenCalledWith("c1", "char-1", "On my way");
  });

  it("keeps the draft and shows an error toast when a send fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendChatMessageMock.mockRejectedValue(new Error("network"));
    renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "On my way");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockToastError).toHaveBeenCalledWith("Failed to send message. Please try again.");
    expect(screen.getByPlaceholderText("Message Marcus…")).toHaveValue("On my way");
  });

  it("treats a refused send as a closed chat", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendChatMessageMock.mockRejectedValue(
      Object.assign(new Error("denied"), { code: "functions/permission-denied" })
    );
    renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/This chat is closed/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Message Marcus…")).not.toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("shows a note and no reply box for a closed chat", () => {
    renderConversation({ chat: chat({ closed: true }) });

    expect(screen.getByText(/This chat is closed/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Message Marcus…")).not.toBeInTheDocument();
  });

  it("marks the chat read when it opens with unread messages", () => {
    renderConversation({ chat: chat({ unreadCount: 3 }) });

    expect(markChatReadMock).toHaveBeenCalledWith("player-1", CHAT_ID, 3);
  });

  it("does not mark the chat read when nothing is unread", () => {
    renderConversation({ chat: chat({ unreadCount: 0 }) });

    expect(markChatReadMock).not.toHaveBeenCalled();
  });

  it("marks the chat read again when a new message arrives while it is open", () => {
    const { rerenderWith } = renderConversation({ chat: chat({ unreadCount: 2 }) });

    rerenderWith({ chat: chat({ unreadCount: 0 }) });
    rerenderWith({ chat: chat({ unreadCount: 1 }) });

    expect(markChatReadMock).toHaveBeenCalledTimes(2);
    expect(markChatReadMock).toHaveBeenLastCalledWith("player-1", CHAT_ID, 1);
  });

  it("explains that nobody has claimed the character and offers no reply box", () => {
    renderConversation({
      accountId: "dm-1",
      target: { campaignId: "c1", characterId: "char-1", playerAccountId: null },
      chat: null,
    });

    expect(screen.getByText(/Nobody has claimed this character yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    expect(useChatMessagesMock).toHaveBeenCalledWith("dm-1", null);
  });

  it("shows an error when the conversation cannot be loaded", () => {
    useChatMessagesMock.mockReturnValue(messagesState({ error: new Error("boom") }));
    renderConversation();

    expect(screen.getByText("Unable to load this conversation.")).toBeInTheDocument();
  });

  it("hides the message list while the conversation is loading", () => {
    useChatMessagesMock.mockReturnValue(messagesState({ loading: true }));
    renderConversation();

    expect(screen.queryByText("No messages yet.")).not.toBeInTheDocument();
  });

  it("passes older message loading through to the list", async () => {
    const user = userEvent.setup();
    const loadOlder = vi.fn();
    useChatMessagesMock.mockReturnValue(
      messagesState({ messages: [message()], hasOlderMessages: true, loadOlder })
    );
    renderConversation();

    await user.click(screen.getByRole("button", { name: "Load older messages" }));

    expect(loadOlder).toHaveBeenCalled();
  });
});
