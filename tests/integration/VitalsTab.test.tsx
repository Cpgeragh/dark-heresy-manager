import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { VitalsTab } from "../../src/pages/characterSheet/VitalsTab";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character, WoundsBlock, FateBlock } from "../../src/types/Character";

function makeCharacter(overrides: Partial<{ wounds: WoundsBlock; fate: FateBlock }> = {}): Character {
  return {
    id: "char-1",
    ...createEmptyCharacterData({ campaignId: "c1", recoveryCode: "DH-TEST-0001" }),
    wounds: { total: 20, current: 10, criticalDamage: 0, fatigue: 0 },
    fate: { total: 3, current: 2 },
    ...overrides,
  };
}

function renderTab(overrides: Partial<{ wounds: WoundsBlock; fate: FateBlock }> = {}, toughnessBonus = 4) {
  const onUpdateWounds = vi.fn();
  const onUpdateFate = vi.fn();
  render(
    <VitalsTab
      character={makeCharacter(overrides)}
      editable
      toughnessBonus={toughnessBonus}
      onUpdateWounds={onUpdateWounds}
      onUpdateFate={onUpdateFate}
    />
  );
  return { onUpdateWounds, onUpdateFate };
}

describe("VitalsTab", () => {
  it("caps Current Wounds at Total Wounds", async () => {
    const user = userEvent.setup();
    const { onUpdateWounds } = renderTab({ wounds: { total: 10, current: 10, criticalDamage: 0, fatigue: 0 } });

    const woundsSection = screen.getByText("Current Wounds").parentElement!;
    await user.click(within(woundsSection).getByRole("button", { name: "Increase" }));

    expect(onUpdateWounds).toHaveBeenCalledWith(expect.objectContaining({ current: 10 }));
  });

  it("caps Current Fate at Total Fate", async () => {
    const user = userEvent.setup();
    const { onUpdateFate } = renderTab({ fate: { total: 3, current: 3 } });

    const fateSection = screen.getByText("Current").parentElement!;
    await user.click(within(fateSection).getByRole("button", { name: "Increase" }));

    expect(onUpdateFate).toHaveBeenCalledWith(expect.objectContaining({ current: 3 }));
  });

  it("shows an Unconscious label once Fatigue exceeds Toughness Bonus", () => {
    renderTab({ wounds: { total: 20, current: 10, criticalDamage: 0, fatigue: 5 } }, 4);
    expect(screen.getByText("Unconscious")).toBeInTheDocument();
  });

  it("shows no Unconscious label when Fatigue is within Toughness Bonus", () => {
    renderTab({ wounds: { total: 20, current: 10, criticalDamage: 0, fatigue: 4 } }, 4);
    expect(screen.queryByText("Unconscious")).not.toBeInTheDocument();
  });

  it("shows the Critical Damage, Fatigue, and Fate Points rule info modals", () => {
    renderTab();
    expect(screen.getByRole("button", { name: "Show information about Critical Damage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show information about Fatigue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show information about Using Fate Points" })).toBeInTheDocument();
  });
});
