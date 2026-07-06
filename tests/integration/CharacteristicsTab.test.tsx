// tests/integration/CharacteristicsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CharacteristicsTab } from "../../src/pages/characterSheet/CharacteristicsTab";
import { getCharacteristicModifierTotals } from "../../src/features/corruption/characteristicModifierTotals";
import { CHARACTERISTIC_BONUS_DIVISOR } from "../../src/constants/gameRules";
import type { CharField } from "../../src/utils/characterFactory";
import type { Characteristics, CorruptionBlock } from "../../src/types/Character";

// Totals chosen so every derived value is unique and verifiable.
// ag=55 → AB=5 → Half=5, Full=10, Charge=15, Run=30
// fel=99 → FB=9  int=66 → IB=6
const TOTALS: Record<keyof Characteristics, number> = {
  ws: 11, bs: 22, s: 33, t: 44, ag: 55, int: 66, per: 77, wp: 88, fel: 99,
};

const BLANK_FIELD: CharField = { base: 0, advances: 0 };

function getCharField(_key: keyof Characteristics): CharField {
  return BLANK_FIELD;
}

// Mirrors the real useCharacterHelpers.getEffectiveCharTotal/getCharBonus formulas,
// so tests exercise the same adjustment math production code uses, driven by `corruption`.
function renderTab(
  getCharTotal = vi.fn((k: keyof Characteristics) => TOTALS[k]),
  corruption: CorruptionBlock = { points: 0, malignancies: [] }
) {
  const modifierTotals = getCharacteristicModifierTotals(corruption);
  const getEffectiveCharTotal = vi.fn((k: keyof Characteristics) =>
    Math.max(1, getCharTotal(k) + (modifierTotals[k] ?? 0))
  );
  const getCharBonus = vi.fn((k: keyof Characteristics) =>
    Math.floor(getEffectiveCharTotal(k) / CHARACTERISTIC_BONUS_DIVISOR)
  );

  return render(
    <CharacteristicsTab
      getCharField={getCharField}
      getEffectiveCharTotal={getEffectiveCharTotal}
      getCharBonus={getCharBonus}
      editable={false}
      corruption={corruption}
      updateCharacteristic={() => {}}
    />
  );
}

describe("CharacteristicsTab", () => {
  it("renders all nine characteristic labels", () => {
    renderTab();

    const labels = ["WS", "BS", "S", "T", "Ag", "Int", "Per", "WP", "Fel"];
    for (const label of labels) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("uses the passed-in getEffectiveCharTotal/getCharBonus for each characteristic — not a local reimplementation", () => {
    const effectiveSpy = vi.fn((k: keyof Characteristics) => TOTALS[k]);
    const bonusSpy = vi.fn((k: keyof Characteristics) => Math.floor(TOTALS[k] / CHARACTERISTIC_BONUS_DIVISOR));
    render(
      <CharacteristicsTab
        getCharField={getCharField}
        getEffectiveCharTotal={effectiveSpy}
        getCharBonus={bonusSpy}
        editable={false}
        corruption={{ points: 0, malignancies: [] }}
        updateCharacteristic={() => {}}
      />
    );

    const allKeys: (keyof Characteristics)[] = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"];
    for (const key of allKeys) {
      expect(effectiveSpy).toHaveBeenCalledWith(key);
    }
    const bonusKeys: (keyof Characteristics)[] = ["s", "t", "ag", "int", "per", "wp", "fel"];
    for (const key of bonusKeys) {
      expect(bonusSpy).toHaveBeenCalledWith(key);
    }
  });

  it("derives movement values from the agility bonus (ag=55 → AB=5)", () => {
    renderTab();

    // Half = AB = 5 (also used as AB badge), Full = 10, Charge = 15, Run = 30
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("shows all characteristic bonus labels", () => {
    renderTab();

    for (const label of ["SB", "TB", "AB", "IB", "PB", "WPB", "FB"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("derives bonus values correctly from stat totals", () => {
    renderTab();

    // FB = floor(99 / 10) = 9
    expect(screen.getByText("9")).toBeInTheDocument();
    // IB = floor(66 / 10) = 6
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("shows a positive adjustment badge next to the effective total (Brute: +10 Strength)", () => {
    renderTab(undefined, {
      points: 0,
      malignancies: [],
      minorMutations: [{ id: "m1", referenceId: "brute", name: "Brute" }],
    });

    const card = screen.getByText("Strength (S)").closest("div")!;
    expect(within(card).getByText("10")).toBeInTheDocument();
    expect(within(card).getByText("(+10)")).toBeInTheDocument();
  });

  it("shows a negative adjustment badge next to the effective total (Palsy: -1d10 Agility, rolled a 6)", () => {
    renderTab(undefined, {
      points: 0,
      malignancies: [{ id: "m1", referenceId: "palsy", name: "Palsy", rolledModifiers: { ag: 6 } }],
    });

    const card = screen.getByText("Agility (Ag)").closest("div")!;
    expect(within(card).getByText("1")).toBeInTheDocument();
    expect(within(card).getByText("(-6)")).toBeInTheDocument();
  });

  it("shows no adjustment badge when a characteristic has no active modifier", () => {
    renderTab();

    const card = screen.getAllByText("Weapon Skill (WS)")[0].closest("div")!;
    expect(card.querySelector(".text-emerald-400, .text-red-400")).not.toBeInTheDocument();
  });

  it("shows independent adjustments for multiple characteristics at once (Brute: +10 S, +10 T, -10 Ag)", () => {
    renderTab(undefined, {
      points: 0,
      malignancies: [],
      minorMutations: [{ id: "m1", referenceId: "brute", name: "Brute" }],
    });

    const strengthCard = screen.getByText("Strength (S)").closest("div")!;
    expect(within(strengthCard).getByText("10")).toBeInTheDocument();
    expect(within(strengthCard).getByText("(+10)")).toBeInTheDocument();

    const toughnessCard = screen.getByText("Toughness (T)").closest("div")!;
    expect(within(toughnessCard).getByText("10")).toBeInTheDocument();
    expect(within(toughnessCard).getByText("(+10)")).toBeInTheDocument();

    const agilityCard = screen.getByText("Agility (Ag)").closest("div")!;
    expect(within(agilityCard).getByText("1")).toBeInTheDocument();
    expect(within(agilityCard).getByText("(-10)")).toBeInTheDocument();

    const willpowerCard = screen.getByText("Willpower (WP)").closest("div")!;
    expect(willpowerCard.querySelector(".text-emerald-400, .text-red-400")).not.toBeInTheDocument();
  });
});

describe("CharacteristicsTab adjustment source breakdown", () => {
  it("shows each contributing source with its type when a characteristic has an adjustment", () => {
    renderTab(undefined, {
      points: 0,
      malignancies: [{ id: "m1", referenceId: "palsy", name: "Palsy", rolledModifiers: { ag: 6 } }],
      minorMutations: [{ id: "mm1", referenceId: "misshapen", name: "Misshapen", rolledModifiers: { ag: 3 } }],
    });

    expect(screen.getByText(/Palsy \(Malignancy\): -6/)).toBeInTheDocument();
    expect(screen.getByText(/Misshapen \(Minor Mutation\): -3/)).toBeInTheDocument();
  });

  it("shows no info-modal trigger when a characteristic has no adjustment", () => {
    renderTab();

    const wsCard = screen.getAllByText("Weapon Skill (WS)")[0].closest("div")!;
    expect(within(wsCard).queryByRole("button", { name: /Show information about/ })).not.toBeInTheDocument();
  });
});

describe("CharacteristicsTab mobile peek carousel", () => {
  it("wraps to Fellowship on one side and Ballistic Skill on the other for the default Weapon Skill view", () => {
    renderTab();

    const felPeek = screen.getAllByText("Fellowship (Fel)").find((el) => el.closest('[aria-hidden="true"]'));
    expect(felPeek).toBeInTheDocument();

    const bsPeek = screen.getAllByText("Ballistic Skill (BS)").find((el) => el.closest('[aria-hidden="true"]'));
    expect(bsPeek).toBeInTheDocument();
  });
});
