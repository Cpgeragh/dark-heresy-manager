// tests/integration/CharacteristicsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CharacteristicsTab } from "../../src/pages/characterSheet/CharacteristicsTab";
import type { CharField } from "../../src/utils/characterFactory";
import type { Characteristics } from "../../src/types/Character";

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

function renderTab(getCharTotal = vi.fn((k: keyof Characteristics) => TOTALS[k])) {
  return render(
    <CharacteristicsTab
      getCharField={getCharField}
      getCharTotal={getCharTotal}
      editable={false}
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

  it("calls getCharTotal for each characteristic — not a local reimplementation", () => {
    const spy = vi.fn((k: keyof Characteristics) => TOTALS[k]);
    renderTab(spy);

    const keys: (keyof Characteristics)[] = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"];
    for (const key of keys) {
      expect(spy).toHaveBeenCalledWith(key);
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
});
