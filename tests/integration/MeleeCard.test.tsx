// tests/integration/MeleeCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MeleeCard } from "../../src/pages/CharacterSheet/weapons/MeleeCard";
import type { MeleeWeapon } from "../../src/types/Character";

const baseWeapon: MeleeWeapon = {
  id: "w1",
  name: "Custom Chainsword",
  class: "Melee",
  damage: "1d10+3 R",
  pen: "2",
  weight: "3 kg",
  value: "500 Thrones",
  availability: "Rare",
  custom: true,
};

function renderCard(props: Partial<React.ComponentProps<typeof MeleeCard>> = {}) {
  const onRemove = vi.fn();
  const onAddUpgrade = vi.fn();
  const onRemoveUpgrade = vi.fn();
  const onUpdateQuantity = vi.fn();
  render(
    <MeleeCard
      weapon={baseWeapon}
      editable={true}
      strengthBonus={4}
      forceExpanded
      onRemove={onRemove}
      onAddUpgrade={onAddUpgrade}
      onRemoveUpgrade={onRemoveUpgrade}
      onUpdateQuantity={onUpdateQuantity}
      {...props}
    />
  );
  return { onRemove, onAddUpgrade, onRemoveUpgrade, onUpdateQuantity };
}

describe("MeleeCard upgrades", () => {
  it("opens the upgrade picker and adds a compatible upgrade", async () => {
    const user = userEvent.setup();
    const { onAddUpgrade } = renderCard();
    await user.click(screen.getByRole("button", { name: "Add upgrade" }));
    expect(screen.getByText("Add Upgrade")).toBeInTheDocument();
    await user.click(screen.getByText("Mono"));
    expect(onAddUpgrade).toHaveBeenCalledWith("cr-mono");
  });

  it("removes a fitted upgrade", async () => {
    const user = userEvent.setup();
    const { onRemoveUpgrade } = renderCard({ weapon: { ...baseWeapon, upgrades: ["cr-mono"] } });
    // "Mono" also appears (hidden) in the not-yet-open InfoModal portal, so take the first match.
    const monoLabel = screen.getAllByText("Mono")[0];
    const removeBtn = monoLabel.parentElement!.querySelector("button")!;
    await user.click(removeBtn);
    expect(onRemoveUpgrade).toHaveBeenCalledWith("cr-mono");
  });
});

describe("MeleeCard pistol ammo optimistic saves", () => {
  const pistolSword: MeleeWeapon = {
    id: "w2",
    name: "Chimera Pistol Sword",
    referenceId: "ih-chimera-pistol-sword",
    class: "Melee (Primitive)",
    damage: "1d10+1 R",
    pen: "2",
    alternateRangedAmmoEntries: [
      { id: "e1", name: "Charge Pack (Pistol)", clips: 1, rounds: 0, loaded: true },
      { id: "e2", name: "Homemade Slugs", clips: 0, rounds: 5, loaded: false },
    ],
  };

  async function openPistolProfile(onUpdateAlternateRangedAmmoEntries = vi.fn()) {
    const user = userEvent.setup();
    renderCard({ weapon: pistolSword, onUpdateAlternateRangedAmmoEntries });
    await user.click(screen.getByRole("button", { name: "Pistol" }));
    return { user, onUpdateAlternateRangedAmmoEntries };
  }

  it("asks for an optimistic save when a different ammo type is marked as loaded", async () => {
    const { user, onUpdateAlternateRangedAmmoEntries } = await openPistolProfile();

    await user.click(screen.getByRole("button", { name: "Mark Homemade Slugs as loaded" }));

    expect(onUpdateAlternateRangedAmmoEntries).toHaveBeenCalledWith(
      [
        expect.objectContaining({ id: "e1", loaded: false }),
        expect.objectContaining({ id: "e2", loaded: true }),
      ],
      "e2",
      { optimistic: true }
    );
  });

  it("asks for an optimistic save when an ammo type is removed", async () => {
    const { user, onUpdateAlternateRangedAmmoEntries } = await openPistolProfile();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[removeButtons.length - 1]);

    expect(onUpdateAlternateRangedAmmoEntries).toHaveBeenCalledWith(
      [expect.objectContaining({ id: "e1" })],
      "e1",
      { optimistic: true }
    );
  });
});

describe("MeleeCard equip toggle", () => {
  it("calls onToggleEquip when the equip button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleEquip = vi.fn();
    renderCard({ onToggleEquip, isEquipped: false });
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });
});

describe("MeleeCard class chips", () => {
  it("shows a Melee chip for a plain melee weapon", () => {
    renderCard();
    expect(screen.getByText("Melee")).toBeInTheDocument();
    expect(screen.queryByText("Thrown")).not.toBeInTheDocument();
  });

  it("shows both Melee and Thrown chips for a melee/thrown weapon", () => {
    renderCard({ weapon: { ...baseWeapon, class: "Melee / Thrown" } });
    expect(screen.getByText("Melee")).toBeInTheDocument();
    expect(screen.getByText("Thrown")).toBeInTheDocument();
  });
});

describe("MeleeCard thrown weapon", () => {
  it("shows a quantity stepper for a thrown melee weapon", () => {
    renderCard({ weapon: { ...baseWeapon, class: "Melee / Thrown", quantity: 3 } });
    expect(screen.getByText("Quantity")).toBeInTheDocument();
  });

  it("does not show a quantity stepper for a plain melee weapon", () => {
    renderCard();
    expect(screen.queryByText("Quantity")).not.toBeInTheDocument();
  });

  it("calls onUpdateQuantity when the stepper is incremented", async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity } = renderCard({
      weapon: { ...baseWeapon, class: "Melee / Thrown", quantity: 3 },
    });
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(4);
  });
});

describe("MeleeCard craftsmanship", () => {
  it("shows the craftsmanship description in an info modal", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: "Show information about Common Weapon" }));
    expect(screen.getByText(/no additional modifier/)).toBeInTheDocument();
  });
});

describe("MeleeCard Two-Handed quality", () => {
  it("shows Two-Handed in Qualities for a weapon whose reference has that flag", () => {
    renderCard({
      weapon: {
        id: "gw1",
        name: "Great Weapon",
        referenceId: "cr-great-weapon",
        damage: "2d10 R",
        pen: "2",
      },
    });
    expect(screen.getByText(/Two-Handed/)).toBeInTheDocument();
  });

  it("does not show Two-Handed for a weapon whose reference lacks the flag", () => {
    renderCard({
      weapon: { id: "s1", name: "Sword", referenceId: "cr-shield", damage: "1d5 I", pen: "0" },
    });
    expect(screen.queryByText(/Two-Handed/)).not.toBeInTheDocument();
  });
});
