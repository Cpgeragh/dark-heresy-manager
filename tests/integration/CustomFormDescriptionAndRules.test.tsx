// tests/integration/CustomFormDescriptionAndRules.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CustomRangedForm } from "../../src/pages/CharacterSheet/weapons/CustomRangedForm";
import { CustomMeleeForm } from "../../src/pages/CharacterSheet/weapons/CustomMeleeForm";
import { CustomGrenadeForm } from "../../src/pages/CharacterSheet/weapons/CustomGrenadeForm";
import { CustomShieldForm } from "../../src/pages/CharacterSheet/weapons/CustomShieldForm";
import { CustomImplantForm } from "../../src/pages/CharacterSheet/CyberneticsTab/CustomImplantForm";
import { CustomArcheotechForm } from "../../src/pages/CharacterSheet/ArcheotechTab/CustomArcheotechForm";
import { CustomConsumableForm } from "../../src/pages/CharacterSheet/GearTab/CustomConsumableForm";

const noop = vi.fn();

function expectBoxes(description: string, rules: string) {
  expect(screen.getByLabelText("Description")).toHaveValue(description);
  expect(screen.getByLabelText("Rules")).toHaveValue(rules);
}

describe("Custom item forms keep Description and Rules in separate boxes", () => {
  it("Ranged weapon", () => {
    render(
      <CustomRangedForm
        initialWeapon={{
          id: "w1",
          name: "Lance",
          description: "A long lance.",
          rules: "Ignores AP.",
        }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("A long lance.", "Ignores AP.");
  });

  it("Melee weapon", () => {
    render(
      <CustomMeleeForm
        initialWeapon={{ id: "w2", name: "Pike", description: "A long pike.", rules: "Reach." }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("A long pike.", "Reach.");
  });

  it("Grenade", () => {
    render(
      <CustomGrenadeForm
        initialGrenade={{
          id: "g1",
          name: "Smoke Pot",
          quantity: 1,
          description: "A clay pot.",
          rules: "Fills a 3m area.",
        }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("A clay pot.", "Fills a 3m area.");
  });

  it("Shield stores its description in notes", () => {
    render(
      <CustomShieldForm
        initialShield={{ id: "s1", name: "Aegis", ap: 3, notes: "A tall shield.", rules: "Cover." }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("A tall shield.", "Cover.");
  });

  it("Implant stores its description in notes", () => {
    render(
      <CustomImplantForm
        initialItem={{ id: "i1", name: "Eye", notes: "A glass eye.", rules: "Sees in the dark." }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("A glass eye.", "Sees in the dark.");
  });

  it("Archeotech item", () => {
    render(
      <CustomArcheotechForm
        initialItem={{
          id: "a1",
          name: "Relic",
          type: "Cybernetic",
          description: "An old relic.",
          rules: "Cannot be repaired.",
        }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("An old relic.", "Cannot be repaired.");
    expect(screen.queryByText(/Special Rules/)).not.toBeInTheDocument();
  });

  it("Consumable", () => {
    render(
      <CustomConsumableForm
        initialItem={{
          id: "c1",
          name: "Stim",
          quantity: 1,
          description: "A vial.",
          rules: "Heals.",
        }}
        onAdd={noop}
        onCancel={noop}
      />
    );
    expectBoxes("A vial.", "Heals.");
  });
});
