// tests/integration/CardOverlayButton.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { CardOverlayButton } from "../../src/ui/buttons/CardOverlayButton";

describe("CardOverlayButton", () => {
  it("stretches over the card with a red focus ring and the press effect", () => {
    render(<CardOverlayButton label="Expand Grenade details" expanded={false} />);

    const button = screen.getByRole("button", { name: "Expand Grenade details" });
    expect(button).toHaveClass("absolute", "inset-0", "w-full", "focus-visible:ring-red-500");
    expect(button).not.toHaveClass("focus-visible:ring-indigo-500");
    expect(button.className).toContain("active:scale-");
  });

  it("reports the expanded state, and leaves it out for a card that chooses", () => {
    const { rerender } = render(<CardOverlayButton label="Expand Grenade details" expanded />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");

    rerender(<CardOverlayButton label="Select Grenade" />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-expanded");
  });

  it("calls onClick when tapped", async () => {
    const onClick = vi.fn();
    render(<CardOverlayButton label="Select Grenade" onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Select Grenade" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("blocks taps and shows the waiting cursor while pending", async () => {
    const onClick = vi.fn();
    render(<CardOverlayButton label="Select Grenade" pending onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Select Grenade" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("cursor-wait");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
