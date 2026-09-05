// tests/integration/CyberneticWeaponCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CyberneticWeaponCard } from "../../src/pages/CharacterSheet/weapons/CyberneticWeaponCard";
import type { CyberneticWeapon } from "../../src/data/reference/cyberneticsReference";
import type { WeaponCraftsmanship } from "../../src/types/Character";

// The Qualities InfoModal is always mounted (closed) into the DOM, and its
// own heading repeats the exact quality name — filter for whichever match is
// NOT inside a <dialog>, i.e. the actual visible text.
function visibleText(text: string): HTMLElement {
  const match = screen.getAllByText(text).find((el) => !el.closest("dialog"));
  if (!match) throw new Error(`No visible (non-dialog) match found for: ${text}`);
  return match;
}

function renderCard(weapon: CyberneticWeapon, craftsmanship: WeaponCraftsmanship = "Common") {
  render(
    <CyberneticWeaponCard
      cyberneticName="Test Mechadendrite"
      weapon={weapon}
      craftsmanship={craftsmanship}
      strengthBonus={4}
    />
  );
}

describe("CyberneticWeaponCard origin", () => {
  it("shows the implant name under a labeled Gained From row", () => {
    renderCard({
      type: "ranged",
      name: "Laspistol (Compact)",
      class: "Pistol",
      damage: "1d10+1 E",
      pen: "0",
    });
    expect(screen.getByText("Gained From")).toBeInTheDocument();
    expect(screen.getByText("Test Mechadendrite")).toBeInTheDocument();
  });
});

describe("CyberneticWeaponCard weapon-class chip", () => {
  it("shows an orange Melee chip for a melee cybernetic weapon", () => {
    renderCard({
      type: "melee",
      name: "Motive Claw",
      class: "Melee",
      damage: "1d10+2 R",
      pen: "2",
    });
    expect(screen.getByText("Melee")).toBeInTheDocument();
  });

  it("shows the real Ranged sub-class chip for a ranged cybernetic weapon (e.g. Pistol)", () => {
    renderCard({
      type: "ranged",
      name: "Laspistol (Compact)",
      class: "Pistol",
      damage: "1d10+1 E",
      pen: "0",
    });
    expect(screen.getByText("Pistol")).toBeInTheDocument();
  });

  it("shows no weapon-class chip when the weapon has no class", () => {
    renderCard({ type: "ranged", name: "Unclassed Weapon", damage: "1d10 I", pen: "0" });
    expect(screen.queryByText("Melee")).not.toBeInTheDocument();
    expect(screen.queryByText("Pistol")).not.toBeInTheDocument();
  });
});

describe("CyberneticWeaponCard craftsmanship effect", () => {
  it("shows the chosen craftsmanship and adds Unreliable for a Poor ranged weapon", () => {
    renderCard(
      {
        type: "ranged",
        name: "Laspistol (Compact)",
        class: "Pistol",
        damage: "1d10+1 E",
        pen: "0",
      },
      "Poor"
    );
    expect(screen.getByText("Poor")).toBeInTheDocument();
    expect(visibleText("Unreliable")).toBeInTheDocument();
  });

  it("adds Reliable for a Good ranged weapon", () => {
    renderCard(
      {
        type: "ranged",
        name: "Laspistol (Compact)",
        class: "Pistol",
        damage: "1d10+1 E",
        pen: "0",
      },
      "Good"
    );
    expect(visibleText("Reliable")).toBeInTheDocument();
  });

  it("does not add a quality for a Common ranged weapon", () => {
    renderCard(
      {
        type: "ranged",
        name: "Laspistol (Compact)",
        class: "Pistol",
        damage: "1d10+1 E",
        pen: "0",
      },
      "Common"
    );
    expect(screen.queryByText("Unreliable")).not.toBeInTheDocument();
    expect(screen.queryByText("Reliable")).not.toBeInTheDocument();
  });

  it("adds +1 damage for a Best melee weapon, matching meleeDamageForCraftsmanship", () => {
    renderCard(
      { type: "melee", name: "Motive Claw", class: "Melee", damage: "1d10+2 R", pen: "2" },
      "Best"
    );
    expect(screen.getByText("1d10+3")).toBeInTheDocument();
  });

  it("leaves melee damage unchanged for Poor/Common/Good", () => {
    renderCard(
      { type: "melee", name: "Motive Claw", class: "Melee", damage: "1d10+2 R", pen: "2" },
      "Good"
    );
    expect(screen.getByText("1d10+2")).toBeInTheDocument();
  });
});

describe("CyberneticWeaponCard expand/collapse", () => {
  it("starts expanded and hides the stats/qualities section when collapsed", async () => {
    const user = userEvent.setup();
    renderCard({
      type: "ranged",
      name: "Laspistol (Compact)",
      class: "Pistol",
      damage: "1d10+1 E",
      pen: "0",
    });
    expect(screen.getByText("Damage")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Laspistol \(Compact\)/ }));
    expect(screen.queryByText("Damage")).not.toBeInTheDocument();
  });

  it("shows the section again when expanded a second time", async () => {
    const user = userEvent.setup();
    renderCard({
      type: "ranged",
      name: "Laspistol (Compact)",
      class: "Pistol",
      damage: "1d10+1 E",
      pen: "0",
    });
    const header = screen.getByRole("button", { name: /Laspistol \(Compact\)/ });
    await user.click(header);
    await user.click(header);
    expect(screen.getByText("Damage")).toBeInTheDocument();
  });
});
