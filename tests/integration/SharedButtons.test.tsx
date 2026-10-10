import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ExpandButton } from "../../src/ui/buttons/ExpandButton";
import { RevealCodeButton } from "../../src/ui/buttons/RevealCodeButton";
import { uiTextButton } from "../../src/ui/styles/buttonStyles";

describe("ExpandButton", () => {
  it("reports its state and label and calls the handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ExpandButton expanded label="Collapse Lasgun details" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Collapse Lasgun details" });
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps an extra class from the caller", () => {
    render(<ExpandButton expanded={false} label="Expand" onClick={() => undefined} className="ml-auto" />);

    expect(screen.getByRole("button", { name: "Expand" })).toHaveClass("ml-auto");
  });
});

describe("RevealCodeButton", () => {
  it("shows Reveal and calls the handler once", async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();
    render(<RevealCodeButton revealing={false} onReveal={onReveal} />);

    const button = screen.getByRole("button", { name: "Reveal" });
    expect(button).toHaveClass(...uiTextButton.split(" "));

    await user.click(button);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it("is disabled and shows the waiting text while revealing", () => {
    render(<RevealCodeButton revealing onReveal={() => undefined} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Revealing");
  });
});
