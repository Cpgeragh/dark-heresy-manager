import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { SkillsTab } from "../../src/pages/CharacterSheet/SkillsTab";
import { WeaponTrainingTab } from "../../src/pages/CharacterSheet/WeaponTrainingTab";
import type { Characteristics, CharField, WeaponTrainingBlock } from "../../src/types/Character";

const alternateRanks = [
  {
    alternateRankId: "black-priest-of-maccabeus",
    replacedRankId: "preacher",
    takenAtTier: 4,
  },
] as const;

const getCharField = (_key: keyof Characteristics): CharField => ({
  base: 30,
  advances: 0,
});

describe("Alternate Rank replacement", () => {
  it("uses the selected Alternate Rank Skill table instead of the replaced normal table", async () => {
    const user = userEvent.setup();
    render(
      <SkillsTab
        skills={[]}
        editable
        onUpdate={vi.fn()}
        getCharField={getCharField}
        corruption={{ points: 0, malignancies: [] }}
        career="Cleric"
        rank="Preacher"
        alternateRanks={alternateRanks}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Add basic skill" })[0]);
    let picker = within(screen.getByRole("dialog", { name: "Available Untrained Basic Skills" }));
    expect(picker.queryByText("Disguise")).not.toBeInTheDocument();
    await user.click(picker.getByRole("button", { name: "Close" }));

    await user.click(screen.getAllByRole("button", { name: "Add advanced skill" })[0]);
    picker = within(screen.getByRole("dialog", { name: "Available Untrained Advanced Skills" }));
    await user.click(picker.getByText("Forbidden Lore"));

    const forbiddenLore = within(screen.getByRole("dialog", { name: "Forbidden Lore" }));
    const daemonology = forbiddenLore.getByText("Forbidden Lore (Daemonology)").closest("button");
    expect(daemonology).toBeInTheDocument();
    expect(within(daemonology!).getByText("100 XP")).toBeInTheDocument();
  });

  it("uses Weapon Training from the selected Alternate Rank table", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <WeaponTrainingTab
        weaponTraining={{ trained: [], exoticWeapons: [] }}
        editable
        onUpdate={onUpdate}
        career="Cleric"
        rank="Preacher"
        alternateRanks={alternateRanks}
      />
    );

    await user.click(screen.getByRole("button", { name: "Power, 200 XP" }));
    expect(
      screen.getByText(/Train Melee Weapon Training \(Power\) for 200 XP\?/)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Train" }));

    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.xpPurchases?.["melee-power"]).toEqual({
      cost: 200,
      careerId: "cleric",
      sourceRankId: "preacher",
    });
  });
});
