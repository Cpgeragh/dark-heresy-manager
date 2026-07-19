// tests/integration/GearPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { GearPicker } from "../../src/pages/characterSheet/GearTab/GearPicker";

// "Backpack" has a fixed (non-variable) cost, so clicking it calls onSelect
// directly with no GM-assigned-cost sub-step in between.
const GEAR_NAME = "Backpack";

function row(name: string): HTMLElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest("button"))
    .find((el): el is HTMLElement => el !== null);
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match;
}

function renderPicker(editable = true) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<GearPicker editable={editable} onSelect={onSelect} onClose={onClose} onCustom={vi.fn()} />);
  return { onSelect, onClose };
}

describe("GearPicker", () => {
  it("renders gear from reference data", () => {
    renderPicker();
    expect(screen.getAllByText(GEAR_NAME).length).toBeGreaterThan(0);
  });

  it("calls onSelect with the chosen ref when an item is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(GEAR_NAME));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: GEAR_NAME }));
  });

  it("does not call onSelect when clicked in read-only mode", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker(false);
    await user.click(row(GEAR_NAME));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
