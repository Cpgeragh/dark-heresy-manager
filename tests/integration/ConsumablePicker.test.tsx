// tests/integration/ConsumablePicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ConsumablePicker } from "../../src/pages/CharacterSheet/GearTab/ConsumablePicker";

const CONSUMABLE_NAME = "Amasec";
const OPEN_ENDED_NAME = "Kataline Malmsey";

function row(name: string): HTMLButtonElement {
  return (screen.queryByRole("button", { name: `Select ${name}` }) ??
    screen.getByRole("button", { name: `Expand ${name} details` })) as HTMLButtonElement;
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

  it("includes IH consumables but excludes IH drugs", () => {
    renderPicker();
    expect(screen.getByText("Belly-Churn")).toBeInTheDocument();
    expect(screen.queryByText("Dryas")).not.toBeInTheDocument();
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

  it("asks for a cost of at least 10,000 on Kataline Malmsey before choosing it", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(OPEN_ENDED_NAME));
    expect(onSelect).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Assigned Cost" });
    const addButton = within(dialog).getByRole("button", { name: "Add to Inventory" });
    const costInput = within(dialog).getByLabelText(/Cost \(Thrones\)/);
    await user.type(costInput, "9999");
    expect(
      within(dialog).getByText("Must be a whole number of 10,000 or more.")
    ).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    await user.clear(costInput);
    await user.type(costInput, "10000");
    await user.click(addButton);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: OPEN_ENDED_NAME }),
      "10,000 Thrones"
    );
  });

  it("returns to the list from the Close cross on the assigned-cost screen", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(OPEN_ENDED_NAME));
    const dialog = screen.getByRole("dialog", { name: "Assigned Cost" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.getByPlaceholderText("Search consumables…")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the Kataline Malmsey card as ₮ 10,000+ with the assigned-on-add note", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: `Expand ${OPEN_ENDED_NAME} details` }));
    expect(screen.getByText("₮ 10,000+")).toBeInTheDocument();
    expect(screen.getByText("Cost assigned on add")).toBeInTheDocument();
  });
});
