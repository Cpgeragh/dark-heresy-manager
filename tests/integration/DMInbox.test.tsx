// tests/integration/DMInbox.test.tsx
//
// MessageThread and MessageInput are mocked — both already have their own
// dedicated test files. This file is scoped to DMInbox's own orchestration:
// thread list rendering, expand/collapse, marking read on open, and clearing.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const useThreadsMock = vi.fn();
vi.mock("../../src/hooks/useThreads", () => ({
  useThreads: (...args: unknown[]) => useThreadsMock(...args),
}));

const useThreadMessagesMock = vi.fn();
vi.mock("../../src/hooks/useThreadMessages", () => ({
  useThreadMessages: (...args: unknown[]) => useThreadMessagesMock(...args),
}));

const sendMessageMock = vi.fn();
const markThreadReadMock = vi.fn();
const clearThreadMock = vi.fn();
vi.mock("../../src/services/messageService", () => ({
  sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  markThreadRead: (...args: unknown[]) => markThreadReadMock(...args),
  clearThread: (...args: unknown[]) => clearThreadMock(...args),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
}));

vi.mock("../../src/components/MessageThread", () => ({
  MessageThread: () => <div>Mock MessageThread</div>,
}));

vi.mock("../../src/components/MessageInput", () => ({
  MessageInput: ({ onSend }: { onSend: (text: string) => Promise<void> }) => (
    <button onClick={() => onSend("Reinforcements incoming")}>Mock Send</button>
  ),
}));

import { DMInbox } from "../../src/pages/CampaignOverview/DMInbox";
import type { CharacterListItem } from "../../src/types/Firestore";

const characters = [
  { id: "char-1", header: { characterName: "Vex" } } as CharacterListItem,
];

beforeEach(() => {
  vi.clearAllMocks();
  useThreadMessagesMock.mockReturnValue({
    messages: [],
    loading: false,
    error: null,
    loadOlder: vi.fn(),
    loadingOlder: false,
    olderError: null,
    hasOlderMessages: false,
  });
});

function renderInbox() {
  render(<DMInbox campaignId="campaign-1" dmUid="dm-1" characters={characters} />);
}

describe("DMInbox", () => {
  it("shows an error state", () => {
    useThreadsMock.mockReturnValue({ threads: [], loading: false, error: new Error("boom") });
    renderInbox();
    expect(screen.getByText("Unable to load messages. Please refresh the page.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useThreadsMock.mockReturnValue({ threads: [], loading: true, error: null });
    renderInbox();
    expect(screen.getByText("Loading messages…")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    useThreadsMock.mockReturnValue({ threads: [], loading: false, error: null });
    renderInbox();
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("resolves the thread's label from the character list and shows an unread badge", () => {
    useThreadsMock.mockReturnValue({
      threads: [{ characterId: "char-1", unreadForDM: 2, lastMessage: "Need backup" }],
      loading: false,
      error: null,
    });
    renderInbox();

    expect(screen.getByText("Vex")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Need backup")).toBeInTheDocument();
  });

  it("falls back to a truncated id when the character isn't in the roster", () => {
    useThreadsMock.mockReturnValue({
      threads: [{ characterId: "unknown-character-id", unreadForDM: 0, lastMessage: null }],
      loading: false,
      error: null,
    });
    renderInbox();

    expect(screen.getByText("unknown-…")).toBeInTheDocument();
  });

  it("expands a thread on click and marks it read", async () => {
    const user = userEvent.setup();
    useThreadsMock.mockReturnValue({
      threads: [{ characterId: "char-1", unreadForDM: 3, lastMessage: "Need backup" }],
      loading: false,
      error: null,
    });
    renderInbox();

    expect(screen.queryByText("Mock MessageThread")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Vex/ }));

    expect(screen.getByText("Mock MessageThread")).toBeInTheDocument();
    expect(markThreadReadMock).toHaveBeenCalledWith("campaign-1", "char-1", 3);
  });

  it("collapses an already-expanded thread on a second click", async () => {
    const user = userEvent.setup();
    useThreadsMock.mockReturnValue({
      threads: [{ characterId: "char-1", unreadForDM: 0, lastMessage: null }],
      loading: false,
      error: null,
    });
    renderInbox();

    const toggle = screen.getByRole("button", { name: /Vex/ });
    await user.click(toggle);
    await user.click(toggle);

    expect(screen.queryByText("Mock MessageThread")).not.toBeInTheDocument();
  });

  it("sends a reply through the expanded thread", async () => {
    const user = userEvent.setup();
    sendMessageMock.mockResolvedValue(undefined);
    useThreadsMock.mockReturnValue({
      threads: [{ characterId: "char-1", unreadForDM: 0, lastMessage: null }],
      loading: false,
      error: null,
    });
    renderInbox();

    await user.click(screen.getByRole("button", { name: /Vex/ }));
    await user.click(screen.getByText("Mock Send"));

    expect(sendMessageMock).toHaveBeenCalledWith(
      "campaign-1",
      "char-1",
      "dm-1",
      "Reinforcements incoming",
      false
    );
  });

  it("clears a thread after typing DELETE to confirm", async () => {
    const user = userEvent.setup();
    clearThreadMock.mockResolvedValue(undefined);
    useThreadsMock.mockReturnValue({
      threads: [{ characterId: "char-1", unreadForDM: 0, lastMessage: null }],
      loading: false,
      error: null,
    });
    renderInbox();

    await user.click(screen.getByRole("button", { name: /Vex/ }));
    await user.click(screen.getByRole("button", { name: "Clear chat" }));
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(clearThreadMock).toHaveBeenCalledWith("campaign-1", "char-1");
  });
});
