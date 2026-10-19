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
  it("shows the description in the information window beside the name", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(
      screen.getByRole("button", { name: "Show information about Ork Mega Armour" })
    );
    expect(screen.getByRole("dialog", { name: "Ork Mega Armour" })).toHaveTextContent(
      baseItem.description!
    );
  });

  it("shows an empty Rules line when the item has no rules text", () => {
    renderRow();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("says no description was recorded when there is none", async () => {
    const user = userEvent.setup();
    renderRow({ item: { ...baseItem, description: undefined, referenceId: undefined } });
    await user.click(
      screen.getByRole("button", { name: "Show information about Ork Mega Armour" })
    );
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("puts the Remove button first in the action area", () => {
    renderRow();
    const button = screen.getByRole("button", { name: /^Remove / });
    expect(button.parentElement?.parentElement?.firstElementChild?.contains(button)).toBe(true);
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
  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();
    await user.click(screen.getByRole("button", { name: "Remove Ork Mega Armour" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("ArcheotechArmourRow read-only", () => {
  it("hides the Wear/Stow and Remove buttons when not editable", () => {
    renderRow({ editable: false });
    expect(screen.queryByRole("button", { name: "Stow" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Ork Mega Armour" })
    ).not.toBeInTheDocument();
  });
});
