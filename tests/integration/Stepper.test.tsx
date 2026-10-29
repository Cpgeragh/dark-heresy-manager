import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { Stepper } from "../../src/components/Stepper";
import { colourControlShadow } from "../../src/ui/styles/colourTokens";

describe("Stepper", () => {
  it("renders the current value", () => {
    render(<Stepper value={5} editable onChange={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("carries the shared control shadow", () => {
    const { container } = render(<Stepper value={5} editable onChange={vi.fn()} />);

    expect(container.firstElementChild).toHaveClass(...colourControlShadow.split(" "));
  });

  it("increments and decrements by 1 via the +/- buttons", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} editable onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Increase" }));
    expect(onChange).toHaveBeenCalledWith(6);

    await user.click(screen.getByRole("button", { name: "Decrease" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clamps to min (default 0) via the - button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={0} editable onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Decrease" }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("clamps to max via the + button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={10} max={10} editable onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Increase" }));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("marks +/- buttons aria-disabled and ignores clicks when not editable", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} editable={false} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Increase" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    await user.click(screen.getByRole("button", { name: "Increase" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("enters edit mode on click, sizes the input to the current draft, and commits on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} editable onChange={onChange} />);

    await user.click(screen.getByText("5"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveValue("5");

    await user.clear(input);
    await user.type(input, "42");
    expect(input.size).toBe(2);

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it("reaches the value with the keyboard, edits it, and returns focus after Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} editable onChange={onChange} />);

    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: /Edit value/ })).toHaveFocus();

    await user.keyboard("{Enter}");
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "8");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(8);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Edit value/ })).toHaveFocus());
  });

  it("returns focus after Escape without committing, but not after clicking away", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Stepper value={5} editable onChange={onChange} />
        <button>elsewhere</button>
      </>
    );

    await user.click(screen.getByRole("button", { name: /Edit value/ }));
    await user.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: /Edit value/ })).toHaveFocus());

    await user.click(screen.getByRole("button", { name: /Edit value/ }));
    await user.click(screen.getByText("elsewhere"));
    expect(screen.getByText("elsewhere")).toHaveFocus();
  });

  it("shows the value as plain text when not editable and draws the focus ring inside the pill", () => {
    const { rerender } = render(<Stepper value={5} editable onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Edit value/ })).toHaveClass(
      "focus-visible:ring-inset"
    );
    expect(screen.getByRole("button", { name: "Decrease" })).toHaveClass(
      "focus-visible:ring-inset"
    );
    expect(screen.getByRole("button", { name: "Increase" })).toHaveClass(
      "focus-visible:ring-inset"
    );

    rerender(<Stepper value={5} editable={false} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Edit value/ })).not.toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("cancels the edit on Escape without committing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} editable onChange={onChange} />);

    await user.click(screen.getByText("5"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "99");
    await user.keyboard("{Escape}");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("commits on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Stepper value={5} editable onChange={onChange} />
        <button>elsewhere</button>
      </>
    );

    await user.click(screen.getByText("5"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "7");
    await user.click(screen.getByText("elsewhere"));

    expect(onChange).toHaveBeenCalledWith(7);
  });
});
