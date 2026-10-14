// tests/integration/ChatBinList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import { ChatBinList } from "../../src/components/chat/ChatBinList";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

const DAY = 24 * 60 * 60 * 1000;

function chat(id: string, characterName: string, daysAgo: number): ChatSummaryWithId {
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
    lastTimestamp: Timestamp.fromMillis(Date.now() - (daysAgo + 1) * DAY),
    unreadCount: 0,
    closed: false,
    clearedAt: Timestamp.fromMillis(Date.now() - daysAgo * DAY),
  };
}

describe("ChatBinList", () => {
  it("says how long deleted chats are kept", () => {
    render(<ChatBinList chats={[]} onRestore={vi.fn()} />);

    expect(screen.getByText(/stay here for 7 days/)).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<ChatBinList chats={[]} onRestore={vi.fn()} />);

    expect(screen.getByText("Nothing has been deleted.")).toBeInTheDocument();
  });

  it("lists the most recently deleted chat first", () => {
    render(
      <ChatBinList
        chats={[chat("a", "Brother Kael", 5), chat("b", "Sister Vex", 1)]}
        onRestore={vi.fn()}
      />
    );

    const names = screen.getAllByText(/Brother Kael|Sister Vex/).map((node) => node.textContent);
    expect(names).toEqual(["Sister Vex", "Brother Kael"]);
  });

  it("restores the chat that was pressed", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const chats = [chat("a", "Brother Kael", 5), chat("b", "Sister Vex", 1)];
    render(<ChatBinList chats={chats} onRestore={onRestore} />);

    await user.click(screen.getByRole("button", { name: "Restore Brother Kael" }));

    expect(onRestore).toHaveBeenCalledWith(chats[0]);
  });
});
