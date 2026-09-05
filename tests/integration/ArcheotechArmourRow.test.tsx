// tests/integration/ArcheotechArmourRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArcheotechArmourRow } from "../../src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow";
import type { ArcheotechItem } from "../../src/types/Character";

const baseItem: ArcheotechItem = {
  id: "a1",
  name: "Ork Mega Armour",
  type: "Armour",
  ap: 10,
  locations: ["head", "body"],
  stacks: true,
  weight: "60 kg",
  value: "—",
  availability: "—",
  description: "Adds +30 Strength and increases size by one step.",
  equipped: true,
};

function renderRow(props: Partial<React.ComponentProps<typeof ArcheotechArmourRow>> = {}) {
  const onToggleEquip = vi.fn();
  const onRemove = vi.fn();
  render(
    <ArcheotechArmourRow
      item={baseItem}
      editable={true}
      onToggleEquip={onToggleEquip}
      onRemove={onRemove}
      {...props}
    />
  );
  return { onToggleEquip, onRemove };
}

describe("ArcheotechArmourRow chips", () => {
  it("shows the Archeotech chip and Location/AP stat chips", () => {
    renderRow();
    expect(screen.getByText("Archeotech")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
  });

  it("shows a Stacks chip when the item stacks", () => {
    renderRow();
    expect(screen.getByText("Stacks")).toBeInTheDocument();
  });

  it("omits the Stacks chip when the item does not stack", () => {
    renderRow({ item: { ...baseItem, stacks: false } });
    expect(screen.queryByText("Stacks")).not.toBeInTheDocument();
  });
});

describe("ArcheotechArmourRow rules", () => {
  it("shows a Rules info modal when a description is present", () => {
    renderRow();
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("shows a placeholder when there is no description", () => {
    renderRow({ item: { ...baseItem, description: undefined, referenceId: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ArcheotechArmourRow equip toggle", () => {
  it("shows Stow and calls onToggleEquip when equipped", async () => {
    const user = userEvent.setup();
    const { onToggleEquip } = renderRow({ item: { ...baseItem, equipped: true } });
    await user.click(screen.getByRole("button", { name: "Stow" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });

  it("shows Wear when not equipped", () => {
    renderRow({ item: { ...baseItem, equipped: false } });
    expect(screen.getByRole("button", { name: "Wear" })).toBeInTheDocument();
  });
});

describe("ArcheotechArmourRow remove", () => {
  it("calls onRemove when Remove is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("ArcheotechArmourRow read-only", () => {
  it("hides the Wear/Stow and Remove buttons when not editable", () => {
    renderRow({ editable: false });
    expect(screen.queryByRole("button", { name: "Stow" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
