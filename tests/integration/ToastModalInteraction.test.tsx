import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ToastContainer } from "../../src/components/Toast/ToastContainer";
import { useToast } from "../../src/components/Toast/ToastContext";
import { ToastProvider } from "../../src/components/Toast/ToastProvider";
import { ModalShell } from "../../src/ui/modals/ModalShell";

const originalShowPopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "showPopover");
const originalHidePopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "hidePopover");

function ModalWithToast({ onClose }: { onClose: () => void }) {
  const toast = useToast();

  return (
    <>
      <ModalShell ariaLabel="Settings" onClose={onClose}>
        <button type="button" onClick={() => toast.error("Settings failed.", 0)}>
          Show error
        </button>
      </ModalShell>
      <ToastContainer />
    </>
  );
}

describe("toasts over native modals", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "showPopover", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    if (originalShowPopover) {
      Object.defineProperty(HTMLElement.prototype, "showPopover", originalShowPopover);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
    }
    if (originalHidePopover) {
      Object.defineProperty(HTMLElement.prototype, "hidePopover", originalHidePopover);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
    }
  });

  it("dismisses the toast without closing the active modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <ModalWithToast onClose={onClose} />
      </ToastProvider>
    );

    const settingsDialog = screen.getByRole("dialog", { name: "Settings" });
    await user.click(screen.getByRole("button", { name: "Show error" }));

    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert.closest("dialog")).toBe(settingsDialog));

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(settingsDialog).toBeInTheDocument();
    expect(settingsDialog).toHaveAttribute("open");
    expect(onClose).not.toHaveBeenCalled();
  });
});
