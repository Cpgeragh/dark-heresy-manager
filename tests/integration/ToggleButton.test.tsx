// tests/integration/ToggleButton.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { ToggleButton, toggleButtonClass } from "../../src/ui/buttons/ToggleButton";

const selectedColour = "border-sky-400 bg-sky-500/10 text-sky-300";

describe("ToggleButton", () => {
  it("tells assistive technology whether it is pressed", () => {
    const { rerender } = render(
      <ToggleButton selected={false} selectedClassName={selectedColour}>
        Good
      </ToggleButton>
    );
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "false");

    rerender(
      <ToggleButton selected selectedClassName={selectedColour}>
        Good
      </ToggleButton>
    );
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the shared grey look while unselected", () => {
    render(
      <ToggleButton selected={false} selectedClassName={selectedColour}>
        Good
      </ToggleButton>
    );

    expect(screen.getByRole("button", { name: "Good" })).toHaveClass(
      "border-slate-600",
      "bg-slate-800",
      "text-slate-400",
      "hover:border-slate-500"
    );
  });

  it("shows the colour the caller passes while selected, and not the grey look", () => {
    render(
      <ToggleButton selected selectedClassName={selectedColour}>
        Good
      </ToggleButton>
    );

    const button = screen.getByRole("button", { name: "Good" });
    expect(button).toHaveClass("border-sky-400", "bg-sky-500/10", "text-sky-300");
    expect(button).not.toHaveClass("bg-slate-800");
  });

  it("keeps the size classes the caller passes and calls onClick", async () => {
    const onClick = vi.fn();
    render(
      <ToggleButton
        selected={false}
        selectedClassName={selectedColour}
        className="px-2 py-1 text-xs"
        onClick={onClick}
      >
        Good
      </ToggleButton>
    );

    const button = screen.getByRole("button", { name: "Good" });
    expect(button).toHaveClass("px-2", "py-1", "text-xs");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("toggleButtonClass", () => {
  it("gives a radio label the same look as a button", () => {
    expect(toggleButtonClass(false, selectedColour, "relative")).toContain("border-slate-600");
    expect(toggleButtonClass(true, selectedColour, "relative")).toContain("border-sky-400");
    expect(toggleButtonClass(true, selectedColour, "relative")).toContain("relative");
  });
});
