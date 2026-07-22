// tests/integration/ConsumablePicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ConsumablePicker } from "../../src/pages/characterSheet/GearTab/ConsumablePicker";

const CONSUMABLE_NAME = "Amasec";

function row(name: string): HTMLButtonElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest("button"))
    .find((el): el is HTMLButtonElement => el !== null);
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match;
}

function renderPicker(editable = true) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<ConsumablePicker editable={editable} onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

describe("ConsumablePicker", () => {
  it("renders consumables from reference data", () => {
    renderPicker();
    expect(screen.getAllByText(CONSUMABLE_NAME).length).toBeGreaterThan(0);
  });

  it("calls onSelect with the chosen ref when an item is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(CONSUMABLE_NAME));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: CONSUMABLE_NAME }));
  });

  it("does not call onSelect when clicked in read-only mode", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker(false);
    await user.click(row(CONSUMABLE_NAME));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
