import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";

const { mockUseThreadMessages } = vi.hoisted(() => ({
  mockUseThreadMessages: vi.fn(() => ({ messages: [], loading: false, error: null })),
}));

vi.mock("../../src/hooks/useThreadMessages", () => ({
  useThreadMessages: (...args: unknown[]) => mockUseThreadMessages(...args),
}));

vi.mock("../../src/services/messageService", () => ({
  sendMessage: vi.fn(),
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: vi.fn() }),
}));

vi.mock("../../src/components/MessageThread", () => ({
  MessageThread: () => <div>Thread</div>,
}));

vi.mock("../../src/components/MessageInput", () => ({
  MessageInput: () => <div>Input</div>,
}));

import { MessageDrawer } from "../../src/components/MessageDrawer";

const user = { uid: "user-1" } as User;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MessageDrawer listener lifecycle", () => {
  it("does not mount a message listener while closed", () => {
    render(
      <MessageDrawer
        user={user}
        isOpen={false}
        onClose={vi.fn()}
        campaignId="campaign-1"
        characterId="character-1"
      />
    );

    expect(mockUseThreadMessages).not.toHaveBeenCalled();
  });

  it("mounts the selected thread listener while open", () => {
    render(
      <MessageDrawer
        user={user}
        isOpen
        onClose={vi.fn()}
        campaignId="campaign-1"
        characterId="character-1"
      />
    );

    expect(mockUseThreadMessages).toHaveBeenCalledWith("campaign-1", "character-1");
  });

  it("removes the thread consumer immediately when an open drawer closes", () => {
    const { rerender } = render(
      <MessageDrawer
        user={user}
        isOpen
        onClose={vi.fn()}
        campaignId="campaign-1"
        characterId="character-1"
      />
    );

    expect(screen.getByText("Thread")).toBeInTheDocument();
    expect(mockUseThreadMessages).toHaveBeenCalledOnce();

    rerender(
      <MessageDrawer
        user={user}
        isOpen={false}
        onClose={vi.fn()}
        campaignId="campaign-1"
        characterId="character-1"
      />
    );

    expect(screen.queryByText("Thread")).not.toBeInTheDocument();
    expect(mockUseThreadMessages).toHaveBeenCalledOnce();
  });
});
