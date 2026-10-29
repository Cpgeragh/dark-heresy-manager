import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { Chip, NestedChip } from "../../src/ui/chips/Chip";
import { GlowChip } from "../../src/ui/chips/GlowChip";
import { RemovableChip } from "../../src/ui/chips/RemovableChip";
import {
  chipColours,
  colourGlowPulseCore,
  colourGlowPulseRgb,
  type ChipColour,
} from "../../src/ui/styles/colourTokens";
import { uiCorner } from "../../src/ui/styles/shapeStyles";

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
    expect(chip).toHaveClass(uiCorner, "border");
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

  it("uses the small size only for nested chips", () => {
    render(<NestedChip colour="slate">Label</NestedChip>);

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

  it("renders passive glow chips with the shared compact-control size", () => {
    render(
      <>
        <GlowChip active colour="emerald">
          Known
        </GlowChip>
        <GlowChip active={false} colour="fuchsia">
          Unknown
        </GlowChip>
      </>
    );

    expect(screen.getByText("Known")).toHaveClass(
      "px-2.5",
      "py-1",
      "text-emerald-300",
      "font-semibold"
    );
    expect(screen.getByText("Unknown")).toHaveClass("px-2.5", "py-1", "text-fuchsia-400/50");
  });

  it.each(Object.keys(colourGlowPulseRgb) as (keyof typeof colourGlowPulseRgb)[])(
    "pulses a %s glow chip in the glow of its own colour",
    (colour) => {
      const rgb = colourGlowPulseRgb[colour];
      render(
        <GlowChip active={false} colour={colour} pulsing>
          Pulse
        </GlowChip>
      );

      const chip = screen.getByText("Pulse");
      expect(chip).toHaveClass("animate-psy-pulse");
      expect(chip.style.getPropertyValue("--glow-lo")).toBe(
        `0 0 1px rgba(${colourGlowPulseCore},1), 0 0 4px rgba(${rgb},1), 0 0 14px rgba(${rgb},0.8)`
      );
      expect(chip.style.getPropertyValue("--glow-hi")).toBe(
        `0 0 2px rgba(${colourGlowPulseCore},1), 0 0 6px rgba(${rgb},1), 0 0 22px rgba(${rgb},0.9)`
      );
    }
  );

  it("sets no pulse variables on a chip that is not pulsing", () => {
    render(
      <GlowChip active colour="teal">
        Still
      </GlowChip>
    );

    expect(screen.getByText("Still").style.getPropertyValue("--glow-lo")).toBe("");
  });

  it("removes an unfinished form choice immediately", async () => {
    const onRemove = vi.fn();
    render(<RemovableChip name="Accurate" onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Accurate" }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before removing saved data", async () => {
    const onRemove = vi.fn();
    render(<RemovableChip name="Bald" confirmation={{ kind: "Quirk" }} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Bald" }));

    const dialog = screen.getByRole("dialog", { name: "Remove Quirk" });
    expect(within(dialog).getByText("Remove Bald from this character?")).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
