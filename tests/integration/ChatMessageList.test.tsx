// tests/integration/ChatMessageList.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import { ChatMessageList } from "../../src/components/chat/ChatMessageList";
import type { ChatMessage } from "../../src/types/Firestore";

const scrollIntoView = vi.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

beforeEach(() => {
  scrollIntoView.mockClear();
});

function message(over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m1",
    fromAccountId: "dm-1",
    text: "Hello there",
    timestamp: Timestamp.fromDate(new Date()),
    ...over,
  };
}

function yesterdayAtNoon(): Timestamp {
  const now = new Date();
  return Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12));
}

type ListProps = React.ComponentProps<typeof ChatMessageList>;

function listProps(props: Partial<ListProps> = {}): ListProps {
  return {
    messages: [],
    currentAccountId: "player-1",
    onLoadOlder: vi.fn(),
    loadingOlder: false,
    hasOlderMessages: false,
    olderError: null,
    ...props,
  };
}

function renderList(props: Partial<ListProps> = {}) {
  return render(<ChatMessageList {...listProps(props)} />);
}

describe("ChatMessageList", () => {
  it("shows an empty state", () => {
    renderList();
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("renders message text", () => {
    renderList({ messages: [message({ text: "Watch the eastern gate" })] });
    expect(screen.getByText("Watch the eastern gate")).toBeInTheDocument();
  });

  it("renders a message with no timestamp yet without crashing", () => {
    renderList({ messages: [message({ timestamp: null })] });
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("aligns the viewer's own messages to the right and the other person's to the left", () => {
    renderList({
      messages: [
        message({ id: "m1", fromAccountId: "player-1", text: "Mine" }),
        message({ id: "m2", fromAccountId: "dm-1", text: "Theirs" }),
      ],
    });

    expect(screen.getByText("Mine").parentElement?.parentElement).toHaveClass("justify-end");
    expect(screen.getByText("Theirs").parentElement?.parentElement).toHaveClass("justify-start");
  });

  it("puts a date label above the first message of each day", () => {
    renderList({
      messages: [
        message({ id: "m1", text: "Old news", timestamp: yesterdayAtNoon() }),
        message({ id: "m2", text: "Fresh news" }),
      ],
    });

    const labels = screen.getAllByText(/^(Today|Yesterday)$/).map((label) => label.textContent);
    expect(labels).toEqual(["Yesterday", "Today"]);
  });

  it("shows one date label for several messages on the same day", () => {
    renderList({ messages: [message({ id: "m1" }), message({ id: "m2", text: "Again" })] });

    expect(screen.getAllByText("Today")).toHaveLength(1);
  });

  it("shows the Load older messages button only when there are older messages, and wires the click", async () => {
    const user = userEvent.setup();
    const onLoadOlder = vi.fn();
    renderList({ messages: [message()], hasOlderMessages: true, onLoadOlder });

    await user.click(screen.getByRole("button", { name: "Load older messages" }));
    expect(onLoadOlder).toHaveBeenCalled();
  });

  it("hides the Load older messages button when there is nothing older", () => {
    renderList({ messages: [message()] });

    expect(screen.queryByRole("button", { name: "Load older messages" })).not.toBeInTheDocument();
  });

  it("shows a busy label and disables the button while loading older messages", () => {
    renderList({ messages: [message()], hasOlderMessages: true, loadingOlder: true });
    expect(screen.getByRole("button", { name: "Loading older messages" })).toBeDisabled();
  });

  it("shows an error when loading older messages fails", () => {
    renderList({ messages: [message()], hasOlderMessages: true, olderError: new Error("boom") });
    expect(screen.getByText("Older messages could not be loaded. Try again.")).toBeInTheDocument();
  });

  it("scrolls to the newest message when a new one arrives", () => {
    const { rerender } = renderList({ messages: [message({ id: "m1" })] });
    scrollIntoView.mockClear();

    rerender(
      <ChatMessageList
        {...listProps({ messages: [message({ id: "m1" }), message({ id: "m2", text: "Newer" })] })}
      />
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
