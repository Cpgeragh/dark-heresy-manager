// tests/integration/ChatBinRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import { ChatBinRow } from "../../src/components/chat/ChatBinRow";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return Timestamp.fromMillis(Date.now() - days * DAY);
}

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
    lastMessage: "Hello",
    lastTimestamp: daysAgo(4),
    unreadCount: 0,
    closed: false,
    clearedAt: daysAgo(3.5),
    ...over,
  };
}

function renderRow(over: Partial<ChatSummaryWithId> = {}, onRestore = vi.fn()) {
  render(<ChatBinRow chat={chat(over)} onRestore={onRestore} />);
  return { onRestore };
}

describe("ChatBinRow", () => {
  it("shows the character, the person, the campaign and the days left", () => {
    renderRow();

    expect(screen.getByText("Brother Kael")).toBeInTheDocument();
    expect(screen.getByText(/Anna · Calixis/)).toBeInTheDocument();
    expect(screen.getByText("Deleted · 4 days left")).toBeInTheDocument();
  });

  it("says 1 day left on the last day", () => {
    renderRow({ clearedAt: daysAgo(6.5), lastTimestamp: daysAgo(7) });

    expect(screen.getByText("Deleted · 1 day left")).toBeInTheDocument();
  });

  it("says removal is due once the days are used up", () => {
    renderRow({ clearedAt: daysAgo(8), lastTimestamp: daysAgo(9) });

    expect(screen.getByText("Deleted · Removal due")).toBeInTheDocument();
  });

  it("says earlier messages were deleted when newer messages arrived since", () => {
    renderRow({ lastTimestamp: daysAgo(1) });

    expect(screen.getByText("Earlier messages deleted · 4 days left")).toBeInTheDocument();
  });

  it("restores the chat when Restore is pressed", async () => {
    const user = userEvent.setup();
    const { onRestore } = renderRow();

    await user.click(screen.getByRole("button", { name: "Restore Brother Kael" }));

    expect(onRestore).toHaveBeenCalledOnce();
  });

  it("uses the character's initials in the DM's view", () => {
    renderRow({ role: "dm" });

    expect(screen.getByText("BK")).toBeInTheDocument();
  });

  it("uses the DM's initials in the player's view", () => {
    renderRow({ role: "player", otherName: "Marcus Vane" });

    expect(screen.getByText("MV")).toBeInTheDocument();
  });
});
