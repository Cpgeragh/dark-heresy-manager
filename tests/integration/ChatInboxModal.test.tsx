// tests/integration/ChatInboxModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { ChatSummaryWithId } from "../../src/types/Firestore";
import type { ChatTarget } from "../../src/components/chat/chatTarget";

const { useChatsContextMock } = vi.hoisted(() => ({ useChatsContextMock: vi.fn() }));

vi.mock("../../src/context/useChatsContext", () => ({
  useChatsContext: () => useChatsContextMock(),
}));

vi.mock("../../src/components/chat/ChatInboxList", () => ({
  ChatInboxList: ({
    chats,
    loading,
    error,
    scrollRoot,
    onOpenChat,
  }: {
    chats: ChatSummaryWithId[];
    loading: boolean;
    error: Error | null;
    scrollRoot?: Element | null;
    onOpenChat: (chat: ChatSummaryWithId) => void;
  }) => (
    <div
      data-testid="list"
      data-loading={String(loading)}
      data-error={String(error !== null)}
      data-has-scroll-root={String(scrollRoot instanceof HTMLElement)}
    >
      {chats.map((chat) => (
        <button key={chat.id} onClick={() => onOpenChat(chat)}>
          {`open ${chat.characterName}`}
        </button>
      ))}
    </div>
  ),
}));

const { restoreChatMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  restoreChatMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("../../src/services/chatService", () => ({
  restoreChat: (...args: unknown[]) => restoreChatMock(...args),
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: toastErrorMock, success: toastSuccessMock }),
}));

vi.mock("../../src/components/chat/ChatBinList", () => ({
  ChatBinList: ({
    chats,
    onRestore,
  }: {
    chats: ChatSummaryWithId[];
    onRestore: (chat: ChatSummaryWithId) => void;
  }) => (
    <div data-testid="bin">
      {chats.map((chat) => (
        <button key={chat.id} onClick={() => onRestore(chat)}>
          {`restore ${chat.characterName}`}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../src/components/chat/ChatConversation", () => ({
  ChatConversation: ({
    accountId,
    target,
    chat,
    onCleared,
  }: {
    accountId: string;
    target: ChatTarget;
    chat: ChatSummaryWithId | null;
    onCleared?: () => void;
  }) => (
    <div data-testid="conversation">
      <span data-testid="conversation-data">
        {JSON.stringify({ accountId, target, chatId: chat?.id ?? null })}
      </span>
      <button onClick={onCleared}>finish delete</button>
    </div>
  ),
}));

import { ChatInboxModal } from "../../src/components/chat/ChatInboxModal";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";

const CHAT_ID = "c1__char-1__player-1";

const chatEntry: ChatSummaryWithId = {
  id: CHAT_ID,
  campaignId: "c1",
  characterId: "char-1",
  playerAccountId: "player-1",
  role: "dm",
  otherAccountId: "player-1",
  otherName: "Anna",
  campaignName: "Calixis",
  characterName: "Brother Kael",
  lastMessage: "Hello",
  lastTimestamp: null,
  unreadCount: 0,
  closed: false,
};

function chatsState(
  chats: ChatSummaryWithId[],
  over: { loading?: boolean; error?: Error | null } = {}
) {
  return {
    chats,
    activeChats: chats,
    clearedChats: [] as ChatSummaryWithId[],
    loading: false,
    error: null,
    unreadTotal: 0,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatsContextMock.mockReturnValue(chatsState([chatEntry]));
});

function Controls({ target }: { target: ChatTarget }) {
  const { openInbox, openChat } = useChatInbox();
  return (
    <>
      <button onClick={openInbox}>open inbox</button>
      <button onClick={() => openChat(target)}>open chat</button>
    </>
  );
}

const startedTarget: ChatTarget = {
  campaignId: "c1",
  characterId: "char-1",
  playerAccountId: "player-1",
};

function renderModal(target: ChatTarget = startedTarget) {
  return render(
    <ChatInboxProvider>
      <Controls target={target} />
      <ChatInboxModal accountId="dm-1" />
    </ChatInboxProvider>
  );
}

function conversationProps() {
  return JSON.parse(screen.getByTestId("conversation-data").textContent ?? "{}");
}

describe("ChatInboxModal", () => {
  it("shows nothing until it is opened", () => {
    renderModal();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on the chat list with no back arrow", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));

    expect(screen.getByRole("dialog", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "open Brother Kael" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to messages" })).not.toBeInTheDocument();
  });

  it("gives the list its loading state, its error state and its own scroll area", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(
      chatsState([], { loading: true, error: new Error("boom") })
    );
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));

    const list = screen.getByTestId("list");
    expect(list).toHaveAttribute("data-loading", "true");
    expect(list).toHaveAttribute("data-error", "true");
    expect(list).toHaveAttribute("data-has-scroll-root", "true");
  });

  it("opens the conversation for the chat that was pressed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    await user.click(screen.getByRole("button", { name: "open Brother Kael" }));

    expect(screen.getByRole("dialog", { name: "Brother Kael" })).toBeInTheDocument();
    expect(conversationProps()).toEqual({
      accountId: "dm-1",
      target: {
        campaignId: "c1",
        characterId: "char-1",
        playerAccountId: "player-1",
        characterName: "Brother Kael",
      },
      chatId: CHAT_ID,
    });
    expect(screen.getByRole("button", { name: "Back to messages" })).toBeInTheDocument();
  });

  it("opens a conversation directly and finds its chat entry", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open chat" }));

    expect(screen.getByRole("dialog", { name: "Brother Kael" })).toBeInTheDocument();
    expect(conversationProps().chatId).toBe(CHAT_ID);
  });

  it("uses the name from the target before the chat has started", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([]));
    renderModal({ ...startedTarget, characterName: "Sister Vex" });

    await user.click(screen.getByRole("button", { name: "open chat" }));

    expect(screen.getByRole("dialog", { name: "Sister Vex" })).toBeInTheDocument();
    expect(conversationProps().chatId).toBeNull();
  });

  it("falls back to a plain title when no name is known", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([]));
    renderModal();

    await user.click(screen.getByRole("button", { name: "open chat" }));

    expect(screen.getByRole("dialog", { name: "Chat" })).toBeInTheDocument();
  });

  it("goes back from a conversation to the list", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open chat" }));
    await user.click(screen.getByRole("button", { name: "Back to messages" }));

    expect(screen.getByRole("dialog", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByTestId("list")).toBeInTheDocument();
  });

  it("lists only active chats but still finds a binned chat for a direct conversation", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue({
      ...chatsState([chatEntry]),
      activeChats: [],
      clearedChats: [chatEntry],
    });
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    expect(screen.queryByRole("button", { name: "open Brother Kael" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "open chat" }));
    expect(conversationProps().chatId).toBe(CHAT_ID);
  });

  it("opens on the Chats tab with a Recently deleted tab beside it", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));

    expect(screen.getByRole("tab", { name: "Chats", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Recently deleted" })).toBeInTheDocument();
    expect(screen.getByTestId("list")).toBeInTheDocument();
  });

  it("shows the deleted chats under Recently deleted", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue({
      ...chatsState([chatEntry]),
      activeChats: [],
      clearedChats: [chatEntry],
    });
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    await user.click(screen.getByRole("tab", { name: "Recently deleted" }));

    expect(screen.queryByTestId("list")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "restore Brother Kael" })).toBeInTheDocument();
  });

  it("restores a deleted chat and tells the user", async () => {
    const user = userEvent.setup();
    restoreChatMock.mockResolvedValue(undefined);
    useChatsContextMock.mockReturnValue({ ...chatsState([chatEntry]), clearedChats: [chatEntry] });
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    await user.click(screen.getByRole("tab", { name: "Recently deleted" }));
    await user.click(screen.getByRole("button", { name: "restore Brother Kael" }));

    expect(restoreChatMock).toHaveBeenCalledWith("dm-1", CHAT_ID);
    expect(toastSuccessMock).toHaveBeenCalledWith("Chat restored.");
  });

  it("shows an error when restoring fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    restoreChatMock.mockRejectedValue(new Error("offline"));
    useChatsContextMock.mockReturnValue({ ...chatsState([chatEntry]), clearedChats: [chatEntry] });
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    await user.click(screen.getByRole("tab", { name: "Recently deleted" }));
    await user.click(screen.getByRole("button", { name: "restore Brother Kael" }));

    expect(toastErrorMock).toHaveBeenCalledWith("Failed to restore the chat. Please try again.");
  });

  it("returns to the chat list after a conversation is deleted", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open chat" }));
    await user.click(screen.getByRole("button", { name: "finish delete" }));

    expect(screen.getByRole("dialog", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByTestId("list")).toBeInTheDocument();
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    await user.click(screen.getByRole("button", { name: "Close messages" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the dialog is dismissed with Escape", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "open inbox" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
