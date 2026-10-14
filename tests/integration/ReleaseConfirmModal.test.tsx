// tests/integration/ReleaseConfirmModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ReleaseConfirmModal } from "../../src/components/chat/ReleaseConfirmModal";

function renderModal(over: Partial<React.ComponentProps<typeof ReleaseConfirmModal>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ReleaseConfirmModal
      title="Release this character?"
      message="It will be unlinked from your account."
      confirmLabel="Release"
      busy={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...over}
    />
  );
  return { onConfirm, onCancel };
}

describe("ReleaseConfirmModal", () => {
  it("shows the title, the message and both buttons", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Release this character?" })).toBeInTheDocument();
    expect(screen.getByText("It will be unlinked from your account.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Release" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("confirms when the confirm button is pressed", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderModal();

    await user.click(screen.getByRole("button", { name: "Release" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels from the Cancel button and from Escape", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("has no close cross, only Cancel", () => {
    renderModal();

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("cannot be cancelled while the release is running", () => {
    const { onCancel } = renderModal({ busy: true });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("shows the releasing label while the release is running", () => {
    renderModal({ busy: true });

    expect(screen.getByRole("button", { name: /Releasing/ })).toBeDisabled();
  });
});
