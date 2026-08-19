import { describe, expect, it } from "vitest";
import { DEFAULT_SKILLS } from "../../src/data/defaultSkills";
import {
  getActiveTraitEntries,
  getDerivedTraitEntries,
  getTraitArmourSources,
  getTraitCharacteristicModifierSources,
  getTraitGrantedTalentSpecs,
  getTraitGrantedWeaponTrainingIds,
  getTraitInsanityModifierSources,
  getTraitMovementEffects,
  getTraitSkillEffects,
  getWaryInitiativeBonus,
} from "../../src/features/traits/traitEffects";
import type { TalentEntry, TalentsAndTraitsBlock } from "../../src/types/Character";

function block(over: Partial<TalentsAndTraitsBlock> = {}): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [], ...over };
}

function trait(talentId: string, specialisation?: string, over: Partial<TalentEntry> = {}): TalentEntry {
  return { uid: `${talentId}:${specialisation ?? "plain"}`, talentId, name: talentId, specialisation, ...over };
}

describe("Trait cross-page effects", () => {
  it("derives selected Homeworld, Talent-granted and Career Traits without saving duplicate entries", () => {
    const talents = block({
      homeworld: "hive-world",
      talents: [trait("the-flesh-is-weak"), trait("the-flesh-is-weak", undefined, { uid: "flesh-2" })],
    });
    const derived = getDerivedTraitEntries(talents, "Tech-Priest");
    expect(derived.some((entry) => entry.talentId === "homeworld-caves-of-steel")).toBe(true);
    expect(derived).toEqual(expect.arrayContaining([
      expect.objectContaining({ talentId: "machine", specialisation: "2" }),
      expect.objectContaining({ talentId: "mechanicus-implants" }),
    ]));
    expect(talents.traits).toEqual([]);
  });

  it("applies Trait characteristic changes and suppresses Fit For Purpose for Labourer Build", () => {
    const talents = block({
      homeworld: "forge-world",
      traits: [trait("multiple-arms"), trait("labourer-build")],
    });
    expect(getTraitCharacteristicModifierSources(talents, "t", "Adept").map((source) => source.amount)).toEqual([10, 3]);
    expect(getTraitCharacteristicModifierSources(talents, "int", "Adept")).toEqual([]);

    const soulBound = block({ traits: [trait("soul-bound", undefined, {
      acquisition: { trait: { soulBound: { entity: "The Emperor", consequence: "characteristic", characteristic: "wp", rolledValue: 7 } } },
    })] });
    expect(getTraitCharacteristicModifierSources(soulBound, "wp")).toEqual([
      expect.objectContaining({ name: "Soul-bound", amount: -7, type: "Trait" }),
    ]);
  });

  it("applies Homeworld and Blank Slate Skill rules with named Trait sources", () => {
    const techUse = DEFAULT_SKILLS.find((skill) => skill.id === "tech-use")!;
    const hive = block({ homeworld: "hive-world" });
    expect(getTraitSkillEffects(hive, techUse).countsAsBasic).toBe(true);

    const commonTech = DEFAULT_SKILLS.find((skill) => skill.id === "common-tech")!;
    const machineCult = DEFAULT_SKILLS.find((skill) => skill.id === "common-machine-cult")!;
    const forge = block({ homeworld: "forge-world" });
    expect(getTraitSkillEffects(forge, commonTech).countsAsBasic).toBe(true);
    expect(getTraitSkillEffects(forge, machineCult).countsAsBasic).toBe(true);
    expect(getTraitSkillEffects(hive, machineCult).countsAsBasic).toBeUndefined();

    const lore = DEFAULT_SKILLS.find((skill) => skill.category === "Common Lore")!;
    const blank = block({ traits: [trait("blank-slate", undefined, {
      acquisition: { trait: { blankSlateSkillIds: [lore.id, "trade-copyist", "forbidden-inquisition"] } },
    })] });
    expect(getTraitSkillEffects(blank, lore)).toEqual(expect.objectContaining({
      minimumLevel: "trained",
      modifier: 10,
    }));
  });

  it("records starting and acquisition Insanity separately from the base value", () => {
    const talents = block({
      homeworld: "mind-cleansed",
      homeworldTraitChoices: { startingInsanity: 6 },
      traits: [trait("soul-bound", undefined, {
        acquisition: { trait: { soulBound: { entity: "The Emperor", consequence: "insanity", rolledValue: 4 } } },
      })],
    });
    expect(getTraitInsanityModifierSources(talents).map((source) => source.amount)).toEqual(
      expect.arrayContaining([6, 4])
    );
  });

  it("counts a manually-purchased Sanctioned Psyker only once when the same career also derives it", () => {
    const manual = trait("sanctioned-psyker", undefined, {
      uid: "manual-sanctioned",
      acquisition: {
        trait: { sanctioning: { resultId: "hunted", resultName: "Hunted", rolledValue: 1, ageIncrease: 5 } },
      },
    });
    const talents = block({
      traits: [manual],
      careerTraitAcquisition: {
        sanctioning: { resultId: "hunted", resultName: "Hunted", rolledValue: 5, ageIncrease: 12 },
      },
    });

    const active = getActiveTraitEntries(talents, "Imperial Psyker");
    expect(active.filter((entry) => entry.talentId === "sanctioned-psyker")).toHaveLength(1);

    const insanitySources = getTraitInsanityModifierSources(talents, "Imperial Psyker");
    expect(insanitySources).toHaveLength(1);
    expect(insanitySources[0].amount).toBe(5);
  });

  it("derives Blind as a read-only consequence of Soul-bound blindness", () => {
    const talents = block({ traits: [trait("soul-bound", undefined, {
      acquisition: { trait: { soulBound: { entity: "The Emperor", consequence: "blindness" } } },
    })] });
    expect(getDerivedTraitEntries(talents)).toEqual(expect.arrayContaining([
      expect.objectContaining({ talentId: "blind", grantedByTalentName: "Soul-bound" }),
    ]));
  });

  it("combines armour Traits while only using the strongest Machine value", () => {
    const talents = block({ traits: [
      trait("natural-armour", "3"),
      trait("armour-plating"),
      trait("machine", "2"),
      trait("machine", "5", { uid: "machine-5" }),
    ] });
    expect(getTraitArmourSources(talents).map((source) => source.amount)).toEqual([3, 2, 5]);
  });

  it("applies Size and movement Traits without using Unnatural Agility", () => {
    const talents = block({ traits: [
      trait("size", "Hulking"),
      trait("quadruped"),
      trait("unnatural-speed"),
      trait("burrower", "7"),
    ] });
    const movement = getTraitMovementEffects(talents, 4);
    expect(movement.agilityBonus).toBe(18);
    expect(movement.modes).toEqual([{ name: "Burrow", speed: 7, source: "burrower" }]);
  });

  it("derives Homeworld Talents, Weapon Training and Wary initiative from recorded choices", () => {
    const noble = block({ homeworld: "noble-born", homeworldTraitChoices: { peerGroup: "Mercantile" } });
    expect(getTraitGrantedTalentSpecs(noble)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "peer", specialisation: "Nobility" }),
      expect.objectContaining({ id: "peer", specialisation: "Mercantile" }),
    ]));

    const schola = block({ homeworld: "schola-progenium", homeworldTraitChoices: { basicWeaponGroup: "Las", pistolWeaponGroup: "SP" } });
    expect(getTraitGrantedWeaponTrainingIds(schola)).toEqual(["basic-las", "melee-primitive", "pistol-sp"]);
    expect(getWaryInitiativeBonus(block({ homeworld: "hive-world" }))).toBe(1);
    expect(getActiveTraitEntries(schola).some((entry) => entry.talentId === "homeworld-skill-at-arms")).toBe(true);
  });
});
