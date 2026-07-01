// src/types/Character.ts

import type { Timestamp } from "firebase/firestore";
import type { CharField } from "../utils/characterFactory";
import { SkillSource } from "./SkillSource"; // ← NEW

/**
 * CHARACTERISTICS
 */
export interface Characteristics {
  ws: CharField;
  bs: CharField;
  s: CharField;
  t: CharField;
  ag: CharField;
  int: CharField;
  per: CharField;
  wp: CharField;
  fel: CharField;
}

/**
 * SKILLS
 */
export type SkillAdvanceLevel = "untrained" | "trained" | "+10" | "+20";

export interface SkillEntry {
  id: string;
  name: string;

  // What characteristic determines this skill
  characteristic: keyof Characteristics;

  // Training level
  level: SkillAdvanceLevel;

  // Skill category (General, Common Lore, Trade, etc.)
  category: string;

  // Whether this is an Advanced Skill
  advanced: boolean;

  // NEW — which book this skill originates from
  source: SkillSource;

  // Optional bonus modifier
  miscModifier?: number;

  // User-entered notes
  notes?: string;
}

/**
 * PAGE 1 BLOCKS
 */
export interface WoundsBlock {
  total: number;
  current: number;
  criticalDamage: number;
  fatigue: number;
}

export interface FateBlock {
  total: number;
  current: number;
}

export type InsanityDisorderSeverity = "Minor" | "Severe" | "Acute";

export interface InsanityDisorderEntry {
  id: string;
  referenceId?: string;
  type: string;
  name: string;
  severity: InsanityDisorderSeverity;
  notes?: string;
  custom?: boolean;
}

export interface InsanityBlock {
  points: number;
  disorders: string | InsanityDisorderEntry[];
  disorderNotes?: string;
}

export interface CorruptionBlock {
  points: number;
  malignancies: string;
}

export interface MovementBlock {
  half: number;
  full: number;
  charge: number;
  run: number;
}

/**
 * WEAPONS + ARMOUR
 */

export interface CustomLibraryLinkFields {
  customLibraryId?: string;
  customLibraryVersionId?: string;
}

/**
 * A single ammo type carried for a ranged weapon.
 * A weapon can carry multiple types simultaneously (e.g. standard + specialist).
 * One entry is marked `loaded` — the currently chambered type.
 */
export interface WeaponAmmoEntry {
  id: string; // unique per entry (crypto.randomUUID())
  referenceId?: string; // AmmoRef.id if created from reference data
  name: string; // e.g. "Bolt Shells", "Psybolt Ammunition"
  clips: number; // full clips/magazines carried, including the loaded clip
  rounds: number; // loose individual rounds carried
  loaded: boolean; // true = currently chambered
}

export interface RangedWeapon extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // set when created from RANGED_WEAPON_REFERENCE
  name: string;
  class?: string;
  damage?: string;
  pen?: string;
  range?: string;
  rof?: string;
  clip?: string;
  rld?: string;
  specialRules?: string;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string; // e.g. "CR", "BoJ" — which book to look this up in
  custom?: boolean; // true when created via "Add Custom"
  craftsmanship?: WeaponCraftsmanship;
  upgrades?: string[]; // WeaponUpgradeRef.id values for fitted upgrades
  ammoEntries?: WeaponAmmoEntry[]; // ammo types carried; one marked loaded
  ammoTracking?: "clip" | "loose"; // clip = spare clips plus partial rounds; loose = rounds only
  ammoType?: string; // custom/reference ammo family label used for chip display and ammo filtering
  quantity?: number; // for thrown weapons (bolas, throwing stars) — how many carried
  description?: string; // rules text copied from reference data when needed
  integrated?: boolean; // true for custom built-in weapons without a reference id
  equipped?: boolean; // true = carried on body, shown expanded and pinned to top
}

export interface MeleeWeapon extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // set when created from MELEE_WEAPON_REFERENCE
  name: string;
  class?: string;
  damage?: string;
  pen?: string;
  specialRules?: string;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
  custom?: boolean;
  craftsmanship?: WeaponCraftsmanship;
  upgrades?: string[]; // WeaponUpgradeRef.id values for fitted upgrades
  quantity?: number; // for thrown melee weapons (knives, spears) — how many carried
  description?: string; // custom rules text separate from qualities
  integrated?: boolean; // true for custom built-in weapons without a reference id
  equipped?: boolean; // true = carried on body, shown expanded and pinned to top
}

export type WeaponCraftsmanship = "Poor" | "Common" | "Good" | "Best";

export interface ShieldItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // set when created from SHIELD_REFERENCE
  name: string;
  /** AP provided while actively using the shield */
  ap: number;
  /** Human-readable locations covered, e.g. "Arm & Body" */
  locations?: string;
  damage?: string; // melee bash damage
  pen?: string;
  specialRules?: string;
  notes?: string; // full rules text
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
  custom?: boolean;
  equipped?: boolean; // true = currently active shield
}

/**
 * ARMOUR
 *
 * Characters carry a list of armour pieces rather than a fixed location block.
 * This supports layering (e.g. underarmour beneath carapace) and lets players
 * stow looted pieces without discarding them.
 */
export type ArmourLocationKey = "head" | "body" | "rightArm" | "leftArm" | "rightLeg" | "leftLeg";

export type ArmourCraftsmanship = "Poor" | "Common" | "Good" | "Best";

export type ArmourQuality = "Primitive" | "Flak" | "Mesh" | "Sanctified" | "Powered" | "Overload";

export interface WornArmourPiece extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to ArmourRef.id
  name: string;
  /** Locations this piece covers */
  locations: ArmourLocationKey[];
  /** Base AP applied to all covered locations */
  ap: number;
  /** Per-location AP override when a piece is asymmetric */
  apOverrides?: Partial<Record<ArmourLocationKey, number>>;
  /** true = currently worn; false = stowed in pack */
  worn: boolean;
  notes?: string;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
  craftsmanship?: ArmourCraftsmanship;
  qualities?: ArmourQuality[];
  custom?: boolean; // true when created via "Add Custom"
  /** true for force fields — no locations or AP, tracked separately in the Armour tab */
  isForceField?: boolean;
  /** Protection Rating for force fields */
  protectionRating?: number;
}

/**
 * CYBERNETICS
 */
export type CyberneticCraftsmanship = "Poor" | "Common" | "Good";

export interface CyberneticItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to CyberneticRef.id
  name: string;
  craftsmanship: CyberneticCraftsmanship;
  notes?: string; // player-added notes
  value?: string;
  availability?: string;
  source?: string;
  /** Specific body locations where this implant is installed (e.g. ["rightArm"]) */
  bodyLocation?: ArmourLocationKey[];
}

/**
 * GEAR
 */
export interface GearItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to GearRef.id
  name: string;
  description?: string;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
}

/**
 * ARCHEOTECH
 */
export interface ArcheotechItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to ArcheotechRef.id
  name: string;
  type?: string;
  description?: string;
  notes?: string;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
  equipped?: boolean;
  // Weapon / Integrated Weapon / Grenade / Mine
  weaponClass?: "Ranged" | "Melee";
  damage?: string;
  range?: string;
  rof?: string;
  pen?: string;
  clip?: string;
  rld?: string;
  specialRules?: string;
  // Armour
  ap?: number;
  locations?: ArmourLocationKey[];
  stacks?: boolean;
  // Cybernetic
  craftsmanship?: CyberneticCraftsmanship;
  bodyLocation?: ArmourLocationKey[];
  // Force Field
  protectionRating?: number;
}

/**
 * DRUGS
 */
export interface DrugItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to DrugRef.id
  name: string;
  quantity: number;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
  notes?: string; // player-added notes
}

/**
 * CONSUMABLES
 */
export interface ConsumableItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to ConsumableRef.id
  name: string;
  quantity: number;
  description?: string;
  weight?: string;
  value?: string; // cost per dose/unit
  availability?: string;
  source?: string;
}

/**
 * GRENADES
 */
export interface GrenadeItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to GrenadeRef.id
  name: string;
  quantity: number;
  /** "Grenade" or "Mine" — used to exclude mines from launcher panels */
  type?: string;
  equipped?: boolean; // true = up to 3 shown in expanded card, remainder in stowed card
  class?: string;
  damage?: string;
  pen?: string;
  specialRules?: string;
  weight?: string;
  value?: string; // cost per grenade
  availability?: string;
  source?: string;
  description?: string; // custom rules text
  custom?: boolean;
}

/**
 * TALENTS + TRAINING
 */

/** A single talent or trait instance on a character sheet. */
export interface TalentEntry {
  uid: string; // unique per-character instance (crypto.randomUUID())
  talentId: string; // references TalentData.id or TraitData.id
  name: string; // display name, e.g. "Hatred (Heretics)"
  specialisation?: string; // chosen value when hasSpecialisation is true
  notes?: string; // optional player notes
}

export interface TalentsAndTraitsBlock {
  homeworld: string; // HomeworldId (e.g. "hive-world") or "" if unset
  homeworldNotes?: string; // optional freeform background notes
  talents: TalentEntry[];
  traits: TalentEntry[];
}

export type WeaponTrainingTalentId =
  | "basic-bolt"
  | "basic-flame"
  | "basic-las"
  | "basic-launcher"
  | "basic-melta"
  | "basic-plasma"
  | "basic-primitive"
  | "basic-sp"
  | "heavy-bolt"
  | "heavy-flame"
  | "heavy-las"
  | "heavy-launcher"
  | "heavy-melta"
  | "heavy-plasma"
  | "heavy-primitive"
  | "heavy-sp"
  | "pistol-bolt"
  | "pistol-flame"
  | "pistol-las"
  | "pistol-launcher"
  | "pistol-melta"
  | "pistol-plasma"
  | "pistol-primitive"
  | "pistol-sp"
  | "melee-primitive"
  | "melee-chain"
  | "melee-shock"
  | "melee-power"
  | "thrown-primitive"
  | "thrown-chain"
  | "thrown-shock"
  | "thrown-power";

export interface WeaponTrainingBlock {
  trained: WeaponTrainingTalentId[];
  exoticWeapons: string[]; // one entry per exotic weapon e.g. ["Needle Pistol"]
}

/**
 * EXPERIENCE
 */
export interface AdvanceEntry {
  id: string;
  name: string;
  cost: number;
  notes?: string;
}

export interface RankAdvances {
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | "elite";
  advances: AdvanceEntry[];
}

export interface ExperienceBlock {
  ranks: RankAdvances[];
  total: number;
  spent: number;
}

/**
 * PSYCHIC
 */
export interface PsychicPower {
  id: string;
  name: string;
  discipline?: string;
  threshold?: string;
  focusTime?: string;
  sustained?: string;
  range?: string;
  description?: string;
  source?: string;
  isMinor?: boolean;
  custom?: boolean;
  known: boolean;
}

export interface PsychicBlock {
  psyRating: number;
  disciplines?: string[];
  minorPowers: PsychicPower[];
  majorPowers: PsychicPower[];
}

/**
 * HEADER
 */
export interface CharacterHeader {
  characterName: string;
  playerName?: string;
  career?: string;
  rank?: string;
  homeWorld?: string;
  divination?: string;
  description?: string;
}

/**
 * MAIN CHARACTER TYPE
 * Firestore stores everything except `id`.
 */
export interface Character {
  id: string;
  campaignId: string;

  userId: string | null;
  recoveryCode: string;
  isEditableByPlayer: boolean;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  header: CharacterHeader;
  characteristics: Characteristics;
  skills: SkillEntry[];

  wounds: WoundsBlock;
  fate: FateBlock;
  insanity: InsanityBlock;
  corruption: CorruptionBlock;
  movement: MovementBlock;

  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  armour: WornArmourPiece[];

  talentsAndTraits: TalentsAndTraitsBlock;
  gear: GearItem[];
  consumables?: ConsumableItem[];
  drugs?: DrugItem[];
  grenades?: GrenadeItem[];
  shields?: ShieldItem[];
  cybernetics?: CyberneticItem[];
  archeotech?: ArcheotechItem[];

  weaponTraining: WeaponTrainingBlock;
  experience: ExperienceBlock;
  psychic: PsychicBlock;

  notes?: string;
  portraitUrl?: string;
}
