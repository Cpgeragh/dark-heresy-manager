// tests/integration/ChatConversation.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
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
const clearChatMock = vi.fn();
const exportChatMock = vi.fn();
vi.mock("../../src/services/chatService", () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessageMock(...args),
  markChatRead: (...args: unknown[]) => markChatReadMock(...args),
  clearChat: (...args: unknown[]) => clearChatMock(...args),
  exportChat: (...args: unknown[]) => exportChatMock(...args),
}));

const downloadTextFileMock = vi.fn();
vi.mock("../../src/utils/downloadTextFile", () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFileMock(...args),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
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
  clearChatMock.mockResolvedValue(undefined);
  exportChatMock.mockResolvedValue({
    exportId: "e1",
    fileName: "kael-chat.txt",
    text: "export text",
    fingerprint: "abc",
    messageCount: 3,
  });
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

    expect(useChatMessagesMock).toHaveBeenCalledWith("player-1", CHAT_ID, null);
  });

  it("hides the history that was moved to the bin", () => {
    const clearedAt = Timestamp.fromDate(new Date(2026, 9, 10));
    renderConversation({
      chat: chat({ clearedAt, lastTimestamp: Timestamp.fromDate(new Date(2026, 9, 12)) }),
    });

    expect(useChatMessagesMock).toHaveBeenCalledWith("player-1", CHAT_ID, clearedAt);
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

  it("shows the message at once, dimmed, while the send is still running", async () => {
    const user = userEvent.setup();
    sendChatMessageMock.mockReturnValue(new Promise(() => undefined));
    renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "On my way");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const bubble = screen.getByText("On my way").closest("[aria-busy]");
    expect(bubble).toHaveAttribute("aria-busy", "true");
    expect(screen.getByPlaceholderText("Message Marcus…")).toHaveValue("");
    expect(screen.queryByText("No messages yet.")).not.toBeInTheDocument();
  });

  it("replaces the dimmed message with the real one when it arrives, with no copy left", async () => {
    const user = userEvent.setup();
    const view = renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "On my way");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(sendChatMessageMock).toHaveBeenCalled());
    expect(screen.getAllByText("On my way")).toHaveLength(1);
    expect(screen.getByText("On my way").closest("[aria-busy]")).not.toBeNull();

    useChatMessagesMock.mockReturnValue(
      messagesState({
        messages: [message({ id: "m9", fromAccountId: "player-1", text: "On my way" })],
      })
    );
    view.rerenderWith({});

    expect(screen.getAllByText("On my way")).toHaveLength(1);
    expect(screen.getByText("On my way").closest("[aria-busy]")).toBeNull();
  });

  it("removes the dimmed message and puts the text back when the send fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendChatMessageMock.mockRejectedValue(new Error("network"));
    renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "On my way");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Message Marcus…")).toHaveValue("On my way")
    );
    expect(document.querySelector("[aria-busy]")).toBeNull();
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("removes the dimmed message when the send is refused", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendChatMessageMock.mockRejectedValue(
      Object.assign(new Error("denied"), { code: "functions/failed-precondition" })
    );
    renderConversation();

    await user.type(screen.getByPlaceholderText("Message Marcus…"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/This chat is closed/)).toBeInTheDocument();
    expect(document.querySelector("[aria-busy]")).toBeNull();
  });

  it("drops a confirmed message that never shows up in the list after a while", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderConversation();

      await user.type(screen.getByPlaceholderText("Message Marcus…"), "Lost one");
      await user.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() => expect(sendChatMessageMock).toHaveBeenCalled());
      expect(screen.getByText("Lost one")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(10_001);
      });

      expect(screen.queryByText("Lost one")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
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
    expect(useChatMessagesMock).toHaveBeenCalledWith("dm-1", null, null);
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

  it("offers Delete chat for a chat that has an entry", () => {
    renderConversation();

    expect(screen.getByRole("button", { name: "Delete chat" })).toBeInTheDocument();
  });

  it("does not offer Delete chat before the chat has started", () => {
    renderConversation({ chat: null });

    expect(screen.queryByRole("button", { name: "Delete chat" })).not.toBeInTheDocument();
  });

  it("still offers Delete chat for a closed chat", () => {
    renderConversation({ chat: chat({ closed: true }) });

    expect(screen.getByRole("button", { name: "Delete chat" })).toBeInTheDocument();
  });

  it("moves the chat to Recently deleted after a Yes, tells the user and calls back", async () => {
    const user = userEvent.setup();
    const onCleared = vi.fn();
    renderConversation({ onCleared });

    await user.click(screen.getByRole("button", { name: "Delete chat" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(clearChatMock).toHaveBeenCalledWith("player-1", CHAT_ID);
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining("Recently deleted"));
    expect(onCleared).toHaveBeenCalledOnce();
  });

  it("does nothing when the user answers No", async () => {
    const user = userEvent.setup();
    const onCleared = vi.fn();
    renderConversation({ onCleared });

    await user.click(screen.getByRole("button", { name: "Delete chat" }));
    await user.click(screen.getByRole("button", { name: "No" }));

    expect(clearChatMock).not.toHaveBeenCalled();
    expect(onCleared).not.toHaveBeenCalled();
  });

  it("shows an error and stays in the chat when deleting fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearChatMock.mockRejectedValue(new Error("offline"));
    const onCleared = vi.fn();
    renderConversation({ onCleared });

    await user.click(screen.getByRole("button", { name: "Delete chat" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(mockToastError).toHaveBeenCalledWith("Failed to delete the chat. Please try again.");
    expect(onCleared).not.toHaveBeenCalled();
  });

  it("offers Export chat for a chat that has an entry, including a closed one", () => {
    const { unmount } = renderConversation();
    expect(screen.getByRole("button", { name: "Export chat" })).toBeInTheDocument();
    unmount();

    renderConversation({ chat: chat({ closed: true }) });
    expect(screen.getByRole("button", { name: "Export chat" })).toBeInTheDocument();
  });

  it("does not offer Export chat before the chat has started", () => {
    renderConversation({ chat: null });

    expect(screen.queryByRole("button", { name: "Export chat" })).not.toBeInTheDocument();
  });

  it("downloads the exported file and says how many messages it holds", async () => {
    const user = userEvent.setup();
    renderConversation();

    await user.click(screen.getByRole("button", { name: "Export chat" }));

    expect(exportChatMock).toHaveBeenCalledWith(CHAT_ID);
    expect(downloadTextFileMock).toHaveBeenCalledWith("kael-chat.txt", "export text");
    expect(mockToastSuccess).toHaveBeenCalledWith("Chat exported with 3 messages.");
  });

  it("shows the server's message and downloads nothing when the export fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    exportChatMock.mockRejectedValue(new Error("This chat is too large to export in one file."));
    renderConversation();

    await user.click(screen.getByRole("button", { name: "Export chat" }));

    expect(mockToastError).toHaveBeenCalledWith("This chat is too large to export in one file.");
    expect(downloadTextFileMock).not.toHaveBeenCalled();
  });
});
