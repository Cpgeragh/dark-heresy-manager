import type {
  ArcheotechItem,
  Character,
  CompanionItem,
  ConsumableItem,
  CorruptionBlock,
  CorruptionMalignancyEntry,
  CorruptionMutationEntry,
  CyberneticItem,
  DrugItem,
  GearItem,
  GrenadeItem,
  InsanityBlock,
  InsanityDisorderEntry,
  InsanityTraumaEntry,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  ShieldItem,
  SkillEntry,
  TalentsAndTraitsBlock,
  WornArmourPiece,
} from "../types/Character";

/** The lists of a character whose entries can carry the player's own note. */
export type PersonalNotesCollection =
  | "skills"
  | "talents"
  | "traits"
  | "eliteAdvances"
  | "mutations"
  | "malignancies"
  | "disorders"
  | "trauma"
  | "gear"
  | "consumables"
  | "drugs"
  | "cybernetics"
  | "armour"
  | "archeotech"
  | "ranged"
  | "melee"
  | "grenades"
  | "shields"
  | "powers"
  | "companions";

/** The one character field to save, with its new value, after a personal note changes. */
export type PersonalNotesChange =
  | { field: "skills"; value: SkillEntry[] }
  | { field: "talentsAndTraits"; value: TalentsAndTraitsBlock }
  | { field: "corruption"; value: CorruptionBlock }
  | { field: "insanity"; value: InsanityBlock }
  | { field: "gear"; value: GearItem[] }
  | { field: "consumables"; value: ConsumableItem[] }
  | { field: "drugs"; value: DrugItem[] }
  | { field: "cybernetics"; value: CyberneticItem[] }
  | { field: "armour"; value: WornArmourPiece[] }
  | { field: "archeotech"; value: ArcheotechItem[] }
  | { field: "rangedWeapons"; value: RangedWeapon[] }
  | { field: "meleeWeapons"; value: MeleeWeapon[] }
  | { field: "grenades"; value: GrenadeItem[] }
  | { field: "shields"; value: ShieldItem[] }
  | { field: "psychic"; value: PsychicBlock }
  | { field: "companions"; value: CompanionItem[] };

interface HasPersonalNotes {
  personalNotes?: string;
}

function withNotes<T extends HasPersonalNotes>(entry: T, text: string): T {
  const { personalNotes: _previous, ...rest } = entry;
  const notes = text.trim();
  return (notes ? { ...rest, personalNotes: notes } : rest) as T;
}

function replaceEntry<T extends HasPersonalNotes>(
  list: readonly T[],
  matches: (entry: T) => boolean,
  text: string
): T[] | null {
  if (!list.some(matches)) return null;
  return list.map((entry) => (matches(entry) ? withNotes(entry, text) : entry));
}

/** Keeps the player's note on an entry that is rebuilt from a custom item definition. */
export function keepPersonalNotes<T extends HasPersonalNotes>(
  rebuilt: T,
  previous: HasPersonalNotes
): T {
  return previous.personalNotes ? { ...rebuilt, personalNotes: previous.personalNotes } : rebuilt;
}

/** Works out the character change that sets one entry's personal note, or null when the entry is not on the character. */
export function buildPersonalNotesChange(
  character: Character,
  collection: PersonalNotesCollection,
  id: string,
  text: string
): PersonalNotesChange | null {
  switch (collection) {
    case "skills": {
      const value = replaceEntry(character.skills, (entry) => entry.id === id, text);
      return value ? { field: "skills", value } : null;
    }
    case "talents":
    case "traits": {
      const block = character.talentsAndTraits;
      const next = replaceEntry(block[collection], (entry) => entry.uid === id, text);
      return next ? { field: "talentsAndTraits", value: { ...block, [collection]: next } } : null;
    }
    case "eliteAdvances": {
      const block = character.talentsAndTraits;
      const next = replaceEntry(block.eliteAdvances ?? [], (entry) => entry.uid === id, text);
      return next ? { field: "talentsAndTraits", value: { ...block, eliteAdvances: next } } : null;
    }
    case "mutations": {
      const block = character.corruption;
      const minor = replaceEntry<CorruptionMutationEntry>(
        block.minorMutations ?? [],
        (entry) => entry.id === id,
        text
      );
      if (minor) return { field: "corruption", value: { ...block, minorMutations: minor } };
      const major = replaceEntry<CorruptionMutationEntry>(
        block.majorMutations ?? [],
        (entry) => entry.id === id,
        text
      );
      return major ? { field: "corruption", value: { ...block, majorMutations: major } } : null;
    }
    case "malignancies": {
      const block = character.corruption;
      if (typeof block.malignancies === "string") return null;
      const next = replaceEntry<CorruptionMalignancyEntry>(
        block.malignancies,
        (entry) => entry.id === id,
        text
      );
      return next ? { field: "corruption", value: { ...block, malignancies: next } } : null;
    }
    case "disorders": {
      const block = character.insanity;
      if (typeof block.disorders === "string") return null;
      const next = replaceEntry<InsanityDisorderEntry>(
        block.disorders,
        (entry) => entry.id === id,
        text
      );
      return next ? { field: "insanity", value: { ...block, disorders: next } } : null;
    }
    case "trauma": {
      const block = character.insanity;
      const next = replaceEntry<InsanityTraumaEntry>(
        block.currentTrauma ?? [],
        (entry) => entry.id === id,
        text
      );
      return next ? { field: "insanity", value: { ...block, currentTrauma: next } } : null;
    }
    case "gear": {
      const value = replaceEntry(character.gear, (entry) => entry.id === id, text);
      return value ? { field: "gear", value } : null;
    }
    case "consumables": {
      const value = replaceEntry(character.consumables ?? [], (entry) => entry.id === id, text);
      return value ? { field: "consumables", value } : null;
    }
    case "drugs": {
      const value = replaceEntry(character.drugs ?? [], (entry) => entry.id === id, text);
      return value ? { field: "drugs", value } : null;
    }
    case "cybernetics": {
      const value = replaceEntry(character.cybernetics ?? [], (entry) => entry.id === id, text);
      return value ? { field: "cybernetics", value } : null;
    }
    case "armour": {
      const value = replaceEntry(character.armour, (entry) => entry.id === id, text);
      return value ? { field: "armour", value } : null;
    }
    case "archeotech": {
      const value = replaceEntry(character.archeotech ?? [], (entry) => entry.id === id, text);
      return value ? { field: "archeotech", value } : null;
    }
    case "ranged": {
      const value = replaceEntry(character.rangedWeapons, (entry) => entry.id === id, text);
      return value ? { field: "rangedWeapons", value } : null;
    }
    case "melee": {
      const value = replaceEntry(character.meleeWeapons, (entry) => entry.id === id, text);
      return value ? { field: "meleeWeapons", value } : null;
    }
    case "grenades": {
      const value = replaceEntry(character.grenades ?? [], (entry) => entry.id === id, text);
      return value ? { field: "grenades", value } : null;
    }
    case "shields": {
      const value = replaceEntry(character.shields ?? [], (entry) => entry.id === id, text);
      return value ? { field: "shields", value } : null;
    }
    case "companions": {
      const value = replaceEntry(character.companions ?? [], (entry) => entry.id === id, text);
      return value ? { field: "companions", value } : null;
    }
    case "powers": {
      const block = character.psychic;
      const minor = replaceEntry(block.minorPowers, (entry) => entry.id === id, text);
      if (minor) return { field: "psychic", value: { ...block, minorPowers: minor } };
      const major = replaceEntry(block.majorPowers, (entry) => entry.id === id, text);
      return major ? { field: "psychic", value: { ...block, majorPowers: major } } : null;
    }
  }
}
