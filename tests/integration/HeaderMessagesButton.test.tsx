// tests/integration/HeaderMessagesButton.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { useChatsContextMock, useHeaderExtensionMock } = vi.hoisted(() => ({
  useChatsContextMock: vi.fn(),
  useHeaderExtensionMock: vi.fn(),
}));

vi.mock("../../src/context/useChatsContext", () => ({
  useChatsContext: () => useChatsContextMock(),
}));
vi.mock("../../src/context/useHeaderExtension", () => ({
  useHeaderExtension: () => useHeaderExtensionMock(),
}));

import { HeaderMessagesButton } from "../../src/components/chat/HeaderMessagesButton";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";

function ViewProbe() {
  const { view } = useChatInbox();
  return <p data-testid="view">{JSON.stringify(view)}</p>;
}

function chatsState(unreadTotal: number) {
  return { chats: [], loading: false, error: null, unreadTotal };
}

function renderButton() {
  return render(
    <ChatInboxProvider>
      <HeaderMessagesButton />
      <ViewProbe />
    </ChatInboxProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatsContextMock.mockReturnValue(chatsState(0));
  useHeaderExtensionMock.mockReturnValue({ backHref: null, kebabContent: null, chatTarget: null });
});

describe("HeaderMessagesButton", () => {
  it("has no badge when nothing is unread", () => {
    renderButton();

    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the unread total on the button and in its accessible name", () => {
    useChatsContextMock.mockReturnValue(chatsState(3));
    renderButton();

    expect(screen.getByRole("button", { name: "Inbox, 3 unread" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps a large total at 99+", () => {
    useChatsContextMock.mockReturnValue(chatsState(250));
    renderButton();

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("opens the chat list when pressed", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Inbox" }));

    expect(JSON.parse(screen.getByTestId("view").textContent ?? "{}")).toEqual({ kind: "list" });
  });

  it("opens the list when no chat target is published", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Inbox" }));

    expect(screen.getByTestId("view")).toHaveTextContent('{"kind":"list"}');
  });

  it("opens the character's chat straight away on a sheet whose character has a player", async () => {
    const user = userEvent.setup();
    const chatTarget = {
      campaignId: "c1",
      characterId: "char-1",
      playerAccountId: "player-1",
      characterName: "Vex",
    };
    useHeaderExtensionMock.mockReturnValue({ backHref: null, kebabContent: null, chatTarget });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Message" }));

    expect(JSON.parse(screen.getByTestId("view").textContent ?? "")).toEqual({
      kind: "chat",
      target: chatTarget,
    });
  });

  it("shows no button when the sheet's character has no player", () => {
    useHeaderExtensionMock.mockReturnValue({
      backHref: null,
      kebabContent: null,
      chatTarget: { campaignId: "c1", characterId: "char-1", playerAccountId: null },
    });
    renderButton();

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
