// tests/integration/ArcheotechShieldRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

function renderRow(
  props: Partial<React.ComponentProps<typeof ArcheotechShieldRow>> = {},
  { collapsed = false } = {}
) {
  const onRemove = vi.fn();
  render(
    <ArcheotechShieldRow item={baseItem} editable isEquipped onRemove={onRemove} {...props} />
  );
  if (!collapsed) {
    fireEvent.click(screen.getByRole("button", { name: /^Expand .* details$/ }));
  }
  return { onRemove };
}

describe("ArcheotechShieldRow shared header and Rules line", () => {
  it("shows the Remove button in the closed header", () => {
    renderRow({ isEquipped: false }, { collapsed: true });
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Archeotech Buckler" })).toBeInTheDocument();
  });

  it("shows an information button beside the name and a Rules line when expanded", () => {
    renderRow({ isEquipped: true });
    expect(
      screen.getByRole("button", { name: "Show information about Archeotech Buckler" })
    ).toBeInTheDocument();
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
  });
});

describe("ArcheotechShieldRow rules", () => {
  it("shows the item's own rules behind the Rules information button", () => {
    renderRow({ item: { ...baseItem, rules: "Absorbs one hit." } });
    expect(
      screen.getByRole("button", { name: "Show information about Archeotech Buckler Rules" })
    ).toBeInTheDocument();
  });
});

describe("ArcheotechShieldRow chips", () => {
  it("shows both an Archeotech chip and a Shield chip", () => {
    renderRow();
    expect(screen.getByText("Archeotech")).toBeInTheDocument();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });
});

describe("ArcheotechShieldRow expand/collapse", () => {
  it("starts collapsed even when equipped and hides stats when collapsed", async () => {
    const user = userEvent.setup();
    renderRow({ isEquipped: true }, { collapsed: true });
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand Archeotech Buckler details" }));
    expect(screen.getByText("AP")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Collapse Archeotech Buckler details" }));
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
  });

  it("starts collapsed when not equipped", () => {
    renderRow({ isEquipped: false }, { collapsed: true });
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
  });

  it("shows stats again when expanded a second time", async () => {
    const user = userEvent.setup();
    renderRow({ isEquipped: false }, { collapsed: true });
    await user.click(screen.getByRole("button", { name: "Expand Archeotech Buckler details" }));
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
  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow({ isEquipped: true });
    await user.click(screen.getByRole("button", { name: "Remove Archeotech Buckler" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
