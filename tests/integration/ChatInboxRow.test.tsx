// tests/integration/ChatInboxRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import { ChatInboxRow } from "../../src/components/chat/ChatInboxRow";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

function chat(over: Partial<ChatSummaryWithId> = {}): ChatSummaryWithId {
  return {
    id: "c1__char-1__player-1",
    campaignId: "c1",
    characterId: "char-1",
    playerAccountId: "player-1",
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    campaignName: "Calixis",
    characterName: "Brother Kael",
    lastMessage: "Need backup",
    lastTimestamp: Timestamp.fromDate(new Date(2020, 0, 3, 12, 0)),
    unreadCount: 0,
    closed: false,
    ...over,
  };
}

function renderRow(
  over: Partial<ChatSummaryWithId> = {},
  props: Partial<React.ComponentProps<typeof ChatInboxRow>> = {}
) {
  return render(
    <ChatInboxRow chat={chat(over)} picture={{ status: "none" }} onOpen={vi.fn()} {...props} />
  );
}

describe("ChatInboxRow", () => {
  it("shows the character, the other person, the campaign and the preview", () => {
    renderRow();

    expect(screen.getByText("Brother Kael")).toBeInTheDocument();
    expect(screen.getByText(/Anna · Calixis/)).toBeInTheDocument();
    expect(screen.getByText("Need backup")).toBeInTheDocument();
  });

  it("shows when the last message was sent", () => {
    renderRow();

    const expected = new Date(2020, 0, 3, 12, 0).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("shows no preview or time for a chat with no messages recorded", () => {
    renderRow({ lastMessage: "", lastTimestamp: null });

    expect(screen.queryByText("Need backup")).not.toBeInTheDocument();
  });

  it("shows an unread badge and puts the count in the accessible name", () => {
    renderRow({ unreadCount: 3 });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Brother Kael, Anna, 3 unread" })
    ).toBeInTheDocument();
  });

  it("shows a Closed chip and says so in the accessible name", () => {
    renderRow({ closed: true });

    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Brother Kael, Anna, closed" })).toBeInTheDocument();
  });

  it("opens the chat when pressed", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderRow({}, { onOpen });

    await user.click(screen.getByRole("button", { name: "Brother Kael, Anna" }));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("uses the character's initials in the DM's inbox", () => {
    renderRow({ role: "dm" });

    expect(screen.getByText("BK")).toBeInTheDocument();
  });

  it("uses the DM's initials in the player's inbox", () => {
    renderRow({ role: "player", otherName: "Marcus Vane" });

    expect(screen.getByText("MV")).toBeInTheDocument();
  });

  it("passes the picture through to the avatar", () => {
    const { container } = renderRow(
      {},
      { picture: { status: "ready", url: "data:image/png;base64,AA" } }
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "data:image/png;base64,AA");
  });
});
