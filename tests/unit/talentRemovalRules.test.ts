import { describe, expect, it } from "vitest";
import {
  buildTalentRemovalUpdate,
  hasRestorableTalentEffect,
} from "../../src/mechanics/talents/talentRemovalRules";
import type {
  ArcheotechItem,
  CyberneticItem,
  InsanityBlock,
  InsanityDisorderEntry,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  TalentEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";

const EMPTY_PSYCHIC: PsychicBlock = {
  psyRating: 0,
  disciplines: [],
  minorPowers: [],
  majorPowers: [],
};
const EMPTY_INSANITY: InsanityBlock = { points: 0, disorders: [] };

function talent(
  uid: string,
  talentId = uid,
  acquisition?: TalentEntry["acquisition"]
): TalentEntry {
  return { uid, talentId, name: talentId, ...(acquisition ? { acquisition } : {}) };
}

function ranged(id: string, fields: Partial<RangedWeapon> = {}): RangedWeapon {
  return { id, name: id, damage: "1d10", pen: "0", ...fields };
}

function melee(id: string, fields: Partial<MeleeWeapon> = {}): MeleeWeapon {
  return { id, name: id, damage: "1d10", pen: "0", ...fields };
}

interface RemovalOverrides {
  restoreOneTimeEffects?: boolean;
  talents?: TalentEntry[];
  psychic?: PsychicBlock;
  cybernetics?: CyberneticItem[];
  insanity?: InsanityBlock;
  rangedWeapons?: RangedWeapon[];
  meleeWeapons?: MeleeWeapon[];
  archeotech?: ArcheotechItem[];
}

function remove(entry: TalentEntry, overrides: RemovalOverrides = {}) {
  const talentsAndTraits: TalentsAndTraitsBlock = {
    homeworld: "",
    talents: overrides.talents ?? [entry],
    traits: [],
  };
  return buildTalentRemovalUpdate({
    entry,
    restoreOneTimeEffects: overrides.restoreOneTimeEffects ?? false,
    talents: talentsAndTraits,
    psychic: overrides.psychic ?? EMPTY_PSYCHIC,
    cybernetics: overrides.cybernetics ?? [],
    insanity: overrides.insanity ?? EMPTY_INSANITY,
    rangedWeapons: overrides.rangedWeapons ?? [],
    meleeWeapons: overrides.meleeWeapons ?? [],
    archeotech: overrides.archeotech ?? [],
  });
}

describe("hasRestorableTalentEffect", () => {
  it.each([
    {
      label: "Purity cybernetics",
      entry: talent("purity", "purity-of-flesh", {
        purity: {
          removedCyberneticIds: ["bionic"],
          removedCybernetics: [{ id: "bionic", name: "Bionic Arm" }],
          qualifyingBionicsRemoved: 1,
          fatePointsGained: 1,
        },
      }),
    },
    {
      label: "Purity ranged weapons",
      entry: talent("purity", "purity-of-flesh", {
        purity: {
          removedCyberneticIds: [],
          removedIntegratedRangedWeapons: [ranged("ranged")],
          qualifyingBionicsRemoved: 1,
          fatePointsGained: 1,
        },
      }),
    },
    {
      label: "Purity melee weapons",
      entry: talent("purity", "purity-of-flesh", {
        purity: {
          removedCyberneticIds: [],
          removedIntegratedMeleeWeapons: [melee("melee")],
          qualifyingBionicsRemoved: 1,
          fatePointsGained: 1,
        },
      }),
    },
    {
      label: "Purity archeotech",
      entry: talent("purity", "purity-of-flesh", {
        purity: {
          removedCyberneticIds: [],
          removedArcheotech: [{ id: "relic", name: "Relic", type: "Cybernetic" }],
          qualifyingBionicsRemoved: 1,
          fatePointsGained: 1,
        },
      }),
    },
    {
      label: "Rite disorders",
      entry: talent("rite", "rite-of-pure-thought", {
        riteOriginalDisorders: [
          { id: "original", name: "Original", type: "Delusion", severity: "Minor" },
        ],
      }),
    },
  ])("recognises restorable $label records", ({ entry }) => {
    expect(hasRestorableTalentEffect(entry)).toBe(true);
  });

  it("does not offer restoration for ordinary talents or link-only legacy Purity records", () => {
    expect(hasRestorableTalentEffect(talent("ordinary"))).toBe(false);
    expect(
      hasRestorableTalentEffect(
        talent("purity", "purity-of-flesh", {
          purity: {
            removedCyberneticIds: ["missing-snapshot"],
            removedConcealedWeaponLinks: [
              {
                weaponId: "weapon",
                weaponType: "ranged",
                cyberneticId: "bionic",
                craftsmanship: "Common",
              },
            ],
            qualifyingBionicsRemoved: 1,
            fatePointsGained: 1,
          },
        })
      )
    ).toBe(false);
  });
});

describe("buildTalentRemovalUpdate basic and granted effects", () => {
  it("removes only the selected talent from the talent block", () => {
    const target = talent("target");
    const survivor = talent("survivor");

    const result = remove(target, { talents: [target, survivor] });

    expect(result.talentsAndTraits.talents).toEqual([survivor]);
    expect(result).toEqual({
      talentsAndTraits: expect.objectContaining({ talents: [survivor] }),
      cybernetics: [],
    });
  });

  it("removes augmetics granted by the talent and clears both weapon link types", () => {
    const target = talent("target");
    const granted: CyberneticItem = {
      id: "granted",
      name: "Granted Arm",
      grantedByTalentEntryUid: target.uid,
    };
    const retained: CyberneticItem = { id: "retained", name: "Retained Arm" };
    const linkedRanged = ranged("linked-ranged", {
      concealedBionic: { cyberneticId: granted.id, craftsmanship: "Good" },
    });
    const linkedMelee = melee("linked-melee", {
      concealedBionic: { cyberneticId: granted.id, craftsmanship: "Best" },
    });
    const unrelated = ranged("unrelated", {
      concealedBionic: { cyberneticId: retained.id, craftsmanship: "Common" },
    });

    const result = remove(target, {
      cybernetics: [granted, retained],
      rangedWeapons: [linkedRanged, unrelated],
      meleeWeapons: [linkedMelee],
    });

    expect(result.cybernetics).toEqual([retained]);
    expect(result.rangedWeapons).toEqual([
      expect.objectContaining({ id: "linked-ranged", concealedBionic: undefined }),
      unrelated,
    ]);
    expect(result.meleeWeapons).toEqual([
      expect.objectContaining({ id: "linked-melee", concealedBionic: undefined }),
    ]);
  });

  it("removes a newly granted psychic discipline case-insensitively", () => {
    const target = talent("target", "psy-rating-4", {
      psyRatingDiscipline: "Biomancy",
      psyRatingNewDiscipline: true,
    });
    const psychic: PsychicBlock = {
      ...EMPTY_PSYCHIC,
      disciplines: ["Pyromancy", "biomancy"],
    };

    const result = remove(target, { psychic });

    expect(result.psychic?.disciplines).toEqual(["Pyromancy"]);
  });

  it("retains a discipline while another talent still grants it", () => {
    const target = talent("target", "psy-rating-4", {
      psyRatingDiscipline: "Biomancy",
      psyRatingNewDiscipline: true,
    });
    const otherGrant = talent("other", "psy-rating-5", {
      psyRatingDiscipline: "BIOMANCY",
      psyRatingNewDiscipline: true,
    });
    const psychic: PsychicBlock = { ...EMPTY_PSYCHIC, disciplines: ["Biomancy"] };

    const result = remove(target, { talents: [target, otherGrant], psychic });

    expect(result.psychic).toBeUndefined();
  });
});

describe("buildTalentRemovalUpdate Purity restoration", () => {
  const removedCybernetic: CyberneticItem = { id: "bionic", name: "Bionic Arm" };
  const removedRanged = ranged("integrated-ranged", { integrated: true });
  const removedMelee = melee("integrated-melee", { integrated: true });
  const removedArcheotech: ArcheotechItem = {
    id: "ancient-implant",
    name: "Ancient Implant",
    type: "Cybernetic",
  };
  const purity = talent("purity", "purity-of-flesh", {
    purity: {
      removedCyberneticIds: [removedCybernetic.id],
      removedCybernetics: [removedCybernetic],
      removedIntegratedRangedWeapons: [removedRanged],
      removedIntegratedMeleeWeapons: [removedMelee],
      removedArcheotech: [removedArcheotech],
      removedConcealedWeaponLinks: [
        {
          weaponId: removedRanged.id,
          weaponType: "ranged",
          cyberneticId: removedCybernetic.id,
          craftsmanship: "Good",
        },
        {
          weaponId: removedMelee.id,
          weaponType: "melee",
          cyberneticId: removedCybernetic.id,
          craftsmanship: "Best",
        },
      ],
      qualifyingBionicsRemoved: 4,
      fatePointsGained: 2,
    },
  });

  it("does not restore one-time effects when deletion alone is requested", () => {
    const result = remove(purity);

    expect(result.cybernetics).toEqual([]);
    expect(result.rangedWeapons).toBeUndefined();
    expect(result.meleeWeapons).toBeUndefined();
    expect(result.archeotech).toBeUndefined();
  });

  it("restores every recorded inventory source and its concealed links", () => {
    const result = remove(purity, { restoreOneTimeEffects: true });

    expect(result.cybernetics).toEqual([removedCybernetic]);
    expect(result.rangedWeapons).toEqual([
      { ...removedRanged, concealedBionic: { cyberneticId: "bionic", craftsmanship: "Good" } },
    ]);
    expect(result.meleeWeapons).toEqual([
      { ...removedMelee, concealedBionic: { cyberneticId: "bionic", craftsmanship: "Best" } },
    ]);
    expect(result.archeotech).toEqual([removedArcheotech]);
  });

  it("deduplicates restored snapshots and preserves an existing concealed link", () => {
    const currentRanged = {
      ...removedRanged,
      concealedBionic: { cyberneticId: "replacement", craftsmanship: "Common" as const },
    };
    const result = remove(purity, {
      restoreOneTimeEffects: true,
      cybernetics: [removedCybernetic],
      rangedWeapons: [currentRanged],
      meleeWeapons: [removedMelee],
      archeotech: [removedArcheotech],
    });

    expect(result.cybernetics).toEqual([removedCybernetic]);
    expect(result.rangedWeapons).toEqual([currentRanged]);
    expect(result.meleeWeapons).toHaveLength(1);
    expect(result.archeotech).toEqual([removedArcheotech]);
  });
});

describe("buildTalentRemovalUpdate Rite of Pure Thought restoration", () => {
  const original: InsanityDisorderEntry = {
    id: "original",
    name: "Original Disorder",
    type: "Delusion",
    severity: "Severe",
  };
  const replacement: InsanityDisorderEntry = {
    id: "replacement",
    name: "Replacement Disorder",
    type: "Delusion",
    severity: "Severe",
  };
  const unrelated: InsanityDisorderEntry = {
    id: "unrelated",
    name: "Unrelated Disorder",
    type: "Phobia",
    severity: "Minor",
  };
  const rite = talent("rite", "rite-of-pure-thought", {
    riteOriginalDisorders: [original],
    riteReplacementDisorderIds: [replacement.id],
  });

  it("leaves replacements untouched when deletion alone is requested", () => {
    const insanity: InsanityBlock = { points: 20, disorders: [replacement, unrelated] };
    const result = remove(rite, { insanity });

    expect(result.insanity).toBeUndefined();
  });

  it("removes recorded replacements and restores the original disorders", () => {
    const insanity: InsanityBlock = { points: 20, disorders: [replacement, unrelated] };
    const result = remove(rite, { insanity, restoreOneTimeEffects: true });

    expect(result.insanity?.disorders).toEqual([unrelated, original]);
  });

  it("restores originals safely when the current disorder data is legacy text", () => {
    const insanity: InsanityBlock = { points: 20, disorders: "Legacy disorder notes" };
    const result = remove(rite, { insanity, restoreOneTimeEffects: true });

    expect(result.insanity?.disorders).toEqual([original]);
  });
});
