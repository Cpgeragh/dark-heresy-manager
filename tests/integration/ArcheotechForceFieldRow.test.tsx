// tests/integration/ArcheotechForceFieldRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArcheotechForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow";
import type { ArcheotechItem } from "../../src/types/Character";

const baseItem: ArcheotechItem = {
  id: "f1",
  name: "Jokaerian Field",
  type: "Force Field",
  protectionRating: 70,
  weight: "0.5 kg",
  value: "50,000 Thrones",
  availability: "Near Unique",
  description: "Functions only against psychic attacks.",
  equipped: true,
};

function renderRow(props: Partial<React.ComponentProps<typeof ArcheotechForceFieldRow>> = {}) {
  const onToggleEquip = vi.fn();
  const onRemove = vi.fn();
  render(
    <ArcheotechForceFieldRow
      item={baseItem}
      editable={true}
      onToggleEquip={onToggleEquip}
      onRemove={onRemove}
      {...props}
    />
  );
  return { onToggleEquip, onRemove };
}

describe("ArcheotechForceFieldRow chips", () => {
  it("shows the Archeotech chip and a PR stat chip", () => {
    renderRow();
    expect(screen.getByText("Archeotech")).toBeInTheDocument();
    expect(screen.getByText("PR")).toBeInTheDocument();
  });

  it("omits the PR chip when protectionRating is not set", () => {
    renderRow({ item: { ...baseItem, protectionRating: undefined } });
    expect(screen.queryByText("PR")).not.toBeInTheDocument();
  });
});

describe("ArcheotechForceFieldRow rules", () => {
  it("shows a Rules info modal when a description is present", () => {
    renderRow();
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("shows a placeholder when there is no description", () => {
    renderRow({ item: { ...baseItem, description: undefined, referenceId: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ArcheotechForceFieldRow equip toggle", () => {
  it("shows Deactivate and calls onToggleEquip when equipped", async () => {
    const user = userEvent.setup();
    const { onToggleEquip } = renderRow({ item: { ...baseItem, equipped: true } });
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });

  it("shows Activate when not equipped", () => {
    renderRow({ item: { ...baseItem, equipped: false } });
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
  });
});

describe("ArcheotechForceFieldRow remove", () => {
  it("calls onRemove when Remove is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("ArcheotechForceFieldRow read-only", () => {
  it("hides the Activate/Deactivate and Remove buttons when not editable", () => {
    renderRow({ editable: false });
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
