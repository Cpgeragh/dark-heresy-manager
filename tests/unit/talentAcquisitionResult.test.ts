import { describe, expect, it } from "vitest";
import type {
  ArcheotechItem,
  CyberneticItem,
  InsanityBlock,
  InsanityDisorderEntry,
  MeleeWeapon,
  RangedWeapon,
  TalentEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";
import {
  buildTalentAcquisitionResult,
  type TalentAcquisitionChoices,
} from "../../src/mechanics/talents/talentAcquisitionResult";

type AcquisitionArgs = Parameters<typeof buildTalentAcquisitionResult>[0];
type AcquisitionOverrides = Partial<Omit<AcquisitionArgs, "entry" | "choices" | "createId">> & {
  choices?: Partial<TalentAcquisitionChoices>;
  ids?: string[];
};

const EMPTY_TALENTS: TalentsAndTraitsBlock = {
  homeworld: "",
  talents: [],
  traits: [],
};
const EMPTY_INSANITY: InsanityBlock = { points: 0, disorders: [] };
const EMPTY_CHOICES: TalentAcquisitionChoices = {
  primaryChoice: "",
  secondaryChoice: "",
  toughnessLoss: 1,
  replacement: "",
  concealedWeaponChoice: "",
  removedDisorderIds: [],
  replacementDisorders: {},
  fatalRemovalKeys: [],
  fatalReplacements: {},
};

function talent(talentId: string, specialisation?: string): TalentEntry {
  return {
    uid: `${talentId}-uid`,
    talentId,
    name: specialisation ? `${talentId} (${specialisation})` : talentId,
    ...(specialisation ? { specialisation } : {}),
  };
}

function ranged(id: string, fields: Partial<RangedWeapon> = {}): RangedWeapon {
  return { id, name: id, damage: "1d10", pen: "0", ...fields };
}

function melee(id: string, fields: Partial<MeleeWeapon> = {}): MeleeWeapon {
  return { id, name: id, damage: "1d10", pen: "0", ...fields };
}

function acquire(entry: TalentEntry, overrides: AcquisitionOverrides = {}) {
  const ids = [...(overrides.ids ?? [])];
  const { choices, ids: _ids, ...inputOverrides } = overrides;
  return buildTalentAcquisitionResult({
    entry,
    talents: EMPTY_TALENTS,
    cybernetics: [],
    rangedWeapons: [],
    meleeWeapons: [],
    archeotech: [],
    insanity: EMPTY_INSANITY,
    willpowerBonus: 5,
    ...inputOverrides,
    choices: { ...EMPTY_CHOICES, ...choices },
    createId: () => {
      const id = ids.shift();
      if (!id) throw new Error("Test did not provide enough deterministic IDs.");
      return id;
    },
  });
}

describe("buildTalentAcquisitionResult basic branches", () => {
  it("returns an ordinary acquisition unchanged", () => {
    const entry = talent("ambidextrous");
    expect(acquire(entry)).toEqual({ entry });
  });

  it("records Cult Briefing Pleasure, Blood, and Culture choices", () => {
    expect(
      acquire(talent("cult-briefing", "Pleasure"), {
        choices: { primaryChoice: "chem-geld" },
      }).entry.acquisition
    ).toEqual({ grantedTalentId: "chem-geld", grantedTalentName: "Chem Geld" });

    expect(
      acquire(talent("cult-briefing", "Blood"), {
        choices: { primaryChoice: "melee-chain" },
      }).entry.acquisition
    ).toEqual({ weaponTrainingId: "melee-chain" });

    expect(
      acquire(talent("cult-briefing", "Culture"), {
        choices: {
          primaryChoice: "noble-born",
          homeworldTraitChoices: { peerGroup: "Administratum" },
        },
      }).entry.acquisition
    ).toEqual({
      homeworldId: "noble-born",
      homeworldTraitChoices: { peerGroup: "Administratum" },
    });
  });

  it("records both Sicarius Tutoring branches", () => {
    expect(
      acquire(talent("sicarius-tutoring", "Guardsman"), {
        choices: { primaryChoice: "  Needle Rifle  " },
      }).entry.acquisition
    ).toEqual({ exoticWeapon: "Needle Rifle" });

    expect(
      acquire(talent("sicarius-tutoring", "Scum"), {
        choices: { primaryChoice: "Underworld" },
      }).entry.acquisition
    ).toEqual({
      grantedTalentId: "peer",
      grantedTalentName: "Peer",
      grantedTalentSpecialisation: "Underworld",
    });
  });

  it("rounds Touched by the Fates up from half the Willpower Bonus", () => {
    expect(
      acquire(talent("touched-by-the-fates"), { willpowerBonus: 5 }).entry.acquisition
    ).toEqual({ touchedByFatesPoints: 3 });
  });
});

describe("buildTalentAcquisitionResult Cult Briefing Heretek", () => {
  it("creates a located augmetic and records its granted talent", () => {
    const entry = talent("cult-briefing", "Heretek");
    const result = acquire(entry, {
      choices: {
        primaryChoice: "cr-bionic-arm",
        secondaryChoice: "logis-implant",
        replacement: "rightArm",
      },
      ids: ["augmetic-id"],
    });

    expect(result.entry.acquisition).toEqual({
      grantedTalentId: "logis-implant",
      grantedTalentName: "Logis Implant",
      augmeticName: "Bionic Arm",
      augmeticReferenceId: "cr-bionic-arm",
    });
    expect(result.cybernetics).toEqual([
      expect.objectContaining({
        id: "augmetic-id",
        referenceId: "cr-bionic-arm",
        bodyLocation: ["rightArm"],
        grantedByTalentEntryUid: entry.uid,
        grantedByType: "Talent",
      }),
    ]);
  });

  it.each([
    { weaponType: "ranged" as const, weaponId: "pistol", field: "rangedWeapons" as const },
    { weaponType: "melee" as const, weaponId: "knife", field: "meleeWeapons" as const },
  ])(
    "links a concealed $weaponType weapon to the created augmetic",
    ({ weaponType, weaponId, field }) => {
      const result = acquire(talent("cult-briefing", "Heretek"), {
        rangedWeapons: [ranged("pistol", { class: "Pistol" })],
        meleeWeapons: [melee("knife")],
        choices: {
          primaryChoice: "ih-concealed-weapon-bionic",
          secondaryChoice: "autosanguine",
          replacement: "existing-arm",
          concealedWeaponChoice: `${weaponType}:${weaponId}`,
        },
        ids: ["concealed-augmetic"],
      });

      expect(result.cybernetics?.[0]).toMatchObject({
        id: "concealed-augmetic",
        concealedWeapon: {
          armId: "existing-arm",
          weaponId,
          weaponType,
        },
      });
      expect(result[field]?.find((weapon) => weapon.id === weaponId)).toMatchObject({
        concealedBionic: {
          cyberneticId: "concealed-augmetic",
          craftsmanship: "Common",
        },
      });
    }
  );
});

describe("buildTalentAcquisitionResult Purity of Flesh", () => {
  const bionic: CyberneticItem = { id: "bionic", name: "Bionic Arm" };
  const mechadendrite: CyberneticItem = {
    id: "mechadendrite",
    name: "Manipulator Mechadendrite",
    referenceId: "cr-manipulator-mechadendrite",
  };
  const concealedRanged = ranged("concealed-ranged", {
    concealedBionic: { cyberneticId: "bionic", craftsmanship: "Common" },
  });
  const concealedMelee = melee("concealed-melee", {
    concealedBionic: { cyberneticId: "bionic", craftsmanship: "Good" },
  });
  const integratedRanged = ranged("integrated-ranged", { integrated: true });
  const integratedMelee = melee("integrated-melee", { integrated: true });
  const ordinaryArcheotech: ArcheotechItem = {
    id: "device",
    name: "Ancient Device",
    type: "Device",
  };
  const purityArcheotech: ArcheotechItem = {
    id: "archeotech-implant",
    name: "Ancient Implant",
    type: "Cybernetic",
  };

  it("records and removes every affected inventory source and concealed link", () => {
    const result = acquire(talent("purity-of-flesh"), {
      cybernetics: [bionic, mechadendrite],
      rangedWeapons: [concealedRanged, integratedRanged],
      meleeWeapons: [concealedMelee, integratedMelee],
      archeotech: [ordinaryArcheotech, purityArcheotech],
    });

    expect(result.entry.acquisition?.purity).toMatchObject({
      removedCyberneticIds: ["bionic", "mechadendrite"],
      qualifyingBionicsRemoved: 4,
      fatePointsGained: 2,
      removedIntegratedRangedWeapons: [integratedRanged],
      removedIntegratedMeleeWeapons: [integratedMelee],
      removedArcheotech: [purityArcheotech],
      removedConcealedWeaponLinks: expect.arrayContaining([
        expect.objectContaining({ weaponId: "concealed-ranged", weaponType: "ranged" }),
        expect.objectContaining({ weaponId: "concealed-melee", weaponType: "melee" }),
      ]),
    });
    expect(result.cybernetics).toEqual([]);
    expect(result.rangedWeapons).toEqual([
      expect.objectContaining({ id: "concealed-ranged", concealedBionic: undefined }),
    ]);
    expect(result.meleeWeapons).toEqual([
      expect.objectContaining({ id: "concealed-melee", concealedBionic: undefined }),
    ]);
    expect(result.archeotech).toEqual([ordinaryArcheotech]);
    expect(result.additionalTalentEntries).toBeUndefined();
  });

  it("creates one deterministic Reformed Skin record per fatal removal", () => {
    const result = acquire(talent("purity-of-flesh"), {
      cybernetics: [bionic],
      rangedWeapons: [integratedRanged],
      choices: {
        toughnessLoss: 4,
        fatalRemovalKeys: ["cybernetic:bionic", "ranged:integrated-ranged"],
        fatalReplacements: {
          "cybernetic:bionic": "Steel Lungs",
          "ranged:integrated-ranged": "Synthetic Heart",
        },
      },
      ids: ["skin-one", "skin-two"],
    });

    expect(result.entry.acquisition?.purity).toMatchObject({ toughnessLoss: 4, woundsLoss: 1 });
    expect(result.additionalTalentEntries).toEqual([
      expect.objectContaining({
        uid: "skin-one",
        talentId: "reformed-skin",
        specialisation: "Steel Lungs",
        acquisition: {
          reformedSkinPurityReplacement: true,
          purityTalentEntryUid: "purity-of-flesh-uid",
        },
      }),
      expect.objectContaining({
        uid: "skin-two",
        specialisation: "Synthetic Heart",
      }),
    ]);
  });
});

describe("buildTalentAcquisitionResult Reformed Skin and Rite of Pure Thought", () => {
  it("records both Reformed Skin causes", () => {
    const purity: TalentEntry = {
      ...talent("purity-of-flesh"),
      uid: "purity-source",
      acquisition: {
        purity: {
          removedCyberneticIds: [],
          qualifyingBionicsRemoved: 2,
          fatePointsGained: 1,
        },
      },
    };

    expect(
      acquire(talent("reformed-skin"), {
        talents: { ...EMPTY_TALENTS, talents: [purity] },
        choices: { primaryChoice: "purity" },
      }).entry.acquisition
    ).toMatchObject({ reformedSkinPurityReplacement: true, purityTalentEntryUid: "purity-source" });
    expect(
      acquire(talent("reformed-skin"), {
        choices: { primaryChoice: "critical" },
      }).entry.acquisition
    ).toEqual({ reformedSkinPurityReplacement: false });
  });

  it("replaces selected disorders with deterministic custom records and preserves originals", () => {
    const disorders: InsanityDisorderEntry[] = [
      { id: "keep", name: "Keep", type: "Phobia", severity: "Minor" },
      { id: "replace", name: "Old Disorder", type: "Delusion", severity: "Severe" },
    ];
    const insanity: InsanityBlock = {
      points: 30,
      disorders,
    };
    const result = acquire(talent("rite-of-pure-thought"), {
      insanity,
      choices: {
        removedDisorderIds: ["replace"],
        replacementDisorders: { replace: "  New Disorder  " },
      },
      ids: ["replacement-id"],
    });

    expect(result.insanity?.disorders).toEqual([
      disorders[0],
      expect.objectContaining({
        id: "replacement-id",
        referenceId: undefined,
        name: "New Disorder",
        custom: true,
      }),
    ]);
    expect(result.entry.acquisition).toMatchObject({
      riteOfPureThoughtReviewed: true,
      riteOriginalDisorders: [disorders[1]],
      riteReplacementDisorderIds: ["replacement-id"],
    });
  });

  it("records a completed Rite review when legacy disorder data has no replacements", () => {
    const result = acquire(talent("rite-of-pure-thought"), {
      insanity: { points: 10, disorders: "Legacy notes" },
    });

    expect(result.insanity).toEqual({ points: 10, disorders: [] });
    expect(result.entry.acquisition).toEqual({
      riteOfPureThoughtReviewed: true,
      riteOriginalDisorders: [],
      riteReplacementDisorderIds: [],
    });
  });
});

describe("buildTalentAcquisitionResult Psy Rating", () => {
  it.each([
    { rating: 3, route: "known", minor: 3, major: 1, isNew: true },
    { rating: 3, route: "new", minor: 3, major: 1, isNew: true },
    { rating: 4, route: "known", minor: 3, major: 3, isNew: false },
    { rating: 4, route: "new", minor: 0, major: 1, isNew: true },
    { rating: 5, route: "known", minor: 0, major: 3, isNew: false },
    { rating: 5, route: "new", minor: 0, major: 1, isNew: true },
    { rating: 6, route: "known", minor: 3, major: 3, isNew: false },
    { rating: 6, route: "new", minor: 0, major: 1, isNew: true },
  ])("records Psy Rating $rating $route grants", ({ rating, route, minor, major, isNew }) => {
    const result = acquire(talent(`psy-rating-${rating}`), {
      choices: { primaryChoice: "Biomancy", secondaryChoice: route },
    });

    expect(result.entry.acquisition).toMatchObject({
      psyRatingWillpowerBonus: 5,
      psyRatingMinorPowerGrants: minor,
      psyRatingMajorPowerGrants: major,
      psyRatingDiscipline: "Biomancy",
      psyRatingNewDiscipline: isNew,
    });
  });
});
