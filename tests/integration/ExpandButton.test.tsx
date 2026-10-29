import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ExpandButton } from "../../src/ui/buttons/ExpandButton";

describe("ExpandButton", () => {
  it("fades, tints on hover, shrinks on press and shows the focus ring", () => {
    render(<ExpandButton expanded={false} label="Expand card" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Expand card" })).toHaveClass(
      "transition",
      "hover:bg-slate-800",
      "active:scale-press",
      "focus-visible:ring-red-500"
    );
  });

  it("reports whether the card is expanded and calls onClick", async () => {
    const onClick = vi.fn();
    render(<ExpandButton expanded label="Collapse card" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Collapse card" });
    expect(button).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
