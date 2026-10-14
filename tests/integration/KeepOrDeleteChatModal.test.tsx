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

    expect(screen.getByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    expect(screen.getByText(/restore it for 7 days/)).toBeInTheDocument();
  });

  it("offers Keep and Delete and no Cancel", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Keep my chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete my chat" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("keeps the chat when Keep my chat is pressed", async () => {
    const user = userEvent.setup();
    const { onKeep, onDelete } = renderModal();

    await user.click(screen.getByRole("button", { name: "Keep my chat" }));

    expect(onKeep).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("deletes the chat when Delete my chat is pressed", async () => {
    const user = userEvent.setup();
    const { onKeep, onDelete } = renderModal();

    await user.click(screen.getByRole("button", { name: "Delete my chat" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onKeep).not.toHaveBeenCalled();
  });

  it("stays open when Escape is pressed, so the page keeps waiting for an answer", () => {
    const { onKeep, onDelete } = renderModal();

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(screen.getByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    expect(onKeep).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("disables Keep and shows the deleting label while the delete runs", () => {
    renderModal(true);

    expect(screen.getByRole("button", { name: "Keep my chat" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Deleting/ })).toBeDisabled();
  });
});
