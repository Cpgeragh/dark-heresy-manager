import { DEFAULT_SKILLS } from "../../data/defaultSkills";
import type { TalentBehaviour, TalentData } from "../../data/talentData";
import type {
  PsychicBlock,
  PsychicPower,
  TalentEntry,
  TalentsAndTraitsBlock,
} from "../../types/Character";
import type { SkillSource } from "../../types/SkillSource";

const ORDINARY_BEHAVIOUR: TalentBehaviour = { kind: "ordinary" };

export const PSYCHIC_TALENT_ID_BY_GROUP = {
  minor: "minor-psychic-power",
  major: "psychic-power",
} as const;

export function getPsyRatingAcquisitionGrants(
  rating: number,
  willpowerBonus: number,
  route: "known" | "new"
): { minor: number; major: number; newDiscipline: boolean } {
  const halfBonus = Math.ceil(willpowerBonus / 2);
  const newDiscipline = rating === 3 || route === "new";
  const minor = rating === 3 || ([4, 6].includes(rating) && !newDiscipline)
    ? halfBonus
    : 0;
  return {
    minor,
    major: newDiscipline ? 1 : halfBonus,
    newDiscipline,
  };
}

export function normaliseSources(source: SkillSource | SkillSource[]): SkillSource[] {
  return Array.isArray(source) ? source : [source];
}

export function normaliseTalentChoice(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function getTalentBehaviour(talent: TalentData): TalentBehaviour {
  if (talent.id === "talented") {
    return {
      kind: "fixed-repeatable",
      options: DEFAULT_SKILLS.map((skill) => skill.name),
    };
  }
  return talent.behaviour ?? ORDINARY_BEHAVIOUR;
}

export function hasTalentChoice(entries: readonly TalentEntry[], choice: string): boolean {
  const normalised = normaliseTalentChoice(choice);
  return entries.some(
    (entry) =>
      entry.specialisation !== undefined &&
      normaliseTalentChoice(entry.specialisation) === normalised
  );
}

export function getAvailableTalentChoices(
  talent: TalentData,
  entries: readonly TalentEntry[]
): readonly string[] {
  const behaviour = getTalentBehaviour(talent);
  if (behaviour.kind === "fixed-single") {
    return entries.length > 0 ? [] : behaviour.options;
  }
  if (behaviour.kind === "fixed-repeatable") {
    return behaviour.options.filter((option) => !hasTalentChoice(entries, option));
  }
  if (behaviour.kind === "hybrid") {
    return behaviour.options
      .filter((option) => !("value" in option) || !hasTalentChoice(entries, option.value))
      .map((option) => option.label);
  }
  return [];
}

export function isTalentAvailableInPicker(
  talent: TalentData,
  allEntries: readonly TalentEntry[]
): boolean {
  const entries = allEntries.filter((entry) => entry.talentId === talent.id);
  const behaviour = getTalentBehaviour(talent);

  switch (behaviour.kind) {
    case "managed-elsewhere":
      return false;
    case "ranked":
      return behaviour.maxPurchases === undefined || entries.length < behaviour.maxPurchases;
    case "fixed-repeatable":
      return getAvailableTalentChoices(talent, entries).length > 0;
    case "fixed-single":
      return entries.length === 0;
    case "hybrid":
    case "repeatable-free-text":
    case "psychic-purchase":
      return true;
    case "ordinary":
      return talent.repeatable === true || entries.length === 0;
  }
}

export function makeTalentEntry(talent: TalentData, specialisation?: string, manualCost?: number): TalentEntry {
  const trimmed = specialisation?.trim();
  return {
    uid: crypto.randomUUID(),
    talentId: talent.id,
    name: trimmed ? `${talent.name} (${trimmed})` : talent.name,
    ...(trimmed ? { specialisation: trimmed } : {}),
    ...(manualCost !== undefined ? { manualCost } : {}),
  };
}

function allPsychicPowers(psychic: PsychicBlock): PsychicPower[] {
  return [...psychic.minorPowers, ...psychic.majorPowers];
}

export function getLinkedTalentEntryUids(psychic: PsychicBlock): ReadonlySet<string> {
  return new Set(
    allPsychicPowers(psychic)
      .map((power) => power.talentEntryUid)
      .filter((uid): uid is string => Boolean(uid))
  );
}

export function getAvailablePsychicTalentPurchases(
  talents: TalentsAndTraitsBlock,
  psychic: PsychicBlock,
  group: "minor" | "major"
): TalentEntry[] {
  const talentId = PSYCHIC_TALENT_ID_BY_GROUP[group];
  const linked = getLinkedTalentEntryUids(psychic);
  return talents.talents.filter(
    (entry) => entry.talentId === talentId && !linked.has(entry.uid)
  );
}

export function linkPowerToTalentPurchase(
  psychic: PsychicBlock,
  talents: TalentsAndTraitsBlock,
  powerId: string,
  talentEntryUid: string
): PsychicBlock {
  if (getLinkedTalentEntryUids(psychic).has(talentEntryUid)) return psychic;

  const group = psychic.minorPowers.some((power) => power.id === powerId)
    ? "minor"
    : psychic.majorPowers.some((power) => power.id === powerId)
      ? "major"
      : null;
  if (!group) return psychic;

  const purchase = talents.talents.find((entry) => entry.uid === talentEntryUid);
  if (purchase?.talentId !== PSYCHIC_TALENT_ID_BY_GROUP[group]) return psychic;

  const field = group === "minor" ? "minorPowers" : "majorPowers";
  const target = psychic[field].find((power) => power.id === powerId);
  if (!target || target.talentEntryUid) return psychic;

  return {
    ...psychic,
    [field]: psychic[field].map((power) =>
      power.id === powerId ? { ...power, talentEntryUid } : power
    ),
  };
}

export interface AvailablePsyRatingGrant {
  entry: TalentEntry;
  remaining: number;
}

export function getAvailablePsyRatingPowerGrants(
  talents: TalentsAndTraitsBlock,
  psychic: PsychicBlock,
  group: "minor" | "major"
): AvailablePsyRatingGrant[] {
  const field = group === "minor" ? "minorPowers" : "majorPowers";
  return talents.talents.flatMap((entry) => {
    if (!/^psy-rating-[1-6]$/.test(entry.talentId)) return [];
    const allowed = group === "minor"
      ? entry.acquisition?.psyRatingMinorPowerGrants ?? 0
      : entry.acquisition?.psyRatingMajorPowerGrants ?? 0;
    const used = psychic[field].filter(
      (power) => power.psyRatingTalentEntryUid === entry.uid
    ).length;
    const remaining = Math.max(0, allowed - used);
    return remaining > 0 ? [{ entry, remaining }] : [];
  });
}

export function linkPowerToPsyRatingGrant(
  psychic: PsychicBlock,
  talents: TalentsAndTraitsBlock,
  powerId: string,
  psyRatingTalentEntryUid: string
): PsychicBlock {
  const group = psychic.minorPowers.some((power) => power.id === powerId)
    ? "minor"
    : psychic.majorPowers.some((power) => power.id === powerId)
      ? "major"
      : null;
  if (!group) return psychic;
  const target = group === "minor"
    ? psychic.minorPowers.find((power) => power.id === powerId)
    : psychic.majorPowers.find((power) => power.id === powerId);
  if (!target || target.talentEntryUid || target.psyRatingTalentEntryUid) return psychic;
  const grantEntry = talents.talents.find((entry) => entry.uid === psyRatingTalentEntryUid);
  if (
    group === "major" &&
    grantEntry?.acquisition?.psyRatingDiscipline &&
    target.discipline?.toLocaleLowerCase() !== grantEntry.acquisition.psyRatingDiscipline.toLocaleLowerCase()
  ) {
    return psychic;
  }
  const available = getAvailablePsyRatingPowerGrants(talents, psychic, group);
  if (!available.some((grant) => grant.entry.uid === psyRatingTalentEntryUid)) return psychic;
  const field = group === "minor" ? "minorPowers" : "majorPowers";
  return {
    ...psychic,
    [field]: psychic[field].map((power) =>
      power.id === powerId ? { ...power, psyRatingTalentEntryUid } : power
    ),
  };
}
