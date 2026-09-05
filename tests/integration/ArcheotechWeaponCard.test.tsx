// tests/integration/ArcheotechWeaponCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ArcheotechWeaponCard } from "../../src/pages/CharacterSheet/weapons/ArcheotechWeaponCard";
import type { ArcheotechItem } from "../../src/types/Character";

function renderCard(item: ArcheotechItem) {
  const onRemove = vi.fn();
  render(<ArcheotechWeaponCard item={item} editable onRemove={onRemove} isEquipped />);
  return { onRemove };
}

describe("ArcheotechWeaponCard weapon-class chip", () => {
  it("shows an orange Melee chip for a melee weapon", () => {
    // Real reference entry: Midath-Pattern Power Glove, weaponClass "Melee".
    renderCard({
      id: "a1",
      name: "Midath-Pattern Power Glove",
      referenceId: "lw-midath-power-glove",
    });
    expect(screen.getByText("Melee")).toBeInTheDocument();
  });

  it("shows the real Ranged sub-class chip when the reference has one (e.g. Basic)", () => {
    // Real reference entry: Reclamator Rifle, weaponClass "Basic" — a specific
    // Ranged sub-class, not just the broad "Ranged" category.
    renderCard({ id: "a2", name: "Reclamator Rifle", referenceId: "lw-reclamator-rifle" });
    expect(screen.getByText("Basic")).toBeInTheDocument();
  });

  it("shows no weapon-class chip when the item has no weaponClass and no matching reference", () => {
    renderCard({ id: "a3", name: "Custom Trinket" });
    expect(screen.queryByText("Melee")).not.toBeInTheDocument();
    expect(screen.queryByText("Basic")).not.toBeInTheDocument();
  });
});
