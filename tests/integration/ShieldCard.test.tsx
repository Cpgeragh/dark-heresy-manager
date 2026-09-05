// tests/integration/ShieldCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ShieldCard } from "../../src/pages/CharacterSheet/weapons/ShieldCard";
import type { ShieldItem } from "../../src/types/Character";

const baseItem: ShieldItem = {
  id: "s1",
  name: "Custom Buckler",
  ap: 2,
  locations: "Arm",
  damage: "1d10 I",
  pen: "0",
  specialRules: "Defensive",
  weight: "2 kg",
  value: "30 Thrones",
  availability: "Scarce",
  custom: true,
};

function renderCard(props: Partial<React.ComponentProps<typeof ShieldCard>> = {}) {
  const onRemove = vi.fn();
  render(<ShieldCard item={baseItem} editable={true} isEquipped onRemove={onRemove} {...props} />);
  return { onRemove };
}

describe("ShieldCard header", () => {
  it("shows a Shield chip under the name", () => {
    renderCard();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });
});

describe("ShieldCard stats", () => {
  it("shows AP, Location, Damage, Type and Pen when expanded", () => {
    renderCard();
    expect(screen.getByText("AP")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Arm")).toBeInTheDocument();
    expect(screen.getByText("Damage")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Impact")).toBeInTheDocument();
    expect(screen.getByText("Pen")).toBeInTheDocument();
  });

  it("hides stats when collapsed", () => {
    renderCard({ isEquipped: false });
    expect(screen.queryByText("Damage")).not.toBeInTheDocument();
  });
});

describe("ShieldCard expand/collapse", () => {
  it("toggles expanded state when the header is clicked", async () => {
    const user = userEvent.setup();
    renderCard({ isEquipped: false });
    expect(screen.queryByText("Damage")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand Custom Buckler details" }));
    expect(screen.getByText("Damage")).toBeInTheDocument();
  });
});

describe("ShieldCard equip toggle", () => {
  it("calls onToggleEquip when the equip button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleEquip = vi.fn();
    renderCard({ onToggleEquip, isEquipped: false });
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });
});

describe("ShieldCard remove", () => {
  it("calls onRemove when Remove is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("ShieldCard qualities and rules", () => {
  it("shows the special rules text", () => {
    renderCard();
    // The Qualities InfoModal (always mounted, just closed) also contains the
    // rule name as its own heading, so this can match more than once.
    expect(screen.getAllByText("Defensive").length).toBeGreaterThanOrEqual(1);
  });

  it("shows a Rules info modal when notes are present", () => {
    renderCard({ item: { ...baseItem, notes: "Some rules text." } });
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no notes", () => {
    renderCard({ item: { ...baseItem, notes: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});
