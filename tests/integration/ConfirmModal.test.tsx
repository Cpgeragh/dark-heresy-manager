import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ConfirmModal } from "../../src/ui/modals/ConfirmModal";

function renderModal(props: Partial<Parameters<typeof ConfirmModal>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmModal
      title="Rotate Code"
      message="Rotate code?"
      confirmLabel="Rotate"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onConfirm, onCancel };
}

describe("ConfirmModal", () => {
  it("shows the title, a centred sentence, and the confirm and cancel buttons", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Rotate Code" })).toBeInTheDocument();
    expect(screen.getByText("Rotate code?")).toHaveClass("text-center");
    expect(screen.getByRole("button", { name: "Rotate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("puts the confirm button before the cancel button", () => {
    renderModal();

    const confirm = screen.getByRole("button", { name: "Rotate" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(confirm.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("calls the handlers from the buttons", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderModal();

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses a custom label for the dismiss button", () => {
    renderModal({ cancelLabel: "Keep setting up" });

    expect(screen.getByRole("button", { name: "Keep setting up" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("waits for a slow confirm and blocks Cancel until it finishes", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { onCancel } = renderModal({ onConfirm });

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    expect(screen.getByRole("button", { name: /Rotate/ })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(onCancel).not.toHaveBeenCalled();

    await act(async () => finish());
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("shows the caller's own waiting flag", () => {
    renderModal({ busy: true, loadingLabel: "Rotating" });

    expect(screen.getByRole("button", { name: /Rotating/ })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("has a close button unless it is not dismissible", () => {
    const { unmount } = render(
      <ConfirmModal
        title="Keep Your Chat?"
        message="Keep it?"
        confirmLabel="Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    unmount();

    render(
      <ConfirmModal
        title="Keep Your Chat?"
        message="Keep it?"
        confirmLabel="Keep"
        dismissible={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
