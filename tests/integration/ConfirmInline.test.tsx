// tests/integration/ConfirmInline.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    render(<ConfirmInline triggerLabel="Delete" question="Delete?" onConfirm={onConfirm} />);

    await user.click(screen.getByText("Delete"));
    const confirm = screen.getByText("Yes");
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
    render(<ConfirmInline triggerLabel="Delete" question="Delete?" onConfirm={onConfirm} />);

    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    await user.click(screen.getByText("Delete"));
    expect(screen.getByText("Delete?")).toBeInTheDocument();
    await user.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel disarms without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmInline triggerLabel="Delete" question="Delete?" onConfirm={onConfirm} />);

    await user.click(screen.getByText("Delete"));
    await user.click(screen.getByText("No"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Delete")).toBeInTheDocument(); // back to the resting trigger
  });

  it("type-to-confirm keeps Yes disabled until the text matches", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmInline triggerLabel="Clear" requireText="DELETE" onConfirm={onConfirm} />);

    await user.click(screen.getByText("Clear"));
    const yes = screen.getByText("Yes");
    expect(yes).toBeDisabled();

    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    expect(yes).toBeEnabled();

    await user.click(yes);
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
        onArm={onArm}
        details={<span>Checking affected documents…</span>}
        confirmDisabled
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByText("Delete"));
    expect(onArm).toHaveBeenCalledOnce();
    expect(screen.getByText("Checking affected documents…")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeDisabled();

    rerender(
      <ConfirmInline
        triggerLabel="Delete"
        question="Delete?"
        details={<span>Affects 4 documents.</span>}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByText("Affects 4 documents.")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeEnabled();
  });
});
