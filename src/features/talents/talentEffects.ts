import { HOMEWORLD_LIST } from "../../data/homeworldData";
import { TALENT_LIST } from "../../data/talentData";
import type {
  Characteristics,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import {
  getTraitGrantedTalentSpecs,
  getTraitGrantedWeaponTrainingIds,
  getTraitSkillEffects,
} from "../traits/traitEffects";

export interface TalentModifierSource {
  name: string;
  type: "Talent" | "Trait";
  amount: number;
}

export type TalentCharacteristicTotals = Partial<Record<keyof Characteristics, number>>;

function entriesFor(talents: TalentsAndTraitsBlock, talentId: string): TalentEntry[] {
  return talents.talents.filter((entry) => entry.talentId === talentId);
}

function hasChoice(entry: TalentEntry, choice: string): boolean {
  return entry.specialisation?.trim().toLocaleLowerCase() === choice.toLocaleLowerCase();
}

function cultEntry(talents: TalentsAndTraitsBlock, choice: string): TalentEntry | undefined {
  return entriesFor(talents, "cult-briefing").find((entry) => hasChoice(entry, choice));
}

function sicariusEntry(talents: TalentsAndTraitsBlock, choice: string): TalentEntry | undefined {
  return entriesFor(talents, "sicarius-tutoring").find((entry) => hasChoice(entry, choice));
}

function addCharacteristicSource(
  sources: TalentModifierSource[],
  name: string,
  amount: number
): void {
  if (amount !== 0) sources.push({ name, type: "Talent", amount });
}

export function getTalentCharacteristicModifierSources(
  talents: TalentsAndTraitsBlock,
  characteristic: keyof Characteristics
): TalentModifierSource[] {
  const sources: TalentModifierSource[] = [];

  if (entriesFor(talents, "machinator-array").length > 0) {
    const amount = characteristic === "s" || characteristic === "t"
      ? 10
      : characteristic === "ag" || characteristic === "fel"
        ? -5
        : 0;
    addCharacteristicSource(sources, "Machinator Array", amount);
  }

  if (characteristic === "fel" && cultEntry(talents, "Pleasure")) {
    addCharacteristicSource(sources, "Cult Briefing (Pleasure)", 5);
  }

  if (characteristic === "t") {
    for (const entry of entriesFor(talents, "purity-of-flesh")) {
      const loss = entry.acquisition?.purity?.toughnessLoss ?? 0;
      addCharacteristicSource(sources, "Purity of Flesh", -loss);
    }
  }

  return sources;
}

export function getTalentCharacteristicModifierTotals(
  talents: TalentsAndTraitsBlock
): TalentCharacteristicTotals {
  const totals: TalentCharacteristicTotals = {};
  const keys: readonly (keyof Characteristics)[] = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"];
  for (const key of keys) {
    totals[key] = getTalentCharacteristicModifierSources(talents, key).reduce(
      (total, source) => total + source.amount,
      0
    );
  }
  return totals;
}

export function combineCharacteristicModifierTotals(
  ...sets: TalentCharacteristicTotals[]
): TalentCharacteristicTotals {
  const combined: TalentCharacteristicTotals = {};
  for (const set of sets) {
    for (const [key, amount] of Object.entries(set) as [keyof Characteristics, number][]) {
      combined[key] = (combined[key] ?? 0) + amount;
    }
  }
  return combined;
}

export function getTalentWoundModifierSources(
  talents: TalentsAndTraitsBlock
): TalentModifierSource[] {
  const sources: TalentModifierSource[] = [];
  const soundConstitution = entriesFor(talents, "sound-constitution").length;
  addCharacteristicSource(sources, `Sound Constitution${soundConstitution > 1 ? ` (${soundConstitution})` : ""}`, soundConstitution);

  if (sicariusEntry(talents, "Imperial Psyker")) {
    addCharacteristicSource(sources, "Sicarius Tutoring (Imperial Psyker)", 1);
  }

  for (const entry of entriesFor(talents, "purity-of-flesh")) {
    const loss = entry.acquisition?.purity?.woundsLoss ?? 0;
    addCharacteristicSource(sources, "Purity of Flesh", -loss);
  }
  return sources;
}

function grantsChemGeld(talents: TalentsAndTraitsBlock): boolean {
  if (entriesFor(talents, "chem-geld").length > 0) return true;
  return entriesFor(talents, "cult-briefing").some(
    (entry) => entry.acquisition?.grantedTalentId === "chem-geld"
  );
}

export function getTalentInsanityModifierSources(
  talents: TalentsAndTraitsBlock
): TalentModifierSource[] {
  return grantsChemGeld(talents)
    ? [{ name: "Chem Geld", type: "Talent", amount: 1 }]
    : [];
}

export interface TalentFateEffects {
  overrideTotal?: number;
  overrideSource?: string;
  modifierSources: TalentModifierSource[];
}

export function getTalentFateEffects(talents: TalentsAndTraitsBlock): TalentFateEffects {
  const modifierSources: TalentModifierSource[] = [];
  const touched = entriesFor(talents, "touched-by-the-fates").find(
    (entry) => entry.acquisition?.touchedByFatesPoints !== undefined
  );

  for (const purity of entriesFor(talents, "purity-of-flesh")) {
    const gained = purity.acquisition?.purity?.fatePointsGained ?? 0;
    if (gained <= 0) continue;
    modifierSources.push({ name: "Purity of Flesh", type: "Talent", amount: gained });
    const replaced = entriesFor(talents, "reformed-skin").some(
      (entry) =>
        entry.acquisition?.reformedSkinPurityReplacement &&
        entry.acquisition?.purityTalentEntryUid === purity.uid
    );
    if (replaced) {
      modifierSources.push({ name: "Reformed Skin", type: "Talent", amount: -gained });
    }
  }

  return {
    ...(touched
      ? {
          overrideTotal: touched.acquisition?.touchedByFatesPoints,
          overrideSource: "Touched by the Fates",
        }
      : {}),
    modifierSources,
  };
}

export interface TalentSkillEffects {
  characteristic?: keyof Characteristics;
  countsAsBasic?: boolean;
  minimumLevel?: SkillAdvanceLevel;
  modifier: number;
  sources: TalentModifierSource[];
}

function skillMatchesTalentChoice(skill: SkillEntry, entry: TalentEntry): boolean {
  return Boolean(
    entry.specialisation &&
    entry.specialisation.trim().toLocaleLowerCase() === skill.name.trim().toLocaleLowerCase()
  );
}

export function getTalentSkillEffects(
  talents: TalentsAndTraitsBlock,
  skill: SkillEntry
): TalentSkillEffects {
  const effects: TalentSkillEffects = { modifier: 0, sources: [] };

  for (const entry of entriesFor(talents, "talented")) {
    if (!skillMatchesTalentChoice(skill, entry)) continue;
    effects.modifier += 10;
    effects.sources.push({ name: entry.name, type: "Talent", amount: 10 });
  }

  if (skill.id === "silent-move" && entriesFor(talents, "machinator-array").length > 0) {
    effects.modifier -= 10;
    effects.sources.push({ name: "Machinator Array", type: "Talent", amount: -10 });
  }

  if (skill.category === "Common Lore" && cultEntry(talents, "Political")) {
    effects.countsAsBasic = true;
    effects.sources.push({ name: "Cult Briefing (Political): counts as Basic", type: "Talent", amount: 0 });
  }

  if (skill.id === "tech-use" && skill.level === "untrained" && cultEntry(talents, "Heretek")) {
    effects.minimumLevel = "trained";
    effects.sources.push({ name: "Cult Briefing (Heretek): Trained", type: "Talent", amount: 0 });
  }

  if (skill.id === "medicae" && skill.level === "untrained" && cultEntry(talents, "Infestation")) {
    effects.minimumLevel = "trained";
    effects.sources.push({ name: "Cult Briefing (Infestation): Trained", type: "Talent", amount: 0 });
  }

  if (skill.id === "deceive" && sicariusEntry(talents, "Adept")) {
    effects.characteristic = "int";
    effects.sources.push({ name: "Sicarius Tutoring (Adept): uses Intelligence", type: "Talent", amount: 0 });
  }
  if (skill.id === "inquiry" && sicariusEntry(talents, "Tech-Priest")) {
    effects.characteristic = "int";
    effects.sources.push({ name: "Sicarius Tutoring (Tech-Priest): uses Intelligence", type: "Talent", amount: 0 });
  }
  if (skill.id === "shadowing" && sicariusEntry(talents, "Arbitrator")) {
    effects.modifier += 10;
    effects.sources.push({ name: "Sicarius Tutoring (Arbitrator)", type: "Talent", amount: 10 });
  }
  if (skill.id === "concealment" && sicariusEntry(talents, "Assassin")) {
    effects.modifier += 10;
    effects.sources.push({ name: "Sicarius Tutoring (Assassin)", type: "Talent", amount: 10 });
  }

  const traitEffects = getTraitSkillEffects(talents, skill);
  if (traitEffects.countsAsBasic) effects.countsAsBasic = true;
  if (traitEffects.minimumLevel) effects.minimumLevel = traitEffects.minimumLevel;
  effects.modifier += traitEffects.modifier;
  effects.sources.push(...traitEffects.sources);

  return effects;
}

function virtualGrant(
  origin: TalentEntry,
  talentId: string,
  name: string,
  specialisation?: string
): TalentEntry {
  return {
    uid: `grant:${origin.uid}:${talentId}:${specialisation ?? ""}`,
    talentId,
    name: specialisation ? `${name} (${specialisation})` : name,
    ...(specialisation ? { specialisation } : {}),
    grantedByTalentEntryUid: origin.uid,
    grantedByTalentName: origin.name,
  };
}

export function getGrantedTalentEntries(talents: TalentsAndTraitsBlock): TalentEntry[] {
  const grants: TalentEntry[] = [];
  for (const origin of entriesFor(talents, "the-power-within")) {
    grants.push(virtualGrant(origin, "resistance", "Resistance", "Psychic Powers"));
  }
  for (const origin of entriesFor(talents, "purity-of-flesh")) {
    grants.push(virtualGrant(origin, "gift-of-purity", "Gift of Purity"));
  }
  for (const origin of entriesFor(talents, "cult-briefing")) {
    const selectedId = origin.acquisition?.grantedTalentId;
    if (selectedId) {
      const reference = TALENT_LIST.find((talent) => talent.id === selectedId);
      grants.push(
        virtualGrant(
          origin,
          selectedId,
          origin.acquisition?.grantedTalentName ?? reference?.name ?? selectedId,
          origin.acquisition?.grantedTalentSpecialisation
        )
      );
    }
    if (hasChoice(origin, "Infestation")) grants.push(virtualGrant(origin, "hardy", "Hardy"));
    if (hasChoice(origin, "Blood")) grants.push(virtualGrant(origin, "frenzy", "Frenzy"));
  }
  for (const origin of entriesFor(talents, "sicarius-tutoring")) {
    if (hasChoice(origin, "Arbitrator")) grants.push(virtualGrant(origin, "talented", "Talented", "Shadowing"));
    if (hasChoice(origin, "Assassin")) grants.push(virtualGrant(origin, "talented", "Talented", "Concealment"));
    if (hasChoice(origin, "Battle Sister")) grants.push(virtualGrant(origin, "swift-attack", "Swift Attack"));
    if (hasChoice(origin, "Cleric")) grants.push(virtualGrant(origin, "disturbing-voice", "Disturbing Voice"));
    if (hasChoice(origin, "Scum") && origin.acquisition?.grantedTalentSpecialisation) {
      grants.push(virtualGrant(origin, "peer", "Peer", origin.acquisition.grantedTalentSpecialisation));
    }
  }
  for (const grant of getTraitGrantedTalentSpecs(talents)) {
    grants.push(virtualGrant(grant.origin, grant.id, grant.name, grant.specialisation));
  }
  return grants;
}

function normaliseTalentChoice(value?: string): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

/**
 * A purchase and a grant can provide the same Talent at the same time. Keep the
 * grant in acquisition data, but avoid showing a duplicate card until the
 * independently purchased copy is removed.
 */
export function getVisibleGrantedTalentEntries(
  talents: TalentsAndTraitsBlock
): TalentEntry[] {
  return getGrantedTalentEntries(talents).filter(
    (grant) => !talents.talents.some(
      (owned) =>
        owned.talentId === grant.talentId &&
        normaliseTalentChoice(owned.specialisation) === normaliseTalentChoice(grant.specialisation)
    )
  );
}

export function getGrantedTraitEntries(talents: TalentsAndTraitsBlock): TalentEntry[] {
  const grants: TalentEntry[] = [];
  const fleshRank = entriesFor(talents, "the-flesh-is-weak").length;
  if (fleshRank > 0) {
    const origin = entriesFor(talents, "the-flesh-is-weak")[fleshRank - 1];
    grants.push(virtualGrant(origin, "machine", "Machine", String(fleshRank)));
  }

  for (const origin of entriesFor(talents, "cult-briefing")) {
    if (!hasChoice(origin, "Culture")) continue;
    const homeworld = HOMEWORLD_LIST.find((item) => item.id === origin.acquisition?.homeworldId);
    for (const [index, trait] of (homeworld?.traits ?? []).entries()) {
      grants.push({
        uid: `grant:${origin.uid}:homeworld:${index}`,
        talentId: `homeworld-trait:${homeworld?.id}:${index}`,
        name: trait.name,
        notes: `${trait.effectLabel}: ${trait.effect}`,
        grantedByTalentEntryUid: origin.uid,
        grantedByTalentName: `Cult Briefing (Culture: ${homeworld?.name})`,
      });
    }
  }
  return grants;
}

export function getGrantedWeaponTrainingIds(
  talents: TalentsAndTraitsBlock
): WeaponTrainingTalentId[] {
  return [...new Set([...talents.talents
    .map((entry) => entry.acquisition?.weaponTrainingId)
    .filter((id): id is WeaponTrainingTalentId => Boolean(id)), ...getTraitGrantedWeaponTrainingIds(talents)])];
}

export function getGrantedExoticWeapons(talents: TalentsAndTraitsBlock): string[] {
  return talents.talents
    .map((entry) => entry.acquisition?.exoticWeapon?.trim())
    .filter((name): name is string => Boolean(name));
}

export function getMachineArmourSource(talents: TalentsAndTraitsBlock): TalentModifierSource | null {
  const rank = entriesFor(talents, "the-flesh-is-weak").length;
  return rank > 0
    ? { name: `The Flesh is Weak (${rank})`, type: "Talent", amount: rank }
    : null;
}
