// tests/integration/GearPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { GearPicker } from "../../src/pages/CharacterSheet/GearTab/GearPicker";
import { GEAR_REFERENCE } from "../../src/data/reference/gearReference";
import { SkillSource } from "../../src/types/SkillSource";

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
  it("contains the complete IH Gear set and excludes the cross-category entries", () => {
    const ihGear = GEAR_REFERENCE.filter((item) => item.source === SkillSource.IH);

    expect(ihGear).toHaveLength(88);
    expect(ihGear).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Braid Cloak",
          value: "80 Thrones",
          weight: "2 kg",
          availability: "Uncommon",
        }),
        expect.objectContaining({
          name: "Psy-Tracker",
          value: "1,000 Thrones",
          weight: "1.5 kg",
          availability: "Rare",
        }),
        expect.objectContaining({
          id: "ih-legature",
          name: "Legature",
          availability: "—",
        }),
        expect.objectContaining({
          id: "ih-sigil-of-question",
          name: "Sigil of Question",
          availability: "—",
        }),
      ])
    );
    expect(ihGear.some((item) => item.name === "Dryas")).toBe(false);
    expect(ihGear.some((item) => item.name === "Ploin Juice")).toBe(false);
    expect(ihGear.some((item) => item.name === "Void Rounds")).toBe(false);
  });

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

  it("requires the DM to assign both cost and rarity for the Legate Investigator items", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row("Sigil of Question"));

    const addButton = screen.getByRole("button", { name: "Add to Inventory" });
    const costInput = screen.getByLabelText(/Cost \(Thrones\)/);
    const rarityPicker = screen.getByLabelText(/Rarity/);
    expect(costInput).toBeRequired();
    expect(rarityPicker).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("Required")).toBeInTheDocument();

    await user.type(costInput, "0");
    expect(addButton).toBeDisabled();

    await user.click(rarityPicker);
    await user.click(screen.getByRole("button", { name: "Rare" }));
    await user.click(screen.getByRole("button", { name: "Add to Inventory" }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Sigil of Question" }),
      "0 Thrones",
      "Rare"
    );
  });

  it("uses a close button in the assigned-cost header and returns through the Back button", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(VARIABLE_GEAR_NAME));
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "75");
    const assignedDialog = screen.getByRole("dialog", { name: "Assigned Cost" });
    expect(within(assignedDialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(within(assignedDialog).getAllByRole("button", { name: "Back" })).toHaveLength(1);
    await user.click(within(assignedDialog).getByRole("button", { name: "Back" }));

    expect(screen.getByPlaceholderText("Search gear…")).toBeInTheDocument();
    await user.click(row(VARIABLE_GEAR_NAME));
    expect(screen.getByLabelText(/Cost \(Thrones\)/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add to Inventory" })).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
