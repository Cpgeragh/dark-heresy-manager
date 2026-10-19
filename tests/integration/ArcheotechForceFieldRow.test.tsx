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
  it("shows the description in the information window beside the name", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(
      screen.getByRole("button", { name: "Show information about Jokaerian Field" })
    );
    expect(screen.getByRole("dialog", { name: "Jokaerian Field" })).toHaveTextContent(
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
      screen.getByRole("button", { name: "Show information about Jokaerian Field" })
    );
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("puts the Remove button first in the action area", () => {
    renderRow();
    const button = screen.getByRole("button", { name: /^Remove / });
    expect(button.parentElement?.parentElement?.firstElementChild?.contains(button)).toBe(true);
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
  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();
    await user.click(screen.getByRole("button", { name: "Remove Jokaerian Field" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("ArcheotechForceFieldRow read-only", () => {
  it("hides the Activate/Deactivate and Remove buttons when not editable", () => {
    renderRow({ editable: false });
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Jokaerian Field" })
    ).not.toBeInTheDocument();
  });
});
