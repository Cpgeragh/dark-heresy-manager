// tests/integration/HeaderMessagesButton.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { useChatsContextMock } = vi.hoisted(() => ({ useChatsContextMock: vi.fn() }));

vi.mock("../../src/context/useChatsContext", () => ({
  useChatsContext: () => useChatsContextMock(),
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
});

describe("HeaderMessagesButton", () => {
  it("has no badge when nothing is unread", () => {
    renderButton();

    expect(screen.getByRole("button", { name: "Messages" })).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the unread total on the button and in its accessible name", () => {
    useChatsContextMock.mockReturnValue(chatsState(3));
    renderButton();

    expect(screen.getByRole("button", { name: "Messages, 3 unread" })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Messages" }));

    expect(JSON.parse(screen.getByTestId("view").textContent ?? "{}")).toEqual({ kind: "list" });
  });
});
