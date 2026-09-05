// tests/integration/ToastItem.test.tsx
//
// Real gotcha: @testing-library/user-event's setup() installs its own native-
// like Clipboard stub onto navigator.clipboard the first time it runs. Any
// clipboard mock/spy set up *before* calling userEvent.setup() gets clobbered
// by that install — the spy has to be created *after* setup(), on whatever
// object userEvent just installed.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const removeToastMock = vi.fn();
vi.mock("../../src/components/Toast/ToastContext", async () => {
  const actual = await vi.importActual<typeof import("../../src/components/Toast/ToastContext")>(
    "../../src/components/Toast/ToastContext"
  );
  return { ...actual, useToast: () => ({ removeToast: removeToastMock }) };
});

import { ToastItem } from "../../src/components/Toast/ToastItem";
import type { Toast } from "../../src/components/Toast/ToastContext";

function toast(over: Partial<Toast> = {}): Toast {
  return { id: "t1", message: "Saved successfully.", type: "success", ...over };
}

function setupUserWithClipboardSpy(options?: Parameters<typeof userEvent.setup>[0]) {
  const user = userEvent.setup(options);
  const writeTextMock = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  return { user, writeTextMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ToastItem", () => {
  it("renders the message", () => {
    render(<ToastItem toast={toast({ message: "Character created." })} />);
    expect(screen.getByText("Character created.")).toBeInTheDocument();
  });

  it("calls removeToast with this toast's id from Dismiss", async () => {
    const { user } = setupUserWithClipboardSpy();
    render(<ToastItem toast={toast({ id: "abc" })} />);

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(removeToastMock).toHaveBeenCalledWith("abc");
  });

  it("copies the message text to the clipboard", async () => {
    const { user, writeTextMock } = setupUserWithClipboardSpy();
    render(<ToastItem toast={toast({ message: "DH-AAAA-BBBB" })} />);

    await user.click(screen.getByRole("button", { name: "Copy message to clipboard" }));

    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith("DH-AAAA-BBBB"));
    expect(screen.getByRole("button", { name: "Copy message to clipboard" })).toHaveTextContent(
      "✓"
    );
  });

  it("reverts the copied indicator after the feedback duration", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { user } = setupUserWithClipboardSpy({ advanceTimers: vi.advanceTimersByTime });
      render(<ToastItem toast={toast({ message: "DH-AAAA-BBBB" })} />);

      await user.click(screen.getByRole("button", { name: "Copy message to clipboard" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Copy message to clipboard" })).toHaveTextContent(
          "✓"
        )
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000); // COPY_FEEDBACK_DURATION
      });

      expect(screen.getByRole("button", { name: "Copy message to clipboard" })).toHaveTextContent(
        "📋"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("copies copyText instead of the full message when one is set", async () => {
    const { user, writeTextMock } = setupUserWithClipboardSpy();
    render(
      <ToastItem
        toast={toast({
          message: "Character created!\n\nRecovery Code: DH-AAAA-BBBB",
          copyText: "DH-AAAA-BBBB",
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: "Copy message to clipboard" }));
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith("DH-AAAA-BBBB"));
  });
});
