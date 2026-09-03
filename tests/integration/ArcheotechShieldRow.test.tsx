// tests/integration/ArcheotechShieldRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArcheotechShieldRow } from "../../src/pages/CharacterSheet/weapons/ArcheotechShieldRow";
import type { ArcheotechItem } from "../../src/types/Character";

const baseItem: ArcheotechItem = {
  id: "a1",
  name: "Archeotech Buckler",
  ap: 4,
  locations: ["leftArm", "body"],
  weight: "3 kg",
  value: "—",
  availability: "Very Rare",
};

function renderRow(props: Partial<React.ComponentProps<typeof ArcheotechShieldRow>> = {}) {
  const onRemove = vi.fn();
  render(
    <ArcheotechShieldRow item={baseItem} editable isEquipped onRemove={onRemove} {...props} />
  );
  return { onRemove };
}

describe("ArcheotechShieldRow chips", () => {
  it("shows both an Archeotech chip and a Shield chip", () => {
    renderRow();
    expect(screen.getByText("Archeotech")).toBeInTheDocument();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });
});

describe("ArcheotechShieldRow expand/collapse", () => {
  it("starts expanded when equipped and hides stats when collapsed", async () => {
    const user = userEvent.setup();
    renderRow({ isEquipped: true });
    expect(screen.getByText("AP")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Archeotech Buckler/ }));
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
  });

  it("starts collapsed when not equipped", () => {
    renderRow({ isEquipped: false });
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
  });

  it("shows stats again when expanded a second time", async () => {
    const user = userEvent.setup();
    renderRow({ isEquipped: false });
    await user.click(screen.getByRole("button", { name: /Archeotech Buckler/ }));
    expect(screen.getByText("AP")).toBeInTheDocument();
  });
});

describe("ArcheotechShieldRow equip toggle", () => {
  it("calls onToggleEquip when the equip button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleEquip = vi.fn();
    renderRow({ onToggleEquip, isEquipped: false });
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });
});

describe("ArcheotechShieldRow remove", () => {
  it("calls onRemove when Remove is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow({ isEquipped: true });
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
