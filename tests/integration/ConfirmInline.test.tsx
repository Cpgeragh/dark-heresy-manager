// tests/integration/ConfirmInline.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ConfirmInline } from "../../src/ui/forms/ConfirmInline";

describe("ConfirmInline", () => {
  it("runs a rapid repeated confirmation only once while the action is pending", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const onConfirm = vi.fn(() => pending);
    const user = userEvent.setup();
    render(
      <ConfirmInline
        triggerLabel="Delete"
        question="Delete?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByText("Delete"));
    const confirm = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(confirm).toBeDisabled();
    finish();
    await pending;
  });

  it("arms from the trigger and confirms (simple)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmInline
        triggerLabel="Delete"
        question="Delete?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    await user.click(screen.getByText("Delete"));
    expect(screen.getByText("Delete?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel disarms without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmInline
        triggerLabel="Delete"
        question="Delete?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByText("Delete"));
    await user.click(screen.getByText("Cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Delete")).toBeInTheDocument(); // back to the resting trigger
  });

  it("keeps the permanent deletion action disabled until the text matches", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmInline
        triggerLabel="Delete"
        requireText="DELETE"
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    const trigger = screen.getByRole("button", { name: "Delete" });
    expect(trigger).toHaveClass("bg-red-900/40", "text-red-400");
    await user.click(trigger);

    const confirm = screen.getByText("Delete Permanently");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveClass("bg-red-900/40", "text-red-400");

    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("starts a preflight when armed and keeps confirmation disabled until it is safe", async () => {
    const user = userEvent.setup();
    const onArm = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmInline
        triggerLabel="Delete"
        question="Delete?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onArm={onArm}
        details={<span>Checking affected documents…</span>}
        confirmDisabled
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByText("Delete"));
    expect(onArm).toHaveBeenCalledOnce();
    expect(screen.getByText("Checking affected documents…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();

    rerender(
      <ConfirmInline
        triggerLabel="Delete"
        question="Delete?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        details={<span>Affects 4 documents.</span>}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByText("Affects 4 documents.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("collapses back to the trigger once the action succeeds", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(true);
    render(
      <ConfirmInline
        triggerLabel="Archive"
        question="Archive?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("Archive?")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
  });

  it("stays armed when the action returns false", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(false);
    render(
      <ConfirmInline
        triggerLabel="Archive"
        question="Archive?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled());
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.getByText("Archive?")).toBeInTheDocument();
  });
});
