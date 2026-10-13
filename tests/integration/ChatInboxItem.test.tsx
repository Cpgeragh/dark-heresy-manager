// tests/integration/ChatInboxItem.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

const { useChatPictureMock, useHasBeenVisibleMock } = vi.hoisted(() => ({
  useChatPictureMock: vi.fn(),
  useHasBeenVisibleMock: vi.fn(),
}));

vi.mock("../../src/hooks/useChatPicture", () => ({
  useChatPicture: (...args: unknown[]) => useChatPictureMock(...args),
}));
vi.mock("../../src/hooks/useHasBeenVisible", () => ({
  useHasBeenVisible: (...args: unknown[]) => useHasBeenVisibleMock(...args),
}));

import { ChatInboxItem } from "../../src/components/chat/ChatInboxItem";

const chat: ChatSummaryWithId = {
  id: "c1__char-1__player-1",
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
  useHasBeenVisibleMock.mockReturnValue({ ref: { current: null }, visible: false });
  useChatPictureMock.mockReturnValue({ status: "none" });
});

describe("ChatInboxItem", () => {
  it("tells the picture hook whether the row has been seen", () => {
    useHasBeenVisibleMock.mockReturnValue({ ref: { current: null }, visible: true });
    render(<ChatInboxItem chat={chat} onOpen={vi.fn()} />);

    expect(useChatPictureMock).toHaveBeenCalledWith(chat, true);
  });

  it("starts loading about two rows before the row appears, inside the given scroll area", () => {
    const scrollArea = document.createElement("div");
    render(<ChatInboxItem chat={chat} scrollRoot={scrollArea} onOpen={vi.fn()} />);

    expect(useHasBeenVisibleMock).toHaveBeenCalledWith({
      root: scrollArea,
      rootMargin: "0px 0px 150px 0px",
    });
  });

  it("shows the picture the hook reports", () => {
    useChatPictureMock.mockReturnValue({ status: "ready", url: "data:image/png;base64,AA" });
    const { container } = render(<ChatInboxItem chat={chat} onOpen={vi.fn()} />);

    expect(container.querySelector("img")).toHaveAttribute("src", "data:image/png;base64,AA");
  });

  it("opens the chat when the row is pressed", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ChatInboxItem chat={chat} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "Brother Kael, Anna" }));

    expect(onOpen).toHaveBeenCalledOnce();
  });
});
