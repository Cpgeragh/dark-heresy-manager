import { describe, expect, it } from "vitest";
import type {
  PsychicBlock,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";
import {
  getActiveTalentEntries,
  getGrantedExoticWeapons,
  getGrantedTalentEntries,
  filterTalentEntriesCoveredByGrants,
  getGrantedTraitEntries,
  getGrantedWeaponTrainingIds,
  getMachineArmourSource,
  getTalentCharacteristicModifierSources,
  getTalentFateEffects,
  getTalentInsanityModifierSources,
  getTalentSkillEffects,
  getTalentWoundModifierSources,
} from "../../src/mechanics/talents/talentEffects";
import {
  getAvailablePsyRatingPowerGrants,
  linkPowerToPsyRatingGrant,
} from "../../src/mechanics/talents/talentUtils";

function entry(
  uid: string,
  talentId: string,
  name: string,
  specialisation?: string,
  acquisition?: TalentEntry["acquisition"]
): TalentEntry {
  return {
    uid,
    talentId,
    name,
    ...(specialisation ? { specialisation } : {}),
    ...(acquisition ? { acquisition } : {}),
  };
}

function block(talents: TalentEntry[]): TalentsAndTraitsBlock {
  return { homeworld: "hive-world", talents, traits: [] };
}

function skill(over: Partial<SkillEntry>): SkillEntry {
  return {
    id: "awareness",
    name: "Awareness",
    characteristic: "per",
    level: "untrained",
    category: "General",
    advanced: false,
    source: "CR",
    ...over,
  };
}

describe("Talent cross-page effects", () => {
  it("labels Machinator Array, Cult Briefing, and Purity characteristic adjustments", () => {
    const talents = block([
      entry("m1", "machinator-array", "Machinator Array"),
      entry("c1", "cult-briefing", "Cult Briefing (Pleasure)", "Pleasure"),
      entry("p1", "purity-of-flesh", "Purity of Flesh", undefined, {
        purity: {
          removedCyberneticIds: [],
          qualifyingBionicsRemoved: 0,
          fatePointsGained: 0,
          toughnessLoss: 3,
          woundsLoss: 1,
        },
      }),
    ]);

    expect(getTalentCharacteristicModifierSources(talents, "s")).toEqual([
      { name: "Machinator Array", type: "Talent", amount: 10 },
    ]);
    expect(getTalentCharacteristicModifierSources(talents, "fel")).toEqual([
      { name: "Machinator Array", type: "Talent", amount: -5 },
      { name: "Cult Briefing (Pleasure)", type: "Talent", amount: 5 },
    ]);
    expect(getTalentCharacteristicModifierSources(talents, "t").map((source) => source.amount)).toEqual([10, -3]);
  });

  it("aggregates and labels Wound modifiers", () => {
    const talents = block([
      entry("s1", "sound-constitution", "Sound Constitution"),
      entry("s2", "sound-constitution", "Sound Constitution"),
      entry("st", "sicarius-tutoring", "Sicarius Tutoring (Imperial Psyker)", "Imperial Psyker"),
      entry("p1", "purity-of-flesh", "Purity of Flesh", undefined, {
        purity: {
          removedCyberneticIds: [],
          qualifyingBionicsRemoved: 0,
          fatePointsGained: 0,
          woundsLoss: 1,
        },
      }),
    ]);
    expect(getTalentWoundModifierSources(talents)).toEqual([
      { name: "Sound Constitution (2)", type: "Talent", amount: 2 },
      { name: "Sicarius Tutoring (Imperial Psyker)", type: "Talent", amount: 1 },
      { name: "Purity of Flesh", type: "Talent", amount: -1 },
    ]);
  });

  it("applies Chem Geld once whether directly owned or granted", () => {
    const direct = block([entry("c1", "chem-geld", "Chem Geld")]);
    const granted = block([
      entry("c2", "cult-briefing", "Cult Briefing (Pleasure)", "Pleasure", {
        grantedTalentId: "chem-geld",
        grantedTalentName: "Chem Geld",
      }),
    ]);
    expect(getTalentInsanityModifierSources(direct)[0].amount).toBe(1);
    expect(getTalentInsanityModifierSources(granted)[0].amount).toBe(1);
  });

  it("applies Talent skill bonuses, training, Basic status, and alternate characteristics", () => {
    const talents = block([
      entry("t1", "talented", "Talented (Awareness)", "Awareness"),
      entry("m1", "machinator-array", "Machinator Array"),
      entry("p1", "cult-briefing", "Cult Briefing (Political)", "Political"),
      entry("h1", "cult-briefing", "Cult Briefing (Heretek)", "Heretek"),
      entry("a1", "sicarius-tutoring", "Sicarius Tutoring (Adept)", "Adept"),
    ]);
    expect(getTalentSkillEffects(talents, skill({ name: "Awareness" })).modifier).toBe(10);
    expect(getTalentSkillEffects(talents, skill({ id: "silent-move", name: "Silent Move" })).modifier).toBe(-10);
    const politicalCommonLore = getTalentSkillEffects(
      talents,
      skill({ id: "common-lore-imperium", name: "Common Lore (Imperium)", category: "Common Lore", advanced: true })
    );
    expect(politicalCommonLore.countsAsBasic).toBe(true);
    expect(politicalCommonLore.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "Cult Briefing (Political)",
        detail: "counts Common Lore (Imperium) as Basic",
      }),
    ]));
    expect(getTalentSkillEffects(talents, skill({ id: "tech-use", name: "Tech-Use", advanced: true })).minimumLevel).toBe("trained");
    expect(getTalentSkillEffects(talents, skill({ id: "deceive", name: "Deceive", characteristic: "fel" })).characteristic).toBe("int");
  });

  it("shows Cult Briefing training only when it supplies otherwise-missing training", () => {
    const heretek = block([
      entry("h1", "cult-briefing", "Cult Briefing (Heretek)", "Heretek"),
    ]);
    const infestation = block([
      entry("i1", "cult-briefing", "Cult Briefing (Infestation)", "Infestation"),
    ]);

    const untrainedTechUse = getTalentSkillEffects(
      heretek,
      skill({ id: "tech-use", name: "Tech-Use", advanced: true, level: "untrained" })
    );
    expect(untrainedTechUse.minimumLevel).toBe("trained");
    expect(untrainedTechUse.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Cult Briefing (Heretek)", detail: "counts Tech-Use as trained" }),
      expect.objectContaining({ name: "Caves of Steel", type: "Homeworld", detail: "counts Tech-Use as Basic" }),
    ]));

    for (const level of ["trained", "+10", "+20"] as const) {
      const trainedTechUse = getTalentSkillEffects(
        heretek,
        skill({ id: "tech-use", name: "Tech-Use", advanced: true, level })
      );
      // The minimum remains available internally so owned-only Skill storage can recognise
      // that a downgrade has returned to free granted training. Its redundant display source
      // remains hidden once the saved Skill is already trained.
      expect(trainedTechUse.minimumLevel).toBe("trained");
      expect(trainedTechUse.sources).toEqual([
        expect.objectContaining({ name: "Caves of Steel", type: "Homeworld", detail: "counts Tech-Use as Basic" }),
      ]);
    }

    const untrainedMedicae = getTalentSkillEffects(
      infestation,
      skill({ id: "medicae", name: "Medicae", advanced: true, level: "untrained" })
    );
    expect(untrainedMedicae.minimumLevel).toBe("trained");
    expect(untrainedMedicae.sources).toEqual([
      expect.objectContaining({ name: "Cult Briefing (Infestation)", detail: "counts Medicae as trained" }),
    ]);
    expect(
      getTalentSkillEffects(
        infestation,
        skill({ id: "medicae", name: "Medicae", advanced: true, level: "trained" })
      ).sources
    ).toEqual([]);
  });

  it("derives granted Talents, Traits, and Weapon Training without saving fake purchases", () => {
    const talents = block([
      entry("pw", "the-power-within", "The Power Within"),
      entry("fw1", "the-flesh-is-weak", "The Flesh is Weak"),
      entry("fw2", "the-flesh-is-weak", "The Flesh is Weak"),
      entry("b", "cult-briefing", "Cult Briefing (Blood)", "Blood", { weaponTrainingId: "melee-chain" }),
      entry("g", "sicarius-tutoring", "Sicarius Tutoring (Guardsman)", "Guardsman", { exoticWeapon: "Needle Pistol" }),
    ]);
    expect(getGrantedTalentEntries(talents)).toEqual(expect.arrayContaining([
      expect.objectContaining({ talentId: "resistance", specialisation: "Psychic Powers", grantedByTalentEntryUid: "pw" }),
      expect.objectContaining({ talentId: "frenzy", grantedByTalentEntryUid: "b" }),
    ]));
    expect(getGrantedTraitEntries(talents)).toEqual([
      expect.objectContaining({ talentId: "machine", specialisation: "2", grantedByTalentEntryUid: "fw2" }),
    ]);
    expect(getMachineArmourSource(talents)?.amount).toBe(2);
    expect(getGrantedWeaponTrainingIds(talents)).toEqual(["melee-chain"]);
    expect(getGrantedExoticWeapons(talents)).toEqual(["Needle Pistol"]);
  });

  it("tags a Trait-sourced grant as Trait, not Talent (Chem Geld via Sanctioned Psyker's Throne-Wed result)", () => {
    const talents: TalentsAndTraitsBlock = {
      homeworld: "hive-world",
      talents: [],
      traits: [
        entry("sp", "sanctioned-psyker", "Sanctioned Psyker", undefined, {
          trait: { sanctioning: { resultId: "throne-wed", resultName: "Throne-Wed" } },
        }),
      ],
    };
    const chemGeld = getGrantedTalentEntries(talents).find((grant) => grant.talentId === "chem-geld");
    expect(chemGeld?.grantedByTalentName).toBe("Sanctioned Psyker");
    expect(chemGeld?.grantedByType).toBe("Trait");
  });

  it("hides a manually-added duplicate once the same talent is granted independently", () => {
    const grantOrigin = entry("cult", "cult-briefing", "Cult Briefing (Pleasure)", "Pleasure", {
      grantedTalentId: "chem-geld",
      grantedTalentName: "Chem Geld",
    });
    const directCopy = entry("chem", "chem-geld", "Chem Geld");

    const grants = getGrantedTalentEntries(block([grantOrigin]));
    expect(filterTalentEntriesCoveredByGrants([directCopy], grants)).toEqual([]);
    expect(filterTalentEntriesCoveredByGrants([directCopy], [])).toEqual([directCopy]);
  });

  it("counts a granted Talent only once even when the same Talent is also directly purchased", () => {
    const talents = block([
      entry("cult", "cult-briefing", "Cult Briefing (Pleasure)", "Pleasure", {
        grantedTalentId: "chem-geld",
        grantedTalentName: "Chem Geld",
      }),
      entry("chem", "chem-geld", "Chem Geld"),
    ]);

    const active = getActiveTalentEntries(talents);
    expect(active.filter((item) => item.talentId === "chem-geld")).toHaveLength(1);
  });

  it("tracks Touched by the Fates and reverses Purity Fate through linked Reformed Skin", () => {
    const talents = block([
      entry("t", "touched-by-the-fates", "Touched by the Fates", undefined, { touchedByFatesPoints: 3 }),
      entry("p", "purity-of-flesh", "Purity of Flesh", undefined, {
        purity: { removedCyberneticIds: [], qualifyingBionicsRemoved: 4, fatePointsGained: 2 },
      }),
      entry("r", "reformed-skin", "Reformed Skin (Arm)", "Arm", {
        reformedSkinPurityReplacement: true,
        purityTalentEntryUid: "p",
      }),
    ]);
    expect(getTalentFateEffects(talents)).toEqual({
      overrideTotal: 3,
      overrideSource: "Touched by the Fates",
      modifierSources: [
        { name: "Purity of Flesh", type: "Talent", amount: 2 },
        { name: "Reformed Skin", type: "Talent", amount: -2 },
      ],
    });
  });

  it("removes Purity Fate once while any Purity replacement remains", () => {
    const purity = entry("p", "purity-of-flesh", "Purity of Flesh", undefined, {
      purity: { removedCyberneticIds: [], qualifyingBionicsRemoved: 4, fatePointsGained: 2 },
    });
    const first = entry("r1", "reformed-skin", "Reformed Skin (Arm)", "Arm", {
      reformedSkinPurityReplacement: true,
      purityTalentEntryUid: "p",
    });
    const second = entry("r2", "reformed-skin", "Reformed Skin (Leg)", "Leg", {
      reformedSkinPurityReplacement: true,
      purityTalentEntryUid: "p",
    });
    const criticalDamage = entry("r3", "reformed-skin", "Reformed Skin (Eye)", "Eye", {
      reformedSkinPurityReplacement: false,
    });

    expect(getTalentFateEffects(block([purity, first, second, criticalDamage])).modifierSources).toEqual([
      { name: "Purity of Flesh", type: "Talent", amount: 2 },
      { name: "Reformed Skin", type: "Talent", amount: -2 },
    ]);
    expect(getTalentFateEffects(block([purity, second, criticalDamage])).modifierSources).toEqual([
      { name: "Purity of Flesh", type: "Talent", amount: 2 },
      { name: "Reformed Skin", type: "Talent", amount: -2 },
    ]);
    expect(getTalentFateEffects(block([purity, criticalDamage])).modifierSources).toEqual([
      { name: "Purity of Flesh", type: "Talent", amount: 2 },
    ]);
  });
});

describe("Psy Rating power grants", () => {
  const talents = block([
    entry("pr1", "psy-rating-1", "Psy Rating 1", undefined, {
      psyRatingWillpowerBonus: 4,
      psyRatingMinorPowerGrants: 2,
    }),
  ]);
  const emptyPsychic: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };

  it("calculates remaining selections and consumes only one grant slot", () => {
    expect(getAvailablePsyRatingPowerGrants(talents, emptyPsychic, "minor")[0].remaining).toBe(2);
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      minorPowers: [{ id: "power", name: "Power", known: true }],
    };
    const linked = linkPowerToPsyRatingGrant(psychic, talents, "power", "pr1");
    expect(linked.minorPowers[0].psyRatingTalentEntryUid).toBe("pr1");
    expect(getAvailablePsyRatingPowerGrants(talents, linked, "minor")[0].remaining).toBe(1);
  });

  it("rejects a second link on a power and a grant used for the wrong group", () => {
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      majorPowers: [{ id: "major", name: "Major", known: true }],
      minorPowers: [{ id: "minor", name: "Minor", known: true, talentEntryUid: "purchase" }],
    };
    expect(linkPowerToPsyRatingGrant(psychic, talents, "major", "pr1")).toBe(psychic);
    expect(linkPowerToPsyRatingGrant(psychic, talents, "minor", "pr1")).toBe(psychic);
  });
});
