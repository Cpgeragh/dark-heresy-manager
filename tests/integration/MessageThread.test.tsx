// tests/integration/MessageThread.test.tsx
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";
import { MessageThread } from "../../src/components/MessageThread";
import type { ThreadMessage } from "../../src/types/Firestore";

// jsdom doesn't implement scrollIntoView; MessageThread calls it on new-message effects.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function message(over: Partial<ThreadMessage> = {}): ThreadMessage {
  return {
    id: "m1",
    fromUid: "dm-1",
    text: "Hello there",
    timestamp: Timestamp.fromDate(new Date("2026-03-04T12:00:00Z")),
    read: true,
    ...over,
  };
}

function renderThread(props: Partial<React.ComponentProps<typeof MessageThread>> = {}) {
  render(
    <MessageThread
      messages={[]}
      currentUid="player-1"
      loading={false}
      onLoadOlder={vi.fn()}
      loadingOlder={false}
      hasOlderMessages={false}
      olderError={null}
      {...props}
    />
  );
}

describe("MessageThread", () => {
  it("shows a loading state", () => {
    renderThread({ loading: true });
    expect(screen.getByText("Loading messages…")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    renderThread();
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("renders message text and a formatted timestamp", () => {
    renderThread({ messages: [message({ text: "Watch the eastern gate" })] });
    expect(screen.getByText("Watch the eastern gate")).toBeInTheDocument();
  });

  it("renders a message with no timestamp yet without crashing", () => {
    renderThread({ messages: [message({ timestamp: null })] });
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows the Load older messages button only when there are older messages, and wires the click", async () => {
    const user = userEvent.setup();
    const onLoadOlder = vi.fn();
    renderThread({
      messages: [message()],
      hasOlderMessages: true,
      onLoadOlder,
    });

    await user.click(screen.getByRole("button", { name: "Load older messages" }));
    expect(onLoadOlder).toHaveBeenCalled();
  });

  it("shows a busy label and disables the button while loading older messages", () => {
    renderThread({ messages: [message()], hasOlderMessages: true, loadingOlder: true });
    expect(screen.getByRole("button", { name: "Loading older messages…" })).toBeDisabled();
  });

  it("shows an error when loading older messages fails", () => {
    renderThread({
      messages: [message()],
      hasOlderMessages: true,
      olderError: new Error("boom"),
    });
    expect(screen.getByText("Older messages could not be loaded. Try again.")).toBeInTheDocument();
  });
});
