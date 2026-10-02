import { describe, expect, it } from "vitest";
import {
  applyAlternateRankEliteAdvanceGrants,
  applyAlternateRankGearGrants,
  applyAlternateRankMeleeWeaponGrant,
} from "../../src/mechanics/experience/alternateRankGrants";
import type { GearItem, MeleeWeapon, TalentsAndTraitsBlock } from "../../src/types/Character";

describe("applyAlternateRankGearGrants", () => {
  it("adds the Legature and Sigil of Question with Alternate Rank provenance", () => {
    const existing: GearItem = { id: "existing", name: "Chrono", source: "CR" };
    const result = applyAlternateRankGearGrants([existing], "legate-investigator");

    expect(result).toEqual([
      existing,
      expect.objectContaining({
        id: "alternate-rank:legate-investigator:gear:legature",
        referenceId: "ih-legature",
        name: "Legature",
        source: "IH",
        grantedByTalentEntryUid: "alternate-rank:legate-investigator",
        grantedByTalentName: "Legate Investigator",
        grantedByType: "Alternate Rank",
      }),
      expect.objectContaining({
        id: "alternate-rank:legate-investigator:gear:sigil-of-question",
        referenceId: "ih-sigil-of-question",
        name: "Sigil of Question",
        source: "IH",
        grantedByTalentEntryUid: "alternate-rank:legate-investigator",
        grantedByTalentName: "Legate Investigator",
        grantedByType: "Alternate Rank",
      }),
    ]);
  });

  it("replaces existing grants from the same Alternate Rank without duplicating them", () => {
    const result = applyAlternateRankGearGrants(
      [
        {
          id: "old",
          name: "Old Legature",
          grantedByTalentEntryUid: "alternate-rank:legate-investigator",
        },
      ],
      "legate-investigator"
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.name)).toEqual(["Legature", "Sigil of Question"]);
  });

  it("does not change Gear for an Alternate Rank without grants", () => {
    const gear: GearItem[] = [{ id: "existing", name: "Chrono" }];
    expect(applyAlternateRankGearGrants(gear, "feral-warrior")).toBe(gear);
  });
});

describe("applyAlternateRankMeleeWeaponGrant", () => {
  it("adds the selected Templar Calix force weapon from the reference catalogue", () => {
    const existing: MeleeWeapon = { id: "knife", name: "Knife" };
    const result = applyAlternateRankMeleeWeaponGrant(
      [existing],
      "templar-calix",
      "force-weapon",
      "ih-force-staff"
    );

    expect(result).toEqual([
      existing,
      expect.objectContaining({
        id: "alternate-rank:templar-calix:melee-weapon:force-weapon",
        referenceId: "ih-force-staff",
        name: "Force Staff",
        craftsmanship: "Common",
      }),
    ]);
  });

  it("rejects a weapon outside the Templar Calix choice", () => {
    const weapons: MeleeWeapon[] = [{ id: "knife", name: "Knife" }];
    expect(
      applyAlternateRankMeleeWeaponGrant(weapons, "templar-calix", "force-weapon", "cr-knife")
    ).toBe(weapons);
  });
});

describe("applyAlternateRankEliteAdvanceGrants", () => {
  const talents: TalentsAndTraitsBlock = { homeworld: "", talents: [], traits: [] };

  it("adds the Bloodsworn Charter as an automatic Malfian Bloodsworn grant", () => {
    expect(applyAlternateRankEliteAdvanceGrants(talents, "malfian-bloodsworn")).toEqual({
      ...talents,
      eliteAdvances: [
        {
          uid: "alternate-rank:malfian-bloodsworn:elite-advance:bloodsworn-charter",
          eliteAdvanceId: "bloodsworn-charter",
          name: "Bloodsworn Charter",
          grantedByAlternateRankId: "malfian-bloodsworn",
          grantedByAlternateRankName: "Malfian Bloodsworn",
        },
      ],
    });
  });

  it("does not change Elite Advances for an Alternate Rank without grants", () => {
    expect(applyAlternateRankEliteAdvanceGrants(talents, "feral-warrior")).toBe(talents);
  });
});
