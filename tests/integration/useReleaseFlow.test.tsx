// tests/integration/useReleaseFlow.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

const { useChatsContextMock, clearChatMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  useChatsContextMock: vi.fn(),
  clearChatMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("../../src/context/useChatsContext", () => ({
  useChatsContext: () => useChatsContextMock(),
}));
vi.mock("../../src/services/chatService", () => ({
  clearChat: (...args: unknown[]) => clearChatMock(...args),
}));
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: toastErrorMock, success: toastSuccessMock }),
}));

import { useReleaseFlow } from "../../src/components/chat/useReleaseFlow";

const CHAT_ID = "c1__char-1__player-1";

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
    lastMessage: "Hello",
    lastTimestamp: null,
    unreadCount: 0,
    closed: false,
    ...over,
  };
}

function chatsState(chats: ChatSummaryWithId[]) {
  return {
    chats,
    activeChats: chats,
    clearedChats: [],
    loading: false,
    error: null,
    unreadTotal: 0,
  };
}

function Harness({
  release,
  onFinished,
  chatId = CHAT_ID,
}: {
  release: () => Promise<boolean>;
  onFinished: () => void;
  chatId?: string | null;
}) {
  const { begin, active, modals } = useReleaseFlow({
    accountId: "player-1",
    chatId,
    release,
    onFinished,
    confirm: {
      title: "Release this character?",
      message: "It will be unlinked from your account.",
      confirmLabel: "Release",
    },
  });
  return (
    <>
      <button onClick={begin}>start</button>
      <p>{active ? "flow active" : "flow idle"}</p>
      {modals}
    </>
  );
}

function setup(over: { release?: () => Promise<boolean>; chatId?: string | null } = {}) {
  const release = over.release ?? vi.fn(async () => true);
  const onFinished = vi.fn();
  render(<Harness release={release} onFinished={onFinished} chatId={over.chatId} />);
  return { release, onFinished };
}

async function startAndConfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "start" }));
  await user.click(screen.getByRole("button", { name: "Release" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatsContextMock.mockReturnValue(chatsState([chat()]));
  clearChatMock.mockResolvedValue(undefined);
});

describe("useReleaseFlow", () => {
  it("shows nothing until it begins, then asks to confirm the release", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "start" }));

    expect(screen.getByRole("dialog", { name: "Release this character?" })).toBeInTheDocument();
  });

  it("does nothing if the person cancels", async () => {
    const user = userEvent.setup();
    const { release, onFinished } = setup();

    await user.click(screen.getByRole("button", { name: "start" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(release).not.toHaveBeenCalled();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("closes without asking about the chat when the release fails", async () => {
    const user = userEvent.setup();
    const { onFinished } = setup({ release: vi.fn(async () => false) });

    await startAndConfirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("treats a release that throws like a failed release", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { onFinished } = setup({
      release: vi.fn(async () => {
        throw new Error("boom");
      }),
    });

    await startAndConfirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("asks whether to keep the chat after a successful release, and waits for the answer", async () => {
    const user = userEvent.setup();
    const { onFinished } = setup();

    await startAndConfirm(user);

    expect(await screen.findByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("carries on without deleting when the person keeps the chat", async () => {
    const user = userEvent.setup();
    const { onFinished } = setup();

    await startAndConfirm(user);
    await user.click(await screen.findByRole("button", { name: "Keep my chat" }));

    expect(clearChatMock).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves the chat to Recently deleted and carries on when the person deletes it", async () => {
    const user = userEvent.setup();
    const { onFinished } = setup();

    await startAndConfirm(user);
    await user.click(await screen.findByRole("button", { name: "Delete my chat" }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledOnce());
    expect(clearChatMock).toHaveBeenCalledWith("player-1", CHAT_ID);
    expect(toastSuccessMock).toHaveBeenCalledWith(expect.stringContaining("Recently deleted"));
  });

  it("keeps asking when the delete fails, and still lets the person keep the chat", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearChatMock.mockRejectedValue(new Error("offline"));
    const { onFinished } = setup();

    await startAndConfirm(user);
    await user.click(await screen.findByRole("button", { name: "Delete my chat" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to delete the chat. Please try again.")
    );
    expect(screen.getByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Keep my chat" }));
    expect(onFinished).toHaveBeenCalledOnce();
  });

  it("uses the chat it found before the release, even if the list changes during it", async () => {
    const user = userEvent.setup();
    setup({
      release: vi.fn(async () => {
        useChatsContextMock.mockReturnValue(chatsState([]));
        return true;
      }),
    });

    await startAndConfirm(user);

    expect(await screen.findByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
  });

  it("carries on straight away when there is no chat to decide about", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([]));
    const { onFinished } = setup();

    await startAndConfirm(user);

    await waitFor(() => expect(onFinished).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("carries on straight away when there is no chat id", async () => {
    const user = userEvent.setup();
    const { onFinished } = setup({ chatId: null });

    await startAndConfirm(user);

    await waitFor(() => expect(onFinished).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("carries on straight away when the chat is already in the bin", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(
      chatsState([
        chat({
          clearedAt: Timestamp.fromMillis(2000),
          lastTimestamp: Timestamp.fromMillis(1000),
        }),
      ])
    );
    const { onFinished } = setup();

    await startAndConfirm(user);

    await waitFor(() => expect(onFinished).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports that the flow is in progress from the confirmation until the last choice", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText("flow idle")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByText("flow active")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("flow idle")).toBeInTheDocument();

    await startAndConfirm(user);
    await screen.findByRole("dialog", { name: "Keep your chat?" });
    expect(screen.getByText("flow active")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep my chat" }));
    expect(screen.getByText("flow idle")).toBeInTheDocument();
  });

  it("gives the same begin function on every render", async () => {
    const user = userEvent.setup();
    const seen: unknown[] = [];
    function Recorder() {
      const { begin, modals } = useReleaseFlow({
        accountId: "player-1",
        chatId: CHAT_ID,
        release: async () => true,
        onFinished: () => undefined,
        confirm: { title: "Release?", message: "Message.", confirmLabel: "Release" },
      });
      useEffect(() => {
        seen.push(begin);
      });
      return (
        <>
          <button onClick={begin}>open</button>
          {modals}
        </>
      );
    }
    render(<Recorder />);

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);
  });
});
