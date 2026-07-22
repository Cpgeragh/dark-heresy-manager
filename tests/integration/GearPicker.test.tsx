// tests/integration/GearPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { GearPicker } from "../../src/pages/characterSheet/GearTab/GearPicker";

// "Backpack" has a fixed (non-variable) cost, so clicking it calls onSelect
// directly with no GM-assigned-cost sub-step in between.
const GEAR_NAME = "Backpack";
const VARIABLE_GEAR_NAME = "Charm";

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
  render(
    <GearPicker editable={editable} onSelect={onSelect} onClose={onClose} onCustom={vi.fn()} />
  );
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

  it("accepts a variable cost without requiring rarity when availability is fixed", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(VARIABLE_GEAR_NAME));

    const addButton = screen.getByRole("button", { name: "Add to Inventory" });
    const costInput = screen.getByLabelText(/Cost \(Thrones\)/);
    expect(addButton).toBeDisabled();
    expect(screen.queryByLabelText(/Rarity/)).not.toBeInTheDocument();

    await user.type(costInput, "abc");
    expect(costInput).toHaveValue("");
    expect(addButton).toBeDisabled();

    await user.type(costInput, "500");
    await user.click(addButton);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: VARIABLE_GEAR_NAME }),
      "500 Thrones",
      undefined
    );
  });

  it("returns to the list from the assigned-cost header and resets entered metadata", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(VARIABLE_GEAR_NAME));
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "75");
    await user.click(screen.getAllByRole("button", { name: "Back" })[0]);

    expect(screen.getByPlaceholderText("Search gear…")).toBeInTheDocument();
    await user.click(row(VARIABLE_GEAR_NAME));
    expect(screen.getByLabelText(/Cost \(Thrones\)/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add to Inventory" })).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
