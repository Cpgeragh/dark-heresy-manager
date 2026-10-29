import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { QuantityControl } from "../../src/ui/QuantityControl";

describe("QuantityControl", () => {
  it("reaches the quantity with the keyboard, edits it, and returns focus after Enter", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<QuantityControl quantity={3} editable onUpdate={onUpdate} />);

    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Edit quantity, currently 3" })).toHaveFocus();

    await user.keyboard("{Enter}");
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "7");
    await user.keyboard("{Enter}");

    expect(onUpdate).toHaveBeenCalledWith(7);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Edit quantity/ })).toHaveFocus()
    );
  });

  it("returns focus after Escape without committing", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<QuantityControl quantity={3} editable onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: /Edit quantity/ }));
    await user.keyboard("{Escape}");

    expect(onUpdate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Edit quantity/ })).toHaveFocus()
    );
  });

  it("still steps the quantity with the plus and minus buttons", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<QuantityControl quantity={3} editable onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));

    expect(onUpdate).toHaveBeenNthCalledWith(1, 4);
    expect(onUpdate).toHaveBeenNthCalledWith(2, 2);
  });

  it("shows only the number when not editable", () => {
    render(<QuantityControl quantity={3} editable={false} onUpdate={vi.fn()} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
