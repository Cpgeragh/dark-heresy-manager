import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/ui/buttons/Button";

describe("Button", () => {
  it("runs onClick when idle", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "active:scale-[0.98]",
      "focus-visible:ring-red-500"
    );
  });

  it("shows the loading label, marks itself busy and ignores clicks while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the normal label while loading when no loading label is given", () => {
    render(<Button loading>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-busy", "true");
  });

  it("dims a disabled button but keeps a loading button at full brightness", () => {
    const { rerender } = render(<Button disabled>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("disabled:opacity-50");

    rerender(<Button loading>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveClass("disabled:opacity-50");
  });

  it("stays busy while a promise-returning click is pending, then recovers", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onClick = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-busy");
  });

  it("does not go busy when the click handler returns nothing", async () => {
    const user = userEvent.setup();
    render(<Button onClick={() => undefined}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-busy");
  });
});
