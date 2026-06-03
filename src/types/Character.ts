// src/types/Character.ts

import type { Timestamp } from "firebase/firestore";
import type { CharField } from "../utils/characterFactory";
import { SkillSource } from "./SkillSource";   // ← NEW

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

export interface InsanityBlock {
  points: number;
  disorders: string;
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

/**
 * A single ammo type carried for a ranged weapon.
 * A weapon can carry multiple types simultaneously (e.g. standard + specialist).
 * One entry is marked `loaded` — the currently chambered type.
 */
export interface WeaponAmmoEntry {
  id: string;           // unique per entry (crypto.randomUUID())
  referenceId?: string; // AmmoRef.id if created from reference data
  name: string;         // e.g. "Bolt Shells", "Psybolt Ammunition"
  clips: number;        // full clips/magazines carried, including the loaded clip
  rounds: number;       // loose individual rounds carried
  loaded: boolean;      // true = currently chambered
}

export interface RangedWeapon {
  id: string;
  referenceId?: string;   // set when created from RANGED_WEAPON_REFERENCE
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
  rarity?: string;
  source?: string;        // e.g. "CR", "BoJ" — which book to look this up in
  custom?: boolean;       // true when created via "Add Custom"
  attachments?: string[]; // WeaponUpgradeRef.id values for fitted upgrades
  ammoEntries?: WeaponAmmoEntry[]; // ammo types carried; one marked loaded
  quantity?: number;      // for thrown weapons (bolas, throwing stars) — how many carried
  description?: string;   // rules text copied from reference data when needed
}

export interface MeleeWeapon {
  id: string;
  referenceId?: string;   // set when created from MELEE_WEAPON_REFERENCE
  name: string;
  class?: string;
  damage?: string;
  pen?: string;
  specialRules?: string;
  weight?: string;
  value?: string;
  rarity?: string;
  source?: string;
  custom?: boolean;
  attachments?: string[]; // WeaponUpgradeRef.id values for fitted upgrades
  quantity?: number;      // for thrown melee weapons (knives, spears) — how many carried
}

export interface ShieldItem {
  id: string;
  referenceId?: string;   // set when created from SHIELD_REFERENCE
  name: string;
  /** AP provided while actively using the shield */
  ap: number;
  /** Human-readable locations covered, e.g. "Arm & Body" */
  locations?: string;
  damage?: string;        // melee bash damage
  pen?: string;
  specialRules?: string;
  notes?: string;         // full rules text
  weight?: string;
  value?: string;
  rarity?: string;
  source?: string;
  custom?: boolean;
}

/**
 * ARMOUR
 *
 * Characters carry a list of armour pieces rather than a fixed location block.
 * This supports layering (e.g. underarmour beneath carapace) and lets players
 * stow looted pieces without discarding them.
 */
export type ArmourLocationKey =
  | "head"
  | "body"
  | "rightArm"
  | "leftArm"
  | "rightLeg"
  | "leftLeg";

export interface WornArmourPiece {
  id: string;
  referenceId?: string;   // links back to ArmourRef.id
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
  rarity?: string;
  source?: string;
  custom?: boolean;       // true when created via "Add Custom"
  /** true for force fields — no locations or AP, tracked separately in the Armour tab */
  isForceField?: boolean;
  /** Protection Rating for force fields */
  protectionRating?: number;
}

/**
 * CYBERNETICS
 */
export type CyberneticCraftsmanship = "Poor" | "Common" | "Good";

export interface CyberneticItem {
  id: string;
  referenceId?: string;  // links back to CyberneticRef.id
  name: string;
  craftsmanship: CyberneticCraftsmanship;
  notes?: string;        // player-added notes
  value?: string;
  rarity?: string;
  source?: string;
  /** Specific body locations where this implant is installed (e.g. ["rightArm"]) */
  bodyLocation?: ArmourLocationKey[];
}

/**
 * GEAR
 */
export interface GearItem {
  id: string;
  referenceId?: string;   // links back to GearRef.id
  name: string;
  description?: string;
  weight?: string;
  value?: string;
  rarity?: string;
  source?: string;
}

/**
 * ARCHEOTECH
 */
export interface ArcheotechItem {
  id: string;
  referenceId?: string;   // links back to ArcheotechRef.id
  name: string;
  /** Broad category: "Weapon", "Device", "Tool", "Other" */
  type?: string;
  description?: string;
  /** Player-added notes separate from the rules description */
  notes?: string;
  weight?: string;
  value?: string;
  rarity?: string;
  source?: string;
}

/**
 * DRUGS
 */
export interface DrugItem {
  id: string;
  referenceId?: string;  // links back to DrugRef.id
  name: string;
  quantity: number;
  value?: string;
  rarity?: string;
  source?: string;
  notes?: string;        // player-added notes
}

/**
 * CONSUMABLES
 */
export interface ConsumableItem {
  id: string;
  referenceId?: string;  // links back to ConsumableRef.id
  name: string;
  quantity: number;
  description?: string;
  weight?: string;
  value?: string;        // cost per dose/unit
  rarity?: string;
  source?: string;
}

/**
 * AMMUNITION
 */
export interface AmmoItem {
  id: string;
  referenceId?: string;     // links back to AmmoRef.id
  name: string;
  compatibleWith?: string;  // e.g. "Bolt", "SP Pistol" — free text
  amount: number;
  weight?: string;
  value?: string;
  rarity?: string;
  source?: string;
  description?: string;     // game-mechanical effects for special ammo
}

/**
 * GRENADES
 */
export interface GrenadeItem {
  id: string;
  referenceId?: string;  // links back to GrenadeRef.id
  name: string;
  quantity: number;
  class?: string;
  damage?: string;
  pen?: string;
  specialRules?: string;
  weight?: string;
  value?: string;        // cost per grenade
  rarity?: string;
  source?: string;
}

/**
 * TALENTS + TRAINING
 */

/** A single talent or trait instance on a character sheet. */
export interface TalentEntry {
  uid: string;             // unique per-character instance (crypto.randomUUID())
  talentId: string;        // references TalentData.id or TraitData.id
  name: string;            // display name, e.g. "Hatred (Heretics)"
  specialisation?: string; // chosen value when hasSpecialisation is true
  notes?: string;          // optional player notes
}

export interface TalentsAndTraitsBlock {
  homeworld: string;        // HomeworldId (e.g. "hive-world") or "" if unset
  homeworldNotes?: string;  // optional freeform background notes
  talents: TalentEntry[];
  traits: TalentEntry[];
}

export type WeaponTrainingTalentId =
  | "basic-bolt" | "basic-flame" | "basic-las" | "basic-launcher"
  | "basic-melta" | "basic-plasma" | "basic-primitive" | "basic-sp"
  | "heavy-bolt" | "heavy-flame" | "heavy-las" | "heavy-launcher"
  | "heavy-melta" | "heavy-plasma" | "heavy-primitive" | "heavy-sp"
  | "pistol-bolt" | "pistol-flame" | "pistol-las" | "pistol-launcher"
  | "pistol-melta" | "pistol-plasma" | "pistol-primitive" | "pistol-sp"
  | "melee-primitive" | "melee-chain" | "melee-shock" | "melee-power"
  | "thrown-primitive" | "thrown-chain" | "thrown-shock" | "thrown-power";

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
  isMinor?: boolean;
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
  /** @deprecated Ammo is now tracked per-weapon on RangedWeapon.ammoAmount. Kept optional for Firestore backwards compat. */
  ammo?: AmmoItem[];
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
}
