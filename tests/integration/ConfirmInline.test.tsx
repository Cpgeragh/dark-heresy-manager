// tests/integration/ConfirmInline.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ConfirmInline } from "../../src/ui/ConfirmInline";

describe("ConfirmInline", () => {
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
});
