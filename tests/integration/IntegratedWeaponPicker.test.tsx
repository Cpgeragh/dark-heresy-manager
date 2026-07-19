// tests/integration/IntegratedWeaponPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { IntegratedWeaponPicker } from "../../src/pages/characterSheet/weapons/IntegratedWeaponPicker";
import { INTEGRATED_RANGED_REFS, INTEGRATED_MELEE_REFS } from "../../src/utils/weaponUtils";

// Real weapons with a description have their own Rules InfoModal titled with
// the bare item name, always mounted (closed) into the DOM — filter for
// whichever match has a role="button" row as an ancestor.
function row(name: string): HTMLElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest("button"))
    .find((el): el is HTMLElement => el !== null);
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match;
}

function renderPicker() {
  const onSelectRanged = vi.fn();
  const onSelectMelee = vi.fn();
  const onClose = vi.fn();
  render(
    <IntegratedWeaponPicker
      onSelectRanged={onSelectRanged}
      onSelectMelee={onSelectMelee}
      onClose={onClose}
    />
  );
  return { onSelectRanged, onSelectMelee, onClose };
}

describe("IntegratedWeaponPicker craftsmanship description", () => {
  it("shows the ranged-specific description for an integrated ranged weapon", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(row(INTEGRATED_RANGED_REFS[0].name));
    expect(
      screen.getByText(/ranged weapon has the Unreliable quality|ranged weapons are more reliable|never suffer from jamming|no additional modifier/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/incur a -10 penalty to Tests made to attack/)).not.toBeInTheDocument();
  });

  it("shows the melee-specific description for an integrated melee weapon", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(row(INTEGRATED_MELEE_REFS[0].name));
    expect(screen.getByText(/Common craftsmanship melee weapons have no additional modifier/)).toBeInTheDocument();
  });

  it("updates the description when a different craftsmanship level is picked", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(row(INTEGRATED_MELEE_REFS[0].name));
    await user.click(screen.getByRole("button", { name: "Best" }));
    expect(
      screen.getByText(/add a \+10 bonus to Tests made to attack and add 1 to the Damage/)
    ).toBeInTheDocument();
  });
});
