import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { Chip } from "../../src/ui/chips/Chip";
import { chipColours, type ChipColour } from "../../src/ui/styles/colourTokens";

describe("Chip", () => {
  it.each(Object.keys(chipColours) as ChipColour[])("applies the %s palette classes", (colour) => {
    render(<Chip colour={colour}>Label</Chip>);

    for (const className of chipColours[colour].split(" ")) {
      expect(screen.getByText("Label")).toHaveClass(className);
    }
  });

  it("adds no palette classes when no colour is given", () => {
    render(<Chip>Label</Chip>);

    const chip = screen.getByText("Label");
    expect(chip).toHaveClass("rounded", "border");
    for (const colour of Object.values(chipColours)) {
      expect(chip.className).not.toContain(colour);
    }
  });

  it("keeps extra classes alongside the palette classes", () => {
    render(
      <Chip colour="sky" className="font-code shrink-0">
        Label
      </Chip>
    );

    expect(screen.getByText("Label")).toHaveClass("text-sky-300", "font-code", "shrink-0");
  });

  it("applies the size classes", () => {
    render(
      <Chip size="sm" colour="slate">
        Label
      </Chip>
    );

    expect(screen.getByText("Label")).toHaveClass("h-5");
  });

  it("renders a button chip with the palette classes that can be clicked", async () => {
    const onClick = vi.fn();
    render(
      <Chip as="button" colour="red" onClick={onClick}>
        Press
      </Chip>
    );

    const button = screen.getByRole("button", { name: "Press" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("border-red-500/50", "text-red-300");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
