import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CharacteristicsTab } from "../../src/pages/CharacterSheet/CharacteristicsTab";
import { CorruptionMalignancyPicker } from "../../src/mechanics/corruption/CorruptionMalignancyPicker";
import { MutationRow } from "../../src/mechanics/corruption/MutationRow";
import { getCharacteristicModifierTotals } from "../../src/mechanics/corruption/characteristicModifierTotals";
import { CHARACTERISTIC_BONUS_DIVISOR } from "../../src/constants/gameRules";
import type {
  Characteristics,
  CorruptionBlock,
  CorruptionMalignancyEntry,
} from "../../src/types/Character";

function Wiring() {
  const [corruption, setCorruption] = useState<CorruptionBlock>({ points: 0, malignancies: [] });

  const existingIds = new Set(
    (Array.isArray(corruption.malignancies) ? corruption.malignancies : [])
      .map((m) => m.referenceId)
      .filter((id): id is string => Boolean(id))
  );

  // Recomputed each render from current `corruption` state, mirroring the real
  // useCharacterHelpers.getEffectiveCharTotal/getCharBonus formulas.
  const modifierTotals = getCharacteristicModifierTotals(corruption);
  const getEffectiveCharTotal = (k: keyof Characteristics) =>
    Math.max(1, 0 + (modifierTotals[k] ?? 0));
  const getCharBonus = (k: keyof Characteristics) =>
    Math.floor(getEffectiveCharTotal(k) / CHARACTERISTIC_BONUS_DIVISOR);

  return (
    <>
      <CorruptionMalignancyPicker
        existingReferenceIds={existingIds}
        onAdd={(entry: CorruptionMalignancyEntry) =>
          setCorruption((prev) => ({
            ...prev,
            malignancies: [...(Array.isArray(prev.malignancies) ? prev.malignancies : []), entry],
          }))
        }
        onClose={() => {}}
      />
      <CharacteristicsTab
        getCharField={() => ({ base: 0, advances: 0 })}
        getEffectiveCharTotal={getEffectiveCharTotal}
        getCharBonus={getCharBonus}
        editable={false}
        corruption={corruption}
        updateCharacteristic={() => {}}
      />
    </>
  );
}

describe("characteristic modifier wiring", () => {
  it("shows a rolled value entered in the picker as an adjustment on the Characteristics tab", async () => {
    const user = userEvent.setup();
    render(<Wiring />);

    await user.click(screen.getByText("Palsy", { selector: "span" }));
    await user.type(screen.getByRole("spinbutton"), "6");
    await user.click(screen.getByRole("button", { name: "Add Malignancy" }));

    const card = screen.getByText("Agility (Ag)").closest("div")!;
    expect(within(card).getByText("1")).toBeInTheDocument();
    expect(within(card).getByText("(-6)")).toBeInTheDocument();
  });
});

function EditRollsWiring() {
  const [corruption, setCorruption] = useState<CorruptionBlock>({
    points: 0,
    malignancies: [],
    minorMutations: [{ id: "m1", referenceId: "misshapen", name: "Misshapen" }],
  });

  const modifierTotals = getCharacteristicModifierTotals(corruption);
  const getEffectiveCharTotal = (k: keyof Characteristics) =>
    Math.max(1, 0 + (modifierTotals[k] ?? 0));
  const getCharBonus = (k: keyof Characteristics) =>
    Math.floor(getEffectiveCharTotal(k) / CHARACTERISTIC_BONUS_DIVISOR);

  return (
    <>
      <MutationRow
        mutation={corruption.minorMutations![0]}
        editable
        onRemove={() => {}}
        onUpdateRolls={(rolledModifiers) =>
          setCorruption((prev) => ({
            ...prev,
            minorMutations: prev.minorMutations!.map((m) =>
              m.id === "m1" ? { ...m, rolledModifiers } : m
            ),
          }))
        }
      />
      <CharacteristicsTab
        getCharField={() => ({ base: 0, advances: 0 })}
        getEffectiveCharTotal={getEffectiveCharTotal}
        getCharBonus={getCharBonus}
        editable={false}
        corruption={corruption}
        updateCharacteristic={() => {}}
      />
    </>
  );
}

describe("Edit Rolls wiring", () => {
  it("updates the Characteristics tab after backfilling a missing roll via Edit Rolls", async () => {
    const user = userEvent.setup();
    render(<EditRollsWiring />);

    const agilityCard = screen.getByText("Agility (Ag)").closest("div")!;
    expect(agilityCard.querySelector(".text-emerald-400, .text-red-400")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Rolls" }));
    await user.type(screen.getByRole("spinbutton"), "7");
    await user.click(screen.getByRole("button", { name: "Save Rolls" }));

    expect(within(agilityCard).getByText("1")).toBeInTheDocument();
    expect(within(agilityCard).getByText("(-7)")).toBeInTheDocument();
  });
});
