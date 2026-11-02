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
// The picker draws a full card for each of its 165 reference items, so a click takes about 2 seconds.
vi.setConfig({ testTimeout: 15_000 });

const GEAR_NAME = "Backpack";
const VARIABLE_GEAR_NAME = "Charm";

function row(name: string): HTMLButtonElement {
  return (screen.queryByRole("button", { name: `Select ${name}` }) ??
    screen.getByRole("button", { name: `Expand ${name} details` })) as HTMLButtonElement;
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
      undefined,
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
      "Rare",
      undefined
    );
  });

  it("asks only for a weight on the Forgery Kit, which has a set cost and rarity", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row("Forgery Kit"));

    const addButton = screen.getByRole("button", { name: "Add to Inventory" });
    const weightInput = screen.getByLabelText(/Weight \(kg\)/);
    expect(screen.getByRole("dialog", { name: "Assigned Weight" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Cost \(Thrones\)/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Rarity/)).not.toBeInTheDocument();
    expect(weightInput).toBeRequired();
    expect(addButton).toBeDisabled();

    await user.type(weightInput, "abc");
    expect(weightInput).toHaveValue("");

    await user.type(weightInput, "2.5");
    await user.click(addButton);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Forgery Kit" }),
      undefined,
      undefined,
      "2.5 kg"
    );
  });

  it("asks for both a cost and a weight on the Cilice", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row("Cilice"));

    const addButton = screen.getByRole("button", { name: "Add to Inventory" });
    expect(screen.getByRole("dialog", { name: "Assigned Cost and Weight" })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "500");
    expect(addButton).toBeDisabled();

    await user.type(screen.getByLabelText(/Weight \(kg\)/), "1");
    await user.click(addButton);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cilice" }),
      "500 Thrones",
      undefined,
      "1 kg"
    );
  });

  it("asks for a cost of at least 20 on the Cylinder, which is priced 20+", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row("Cylinder"));

    const addButton = screen.getByRole("button", { name: "Add to Inventory" });
    const costInput = screen.getByLabelText(/Cost \(Thrones\)/);
    expect(screen.getByRole("dialog", { name: "Assigned Cost" })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    await user.type(costInput, "19");
    expect(screen.getByText("Must be a whole number of 20 or more.")).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    await user.clear(costInput);
    await user.type(costInput, "20");
    expect(addButton).toBeEnabled();
    await user.click(addButton);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cylinder" }),
      "20 Thrones",
      undefined,
      undefined
    );
  });

  it("shows the Cylinder card as ₮ 20+ with the assigned-on-add note", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Expand Cylinder details" }));
    expect(screen.getByText("₮ 20+")).toBeInTheDocument();
    expect(screen.getByText("Cost assigned on add")).toBeInTheDocument();
  });

  it("returns to the list from the Close cross on the assigned-cost screen", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(VARIABLE_GEAR_NAME));
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "75");
    const assignedDialog = screen.getByRole("dialog", { name: "Assigned Cost" });
    expect(within(assignedDialog).queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await user.click(within(assignedDialog).getByRole("button", { name: "Close" }));

    expect(screen.getByPlaceholderText("Search gear…")).toBeInTheDocument();
    await user.click(row(VARIABLE_GEAR_NAME));
    expect(screen.getByLabelText(/Cost \(Thrones\)/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add to Inventory" })).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("returns to the list from the Cancel button on the assigned-cost screen", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(VARIABLE_GEAR_NAME));
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "75");
    const assignedDialog = screen.getByRole("dialog", { name: "Assigned Cost" });
    expect(within(assignedDialog).getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
    await user.click(within(assignedDialog).getByRole("button", { name: "Cancel" }));

    expect(screen.getByPlaceholderText("Search gear…")).toBeInTheDocument();
    await user.click(row(VARIABLE_GEAR_NAME));
    expect(screen.getByLabelText(/Cost \(Thrones\)/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add to Inventory" })).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
