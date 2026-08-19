import { HOMEWORLD_LIST, type HomeworldData } from "../../data/homeworldData";
import { TRAIT_LIST } from "../../data/traitData";
import type {
  Characteristics,
  HomeworldTraitChoices,
  SanctioningAcquisition,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import { SANCTIONING_RESULTS } from "./sanctioningReference";

export interface TraitModifierSource {
  name: string;
  type: "Trait";
  amount: number;
}

export interface TraitSkillEffects {
  countsAsBasic?: boolean;
  minimumLevel?: SkillAdvanceLevel;
  modifier: number;
  sources: TraitModifierSource[];
}

function traitReference(name: string, source: string) {
  return TRAIT_LIST.find((trait) => trait.name === name && trait.source === source);
}

export function notesForSanctioning(result: SanctioningAcquisition): string {
  const effect = SANCTIONING_RESULTS.find((entry) => entry.id === result.resultId)?.effect;
  const detail = result.thronesGained
    ? `Throne Gelt gained: ${result.thronesGained}`
    : result.rolledValue
      ? `Insanity Points gained: ${result.rolledValue}`
      : undefined;
  const resultGroup = [`${result.resultName} (Sanctioning Side Effect)`, effect].filter(Boolean).join("\n");
  const rollGroup = ["Roll Results", detail, `Age increased by ${result.ageIncrease} years`].filter(Boolean).join("\n");
  return [resultGroup, rollGroup].join("\n\n");
}

function homeworldEntries(
  homeworld: HomeworldData,
  choices: HomeworldTraitChoices | undefined,
  originUid: string,
  originName: string
): TalentEntry[] {
  return homeworld.traits.map((trait, index) => {
    const reference = traitReference(trait.name, homeworld.source);
    return {
      uid: `${originUid}:${reference?.id ?? index}`,
      talentId: reference?.id ?? `homeworld-trait:${homeworld.id}:${index}`,
      name: trait.name,
      acquisition: { homeworldTraitChoices: choices },
      grantedByTalentEntryUid: originUid,
      grantedByTalentName: originName,
    };
  });
}

export function getDerivedTraitEntries(
  talents: TalentsAndTraitsBlock,
  career?: string
): TalentEntry[] {
  const grants: TalentEntry[] = [];
  const selectedHomeworld = HOMEWORLD_LIST.find((homeworld) => homeworld.id === talents.homeworld);
  if (selectedHomeworld) {
    grants.push(...homeworldEntries(
      selectedHomeworld,
      talents.homeworldTraitChoices,
      `homeworld:${selectedHomeworld.id}`,
      `Homeworld: ${selectedHomeworld.name}`
    ));
  }

  for (const origin of talents.talents.filter(
    (entry) => entry.talentId === "cult-briefing" && entry.specialisation?.toLocaleLowerCase() === "culture"
  )) {
    const homeworld = HOMEWORLD_LIST.find((item) => item.id === origin.acquisition?.homeworldId);
    if (!homeworld) continue;
    grants.push(...homeworldEntries(
      homeworld,
      origin.acquisition?.homeworldTraitChoices,
      `culture:${origin.uid}`,
      `Cult Briefing (Culture: ${homeworld.name})`
    ));
  }

  const fleshRank = talents.talents.filter((entry) => entry.talentId === "the-flesh-is-weak").length;
  if (fleshRank > 0) {
    const origin = talents.talents.filter((entry) => entry.talentId === "the-flesh-is-weak")[fleshRank - 1];
    grants.push({
      uid: `grant:${origin.uid}:machine:${fleshRank}`,
      talentId: "machine",
      name: `Machine (${fleshRank})`,
      specialisation: String(fleshRank),
      grantedByTalentEntryUid: origin.uid,
      grantedByTalentName: origin.name,
    });
  }

  for (const origin of talents.traits.filter(
    (entry) =>
      entry.talentId === "soul-bound" &&
      entry.acquisition?.trait?.soulBound?.consequence === "blindness"
  )) {
    grants.push({
      uid: `grant:${origin.uid}:blind`,
      talentId: "blind",
      name: "Blind",
      grantedByTalentEntryUid: origin.uid,
      grantedByTalentName: "Soul-bound",
    });
  }

  if (career === "Imperial Psyker") {
    grants.push({
      uid: "career:imperial-psyker:sanctioned-psyker",
      talentId: "sanctioned-psyker",
      name: "Sanctioned Psyker",
      acquisition: { trait: talents.careerTraitAcquisition },
      notes: talents.careerTraitAcquisition?.sanctioning
        ? notesForSanctioning(talents.careerTraitAcquisition.sanctioning)
        : undefined,
      grantedByTalentEntryUid: "career:imperial-psyker",
      grantedByTalentName: "Career: Imperial Psyker",
    });
  }
  if (career === "Tech-Priest") {
    grants.push({
      uid: "career:tech-priest:mechanicus-implants",
      talentId: "mechanicus-implants",
      name: "Mechanicus Implants",
      grantedByTalentEntryUid: "career:tech-priest",
      grantedByTalentName: "Career: Tech-Priest",
    });
  }
  return grants;
}

export function getActiveTraitEntries(
  talents: TalentsAndTraitsBlock,
  career?: string
): TalentEntry[] {
  const derived = getDerivedTraitEntries(talents, career);
  const derivedTalentIds = new Set(derived.map((entry) => entry.talentId));
  const manual = talents.traits.filter((entry) => {
    const trait = TRAIT_LIST.find((item) => item.id === entry.talentId);
    return trait?.repeatable || !derivedTalentIds.has(entry.talentId);
  });
  return [...manual, ...derived];
}

function addSource(
  sources: TraitModifierSource[],
  name: string,
  amount: number
) {
  if (amount !== 0) sources.push({ name, type: "Trait", amount });
}

const CAREER_FIT: Partial<Record<string, keyof Characteristics>> = {
  Adept: "int",
  Assassin: "ag",
  Guardsman: "bs",
  Scum: "per",
  "Tech-Priest": "wp",
};

function sanctioningModifier(entry: TalentEntry, characteristic: keyof Characteristics): number {
  const result = entry.acquisition?.trait?.sanctioning?.resultId;
  if (result === "reconstructed-skull" && characteristic === "int") return -3;
  if (result === "witch-prickling" && characteristic === "t") return 3;
  if (result === "hypno-doctrination" && characteristic === "wp") return 3;
  return 0;
}

export function getTraitCharacteristicModifierSources(
  talents: TalentsAndTraitsBlock,
  characteristic: keyof Characteristics,
  career?: string
): TraitModifierSource[] {
  const entries = getActiveTraitEntries(talents, career);
  const sources: TraitModifierSource[] = [];
  const labourerBuild = entries.some((entry) => entry.talentId === "labourer-build");

  for (const entry of entries) {
    if (entry.talentId === "multiple-arms" && characteristic === "t") {
      addSource(sources, "Multiple Arms", 10);
    }
    if (entry.talentId === "labourer-build") {
      addSource(
        sources,
        "Labourer Build",
        characteristic === "s" || characteristic === "t" ? 3 : characteristic === "ag" ? -5 : 0
      );
    }
    if (entry.talentId === "homeworld-superior-origins" && characteristic === "wp") {
      addSource(sources, "Superior Origins", 3);
    }
    if (entry.talentId === "homeworld-fit-for-purpose" && !labourerBuild && CAREER_FIT[career ?? ""] === characteristic) {
      addSource(sources, "Fit For Purpose", 3);
    }
    const soulBound = entry.acquisition?.trait?.soulBound;
    if (
      entry.talentId === "soul-bound" &&
      soulBound?.consequence === "characteristic" &&
      soulBound.characteristic === characteristic
    ) {
      addSource(sources, "Soul-bound", -(soulBound.rolledValue ?? 0));
    }
    if (entry.talentId === "sanctioned-psyker") {
      addSource(sources, `Sanctioned Psyker (${entry.acquisition?.trait?.sanctioning?.resultName ?? "Side Effect"})`, sanctioningModifier(entry, characteristic));
    }
  }
  return sources;
}

export function getTraitCharacteristicModifierTotals(
  talents: TalentsAndTraitsBlock,
  career?: string
): Partial<Record<keyof Characteristics, number>> {
  const totals: Partial<Record<keyof Characteristics, number>> = {};
  for (const key of ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"] as const) {
    totals[key] = getTraitCharacteristicModifierSources(talents, key, career)
      .reduce((total, source) => total + source.amount, 0);
  }
  return totals;
}

function matchesAny(skill: SkillEntry, ids: readonly string[]): boolean {
  return ids.includes(skill.id);
}

export function getTraitSkillEffects(
  talents: TalentsAndTraitsBlock,
  skill: SkillEntry,
  career?: string
): TraitSkillEffects {
  const effects: TraitSkillEffects = { modifier: 0, sources: [] };
  const entries = getActiveTraitEntries(talents, career);
  const applyBasic = (name: string) => {
    if (skill.level !== "untrained") return;
    effects.countsAsBasic = true;
    effects.sources.push({ name: `${name}: counts as Basic`, type: "Trait", amount: 0 });
  };
  const applyTrained = (name: string) => {
    effects.minimumLevel = "trained";
    effects.sources.push({ name: `${name}: Trained`, type: "Trait", amount: 0 });
  };
  const applyModifier = (name: string, amount: number) => {
    effects.modifier += amount;
    effects.sources.push({ name, type: "Trait", amount });
  };

  if (talents.homeworld === "forge-world" && matchesAny(skill, ["common-tech", "common-machine-cult"])) {
    applyBasic("Forge World");
  }

  for (const entry of entries) {
    switch (entry.talentId) {
      case "homeworld-primitive":
        if (skill.id === "tech-use") applyModifier("Primitive", -10);
        break;
      case "homeworld-wilderness-savvy":
        if (matchesAny(skill, ["navigation-surface", "survival", "tracking"])) applyBasic("Wilderness Savvy");
        break;
      case "homeworld-caves-of-steel":
        if (skill.id === "tech-use") applyBasic("Caves of Steel");
        break;
      case "homeworld-hivebound":
        if (skill.id === "survival") applyModifier("Hivebound", -10);
        break;
      case "homeworld-blessed-ignorance":
        if (skill.category === "Forbidden Lore") applyModifier("Blessed Ignorance", -5);
        break;
      case "homeworld-hagiography":
        if (matchesAny(skill, ["common-imperial-creed", "common-imperium", "common-war"])) applyBasic("Hagiography");
        break;
      case "homeworld-liturgical-familiarity":
        if (matchesAny(skill, ["literacy", "speak-high-gothic"])) applyBasic("Liturgical Familiarity");
        break;
      case "homeworld-shipwise":
        if (matchesAny(skill, ["navigation-stellar", "pilot-spacecraft"])) applyBasic("Shipwise");
        break;
      case "homeworld-schola-education":
        if (matchesAny(skill, [
          "common-administratum", "common-ecclesiarchy", "common-imperial-creed",
          "common-imperium", "common-war", "scholastic-philosophy",
        ])) applyBasic("Schola Education");
        break;
      case "homeworld-engram-implantation":
        if (matchesAny(skill, ["deceive", "intimidate"])) applyTrained("Engram Implantation");
        if (matchesAny(skill, ["common-tech", "survival"])) applyBasic("Engram Implantation");
        break;
      case "blank-slate":
        if (entry.acquisition?.trait?.blankSlateSkillIds?.includes(skill.id)) {
          applyTrained("Blank Slate");
          applyModifier("Blank Slate", 10);
        }
        break;
    }
  }
  return effects;
}

export function getTraitInsanityModifierSources(
  talents: TalentsAndTraitsBlock,
  career?: string
): TraitModifierSource[] {
  const sources: TraitModifierSource[] = [];
  for (const entry of getActiveTraitEntries(talents, career)) {
    if (entry.talentId === "homeworld-through-a-mirror-darkly") {
      addSource(sources, "Through a Mirror Darkly", entry.acquisition?.homeworldTraitChoices?.startingInsanity ?? 0);
    }
    const soulBound = entry.acquisition?.trait?.soulBound;
    if (entry.talentId === "soul-bound" && soulBound?.consequence === "insanity") {
      addSource(sources, "Soul-bound", soulBound.rolledValue ?? 0);
    }
    if (entry.talentId === "sanctioned-psyker") {
      const result = entry.acquisition?.trait?.sanctioning;
      if (["hunted", "unlovely-memories", "the-horror"].includes(result?.resultId ?? "")) {
        addSource(sources, `Sanctioned Psyker (${result?.resultName})`, result?.rolledValue ?? 0);
      }
    }
  }
  return sources;
}

export interface TraitArmourSource extends TraitModifierSource {
  kind: "natural" | "plating" | "machine";
}

export function getTraitArmourSources(
  talents: TalentsAndTraitsBlock,
  career?: string
): TraitArmourSource[] {
  const entries = getActiveTraitEntries(talents, career);
  const sources: TraitArmourSource[] = [];
  const natural = entries.find((entry) => entry.talentId === "natural-armour");
  const naturalAmount = Number(natural?.specialisation ?? 0);
  if (natural && Number.isInteger(naturalAmount) && naturalAmount > 0) {
    sources.push({ name: "Natural Armour", type: "Trait", amount: naturalAmount, kind: "natural" });
  }
  if (entries.some((entry) => entry.talentId === "armour-plating")) {
    sources.push({ name: "Armour Plating", type: "Trait", amount: 2, kind: "plating" });
  }
  const machineEntries = entries.filter((entry) => entry.talentId === "machine");
  const machine = machineEntries.reduce<{ entry?: TalentEntry; amount: number }>((best, entry) => {
    const amount = Number(entry.specialisation ?? 0);
    return Number.isInteger(amount) && amount > best.amount ? { entry, amount } : best;
  }, { amount: 0 });
  if (machine.entry) {
    sources.push({
      name: machine.entry.grantedByTalentName ?? "Machine",
      type: "Trait",
      amount: machine.amount,
      kind: "machine",
    });
  }
  return sources;
}

const SIZE_ADJUSTMENT: Record<string, number> = {
  Minuscule: -3,
  Puny: -2,
  Scrawny: -1,
  Average: 0,
  Hulking: 1,
  Enormous: 2,
  Massive: 3,
};

export interface TraitMovementEffects {
  agilityBonus: number;
  sources: string[];
  modes: Array<{ name: "Burrow" | "Fly" | "Hover"; speed: number; source: string }>;
}

export function getTraitMovementEffects(
  talents: TalentsAndTraitsBlock,
  baseAgilityBonus: number,
  career?: string
): TraitMovementEffects {
  const entries = getActiveTraitEntries(talents, career);
  let bonus = baseAgilityBonus;
  const sources: string[] = [];
  if (entries.some((entry) => entry.talentId === "amorphous")) {
    bonus = Math.max(1, Math.floor(bonus / 2));
    sources.push("Amorphous: AB halved");
  }
  if (entries.some((entry) => entry.talentId === "crawler")) {
    bonus = Math.max(1, Math.floor(bonus / 2));
    sources.push("Crawler: AB halved");
  }
  if (entries.some((entry) => entry.talentId === "quadruped")) {
    bonus *= 2;
    sources.push("Quadruped: AB doubled");
  }
  const size = entries.find((entry) => entry.talentId === "size");
  if (size?.specialisation && SIZE_ADJUSTMENT[size.specialisation] !== undefined) {
    bonus = Math.max(1, bonus + SIZE_ADJUSTMENT[size.specialisation]);
    const sizeAdj = SIZE_ADJUSTMENT[size.specialisation];
    sources.push(`Size (${size.specialisation}): ${sizeAdj > 0 ? "+" : ""}${sizeAdj} AB`);
  }
  if (entries.some((entry) => entry.talentId === "unnatural-speed")) {
    bonus *= 2;
    sources.push("Unnatural Speed: AB doubled");
  }
  sources.sort((a, b) => a.localeCompare(b));
  const modes = entries.flatMap((entry) => {
    const names = { burrower: "Burrow", flyer: "Fly", hoverer: "Hover" } as const;
    const name = names[entry.talentId as keyof typeof names];
    const speed = Number(entry.specialisation ?? 0);
    return name && Number.isInteger(speed) && speed > 0 ? [{ name, speed, source: entry.name }] : [];
  });
  return { agilityBonus: bonus, sources, modes };
}

export function getTraitGrantedTalentSpecs(
  talents: TalentsAndTraitsBlock,
  career?: string
): Array<{ id: string; name: string; specialisation?: string; origin: TalentEntry }> {
  const grants: Array<{ id: string; name: string; specialisation?: string; origin: TalentEntry }> = [];
  for (const entry of getActiveTraitEntries(talents, career)) {
    if (entry.talentId === "homeworld-credo-omnissiah") {
      grants.push({ id: "technical-knock", name: "Technical Knock", origin: entry });
    }
    if (entry.talentId === "homeworld-supremely-connected") {
      grants.push({ id: "peer", name: "Peer", specialisation: "Nobility", origin: entry });
      const group = entry.acquisition?.homeworldTraitChoices?.peerGroup;
      if (group) grants.push({ id: "peer", name: "Peer", specialisation: group, origin: entry });
    }
    if (entry.talentId === "homeworld-engram-implantation") {
      grants.push({ id: "jaded", name: "Jaded", origin: entry });
    }
    if (
      entry.talentId === "sanctioned-psyker" &&
      entry.acquisition?.trait?.sanctioning?.resultId === "throne-wed"
    ) {
      grants.push({ id: "chem-geld", name: "Chem Geld", origin: entry });
    }
  }
  if (
    !career &&
    talents.careerTraitAcquisition?.sanctioning?.resultId === "throne-wed"
  ) {
    grants.push({
      id: "chem-geld",
      name: "Chem Geld",
      origin: {
        uid: "career:imperial-psyker:sanctioned-psyker",
        talentId: "sanctioned-psyker",
        name: "Sanctioned Psyker",
        acquisition: { trait: talents.careerTraitAcquisition },
        grantedByTalentEntryUid: "career:imperial-psyker",
        grantedByTalentName: "Career: Imperial Psyker",
      },
    });
  }
  return grants;
}

export function getTraitGrantedWeaponTrainingIds(
  talents: TalentsAndTraitsBlock,
  career?: string
): WeaponTrainingTalentId[] {
  const ids: WeaponTrainingTalentId[] = [];
  for (const entry of getActiveTraitEntries(talents, career)) {
    const choices = entry.acquisition?.homeworldTraitChoices;
    if (entry.talentId === "homeworld-skill-at-arms") {
      if (choices?.basicWeaponGroup) ids.push(`basic-${choices.basicWeaponGroup.toLocaleLowerCase()}` as WeaponTrainingTalentId);
      ids.push("melee-primitive");
      if (choices?.pistolWeaponGroup) ids.push(`pistol-${choices.pistolWeaponGroup.toLocaleLowerCase()}` as WeaponTrainingTalentId);
    }
    if (entry.talentId === "homeworld-engram-implantation") {
      ids.push("pistol-sp", "pistol-las");
    }
  }
  return [...new Set(ids)];
}

export function getWaryInitiativeBonus(talents: TalentsAndTraitsBlock, career?: string): number {
  return getActiveTraitEntries(talents, career).some((entry) => entry.talentId === "homeworld-wary") ? 1 : 0;
}
