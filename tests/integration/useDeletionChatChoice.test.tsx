// tests/integration/useDeletionChatChoice.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
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

import {
  useDeletionChatChoice,
  type DeletionScope,
} from "../../src/components/chat/useDeletionChatChoice";

function chat(
  characterId: string,
  over: Partial<ChatSummaryWithId> & { campaignId?: string } = {}
): ChatSummaryWithId {
  const campaignId = over.campaignId ?? "c1";
  return {
    id: `${campaignId}__${characterId}__player-1`,
    campaignId,
    characterId,
    playerAccountId: "player-1",
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    campaignName: "Calixis",
    characterName: characterId,
    lastMessage: "Hello",
    lastTimestamp: null,
    unreadCount: 0,
    closed: true,
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

function Harness({ scope, about }: { scope: DeletionScope; about: "character" | "campaign" }) {
  const { ask, modals } = useDeletionChatChoice({ accountId: "dm-1", about });
  const [finished, setFinished] = useState(false);
  return (
    <>
      <button
        onClick={async () => {
          await ask(scope);
          setFinished(true);
        }}
      >
        go
      </button>
      {finished && <p>finished</p>}
      {modals}
    </>
  );
}

function setup(
  scope: DeletionScope = { campaignId: "c1", characterId: "char-1" },
  about: "character" | "campaign" = "character"
) {
  return render(<Harness scope={scope} about={about} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatsContextMock.mockReturnValue(chatsState([chat("char-1")]));
  clearChatMock.mockResolvedValue(undefined);
});

describe("useDeletionChatChoice", () => {
  it("carries on at once when there is no chat in scope", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([]));
    setup();

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(await screen.findByText("finished")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks about one chat and waits for the answer", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(await screen.findByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    expect(screen.queryByText("finished")).not.toBeInTheDocument();
  });

  it("asks about every chat in a campaign when no character is given", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([chat("char-1"), chat("char-2")]));
    setup({ campaignId: "c1" }, "campaign");

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(await screen.findByRole("dialog", { name: "Keep your chats?" })).toBeInTheDocument();
    expect(screen.getByText(/You have 2 chats about this campaign/)).toBeInTheDocument();
  });

  it("leaves out chats of other characters, other campaigns and chats already in the bin", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(
      chatsState([
        chat("char-1"),
        chat("char-2"),
        chat("char-1", { campaignId: "c2" }),
        chat("char-1", {
          id: "c1__char-1__player-2",
          clearedAt: Timestamp.fromMillis(2000),
          lastTimestamp: Timestamp.fromMillis(1000),
        }),
      ])
    );
    setup();

    await user.click(screen.getByRole("button", { name: "go" }));
    await user.click(
      await screen.findByRole("button", { name: "Move My Chat to Recently Deleted" })
    );

    await waitFor(() => expect(screen.getByText("finished")).toBeInTheDocument());
    expect(clearChatMock).toHaveBeenCalledOnce();
    expect(clearChatMock).toHaveBeenCalledWith("dm-1", "c1__char-1__player-1");
  });

  it("carries on without deleting when the DM keeps the chats", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "go" }));
    await user.click(await screen.findByRole("button", { name: "Keep My Chat" }));

    expect(await screen.findByText("finished")).toBeInTheDocument();
    expect(clearChatMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves every chat to Recently deleted and carries on when the DM deletes them", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([chat("char-1"), chat("char-2")]));
    setup({ campaignId: "c1" }, "campaign");

    await user.click(screen.getByRole("button", { name: "go" }));
    await user.click(
      await screen.findByRole("button", { name: "Move My Chats to Recently Deleted" })
    );

    expect(await screen.findByText("finished")).toBeInTheDocument();
    expect(clearChatMock).toHaveBeenCalledTimes(2);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Chats moved to Recently deleted. You can restore them for 7 days."
    );
  });

  it("keeps asking about only the failed chats, and retries only those", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    useChatsContextMock.mockReturnValue(chatsState([chat("char-1"), chat("char-2")]));
    let offline = true;
    clearChatMock.mockImplementation(async (_account: string, chatId: string) => {
      if (offline && chatId.includes("char-2")) throw new Error("offline");
    });
    setup({ campaignId: "c1" }, "campaign");

    await user.click(screen.getByRole("button", { name: "go" }));
    await user.click(
      await screen.findByRole("button", { name: "Move My Chats to Recently Deleted" })
    );

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to delete the chat. Please try again.")
    );
    expect(screen.getByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    expect(screen.queryByText("finished")).not.toBeInTheDocument();

    offline = false;
    clearChatMock.mockClear();
    await user.click(screen.getByRole("button", { name: "Move My Chat to Recently Deleted" }));

    expect(await screen.findByText("finished")).toBeInTheDocument();
    expect(clearChatMock).toHaveBeenCalledOnce();
    expect(clearChatMock).toHaveBeenCalledWith("dm-1", "c1__char-2__player-1");
  });

  it("uses the list as it is when asked, not as it was when the hook first rendered", async () => {
    const user = userEvent.setup();
    useChatsContextMock.mockReturnValue(chatsState([]));
    const view = setup();

    useChatsContextMock.mockReturnValue(chatsState([chat("char-1")]));
    view.rerender(
      <Harness scope={{ campaignId: "c1", characterId: "char-1" }} about="character" />
    );
    await user.click(screen.getByRole("button", { name: "go" }));

    expect(await screen.findByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
  });
});
