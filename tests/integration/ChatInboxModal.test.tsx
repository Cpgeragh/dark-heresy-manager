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

vi.mock("../../src/components/chat/ChatConversation", () => ({
  ChatConversation: ({
    accountId,
    target,
    chat,
  }: {
    accountId: string;
    target: ChatTarget;
    chat: ChatSummaryWithId | null;
  }) => (
    <div data-testid="conversation">
      {JSON.stringify({ accountId, target, chatId: chat?.id ?? null })}
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

beforeEach(() => {
  vi.clearAllMocks();
  useChatsContextMock.mockReturnValue({
    chats: [chatEntry],
    loading: false,
    error: null,
    unreadTotal: 0,
  });
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
  return JSON.parse(screen.getByTestId("conversation").textContent ?? "{}");
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
    useChatsContextMock.mockReturnValue({
      chats: [],
      loading: true,
      error: new Error("boom"),
      unreadTotal: 0,
    });
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
    useChatsContextMock.mockReturnValue({ chats: [], loading: false, error: null, unreadTotal: 0 });
    renderModal({ ...startedTarget, characterName: "Sister Vex" });

    await user.click(screen.getByRole("button", { name: "open chat" }));

    expect(screen.getByRole("dialog", { name: "Sister Vex" })).toBeInTheDocument();
    expect(conversationProps().chatId).toBeNull();
  });

  it("falls back to a plain title when no name is known", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue({ chats: [], loading: false, error: null, unreadTotal: 0 });
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
