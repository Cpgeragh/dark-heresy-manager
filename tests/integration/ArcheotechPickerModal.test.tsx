// tests/integration/ArcheotechPickerModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArcheotechPickerModal } from "../../src/pages/CharacterSheet/ArcheotechTab/ArcheotechPickerModal";

// "Belecane-Pattern Stasis Grenade" has a fixed (non-variable) cost and
// availability, so clicking it calls onSelect directly with no GM-input step.
const ITEM_NAME = "Belecane-Pattern Stasis Grenade";
// "Cameleoline Grid" has value/availability of "—", so clicking it opens the
// GM-assigned-values step instead of calling onSelect directly.
const GM_ITEM_NAME = "Cameleoline Grid";

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
  const onCustom = vi.fn();
  render(
    <ArcheotechPickerModal
      editable={editable}
      onSelect={onSelect}
      onClose={onClose}
      onCustom={onCustom}
    />
  );
  return { onSelect, onClose, onCustom };
}

describe("ArcheotechPickerModal", () => {
  it("renders archeotech items from reference data", () => {
    renderPicker();
    expect(screen.getAllByText(ITEM_NAME).length).toBeGreaterThan(0);
  });

  it("calls onSelect with the chosen ref when an item with a fixed cost is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(ITEM_NAME));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: ITEM_NAME }));
  });

  it("does not call onSelect when clicked in read-only mode", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker(false);
    await user.click(row(ITEM_NAME));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("opens the GM-assigned-values step for an item with unknown cost/availability", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(GM_ITEM_NAME));
    expect(screen.getByText(/has no standard cost/)).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("requires and submits both assigned cost and rarity", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(GM_ITEM_NAME));

    const addButton = screen.getByRole("button", { name: "Add to Inventory" });
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "5000");
    expect(addButton).toBeDisabled();

    await user.click(screen.getByLabelText(/Rarity/));
    await user.click(screen.getByRole("button", { name: "Rare" }));
    expect(screen.getByLabelText(/Rarity/)).toHaveTextContent("Rare");

    await user.click(screen.getByRole("button", { name: "Add to Inventory" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: GM_ITEM_NAME }),
      "5,000 Thrones",
      "Rare"
    );
  });

  it("restores both the assigned-values form and the parent list positions", async () => {
    const user = userEvent.setup();
    renderPicker();

    const list = screen
      .getByRole("dialog", { name: "Add Archeotech" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    if (!list) throw new Error("No Archeotech picker scroll container found");
    list.scrollTop = 130;
    fireEvent.scroll(list);

    await user.click(row(GM_ITEM_NAME));
    const assignedForm = screen
      .getByRole("dialog", { name: "GM-Assigned Values" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    if (!assignedForm) throw new Error("No assigned-values scroll container found");
    assignedForm.scrollTop = 210;
    fireEvent.scroll(assignedForm);

    await user.click(screen.getByLabelText(/Rarity/));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen
        .getByRole("dialog", { name: "GM-Assigned Values" })
        .querySelector<HTMLElement>(".overflow-y-auto")?.scrollTop
    ).toBe(210);

    const assignedDialog = screen.getByRole("dialog", { name: "GM-Assigned Values" });
    const assignedBack = assignedDialog.querySelector<HTMLButtonElement>('button[aria-label="Back"]');
    if (!assignedBack) throw new Error("No assigned-values Back button found");
    await user.click(assignedBack);
    expect(
      screen
        .getByRole("dialog", { name: "Add Archeotech" })
        .querySelector<HTMLElement>(".overflow-y-auto")?.scrollTop
    ).toBe(130);
  });
});
