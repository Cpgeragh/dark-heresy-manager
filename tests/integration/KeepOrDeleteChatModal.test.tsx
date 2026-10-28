// tests/integration/KeepOrDeleteChatModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { KeepOrDeleteChatModal } from "../../src/components/chat/KeepOrDeleteChatModal";

function renderModal(busy = false) {
  const onKeep = vi.fn();
  const onDelete = vi.fn();
  render(<KeepOrDeleteChatModal busy={busy} onKeep={onKeep} onDelete={onDelete} />);
  return { onKeep, onDelete };
}

describe("KeepOrDeleteChatModal", () => {
  it("asks whether to keep the chat and says how long a deleted chat can be restored", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Keep Your Chat?" })).toBeInTheDocument();
    expect(screen.getByText(/restore it for 7 days/)).toBeInTheDocument();
  });

  it("offers Keep and Delete and no Cancel", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Keep My Chat" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Move My Chat to Recently Deleted" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("keeps the chat when Keep My Chat is pressed", async () => {
    const user = userEvent.setup();
    const { onKeep, onDelete } = renderModal();

    await user.click(screen.getByRole("button", { name: "Keep My Chat" }));

    expect(onKeep).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("deletes the chat when Move My Chat to Recently Deleted is pressed", async () => {
    const user = userEvent.setup();
    const { onKeep, onDelete } = renderModal();

    await user.click(screen.getByRole("button", { name: "Move My Chat to Recently Deleted" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onKeep).not.toHaveBeenCalled();
  });

  it("stays open when Escape is pressed, so the page keeps waiting for an answer", () => {
    const { onKeep, onDelete } = renderModal();

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(screen.getByRole("dialog", { name: "Keep Your Chat?" })).toBeInTheDocument();
    expect(onKeep).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("uses the plural title, count and buttons when there are several chats", () => {
    render(<KeepOrDeleteChatModal busy={false} count={3} onKeep={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Keep Your Chats?" })).toBeInTheDocument();
    expect(screen.getByText(/You have 3 chats about this character/)).toBeInTheDocument();
    expect(screen.getByText(/restore them for 7 days/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep My Chats" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Move My Chats to Recently Deleted" })
    ).toBeInTheDocument();
  });

  it("names the campaign when the chats are about a campaign", () => {
    render(
      <KeepOrDeleteChatModal
        busy={false}
        count={2}
        about="campaign"
        onKeep={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/You have 2 chats about this campaign/)).toBeInTheDocument();
  });

  it("names the campaign for a single chat too", () => {
    render(
      <KeepOrDeleteChatModal busy={false} about="campaign" onKeep={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText(/You have a chat about this campaign/)).toBeInTheDocument();
  });

  it("disables Keep and shows the deleting label while the delete runs", () => {
    renderModal(true);

    expect(screen.getByRole("button", { name: "Keep My Chat" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Moving/ })).toBeDisabled();
  });
});
