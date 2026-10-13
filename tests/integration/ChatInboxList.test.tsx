// tests/integration/ChatInboxList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ChatInboxList } from "../../src/components/chat/ChatInboxList";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

const { useHasBeenVisibleMock } = vi.hoisted(() => ({
  useHasBeenVisibleMock: vi.fn(() => ({ ref: { current: null }, visible: true })),
}));

vi.mock("../../src/hooks/useChatPicture", () => ({
  useChatPicture: () => ({ status: "none" }),
}));
vi.mock("../../src/hooks/useHasBeenVisible", () => ({
  useHasBeenVisible: (...args: unknown[]) => useHasBeenVisibleMock(...args),
}));

function chat(id: string, characterName: string): ChatSummaryWithId {
  return {
    id,
    campaignId: "c1",
    characterId: id,
    playerAccountId: "player-1",
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    campaignName: "Calixis",
    characterName,
    lastMessage: "Hello",
    lastTimestamp: null,
    unreadCount: 0,
    closed: false,
  };
}

function renderList(props: Partial<React.ComponentProps<typeof ChatInboxList>> = {}) {
  return render(
    <ChatInboxList chats={[]} loading={false} error={null} onOpenChat={vi.fn()} {...props} />
  );
}

describe("ChatInboxList", () => {
  it("shows an empty state", () => {
    renderList();

    expect(screen.getByText("You have no chats yet.")).toBeInTheDocument();
  });

  it("shows an error", () => {
    renderList({ error: new Error("boom") });

    expect(screen.getByText("Unable to load your chats.")).toBeInTheDocument();
  });

  it("shows nothing while loading", () => {
    const { container } = renderList({ loading: true });

    expect(container).toBeEmptyDOMElement();
  });

  it("lists the chats in the order given", () => {
    renderList({ chats: [chat("a", "Brother Kael"), chat("b", "Sister Vex")] });

    const names = screen.getAllByText(/Brother Kael|Sister Vex/).map((node) => node.textContent);
    expect(names).toEqual(["Brother Kael", "Sister Vex"]);
  });

  it("opens the chat that was pressed", async () => {
    const user = userEvent.setup();
    const onOpenChat = vi.fn();
    const chats = [chat("a", "Brother Kael"), chat("b", "Sister Vex")];
    renderList({ chats, onOpenChat });

    await user.click(screen.getByRole("button", { name: "Sister Vex, Anna" }));

    expect(onOpenChat).toHaveBeenCalledWith(chats[1]);
  });

  it("gives every row the scroll area to look ahead inside", () => {
    const scrollArea = document.createElement("div");
    renderList({
      chats: [chat("a", "Brother Kael"), chat("b", "Sister Vex")],
      scrollRoot: scrollArea,
    });

    expect(useHasBeenVisibleMock).toHaveBeenCalledWith(
      expect.objectContaining({ root: scrollArea })
    );
  });
});
