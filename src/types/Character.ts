// src/types/character.ts

import type { Timestamp } from "firebase/firestore";
import type { CharField } from "../utils/defaultCharacter";

/**
 * CAMPAIGN
 * Root-level document in /campaigns
 */
export interface Campaign {
  id: string;
  name: string;
  dmId: string; // UID of DM
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * CHARACTERISTICS
 * Matches the circles + 4 advance boxes on the sheet.
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
 * Each row on the skills area.
 * level: "untrained" | "trained" | "+10" | "+20"
 */
export type SkillAdvanceLevel = "untrained" | "trained" | "+10" | "+20";

export interface SkillEntry {
  id: string; // stable key, e.g. "awareness"
  name: string; // display name, e.g. "Awareness"
  characteristic: keyof Characteristics; // "per", "int", etc.
  level: SkillAdvanceLevel;
  miscModifier?: number; // optional extra modifier
  notes?: string;
}

/**
 * WOUNDS / FATE / INSANITY / CORRUPTION / MOVEMENT
 * All from page 1.
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
  disorders: string; // free-text
}

export interface CorruptionBlock {
  points: number;
  malignancies: string; // free-text
}

export interface MovementBlock {
  half: number;
  full: number;
  charge: number;
  run: number;
}

/**
 * WEAPONS + ARMOUR (page 2)
 */

export interface RangedWeapon {
  id: string;
  name: string;
  class?: string;
  damage?: string;
  type?: string;
  pen?: string;
  range?: string;
  rof?: string;
  clip?: string;
  rld?: string;
  specialRules?: string;
}

export interface MeleeWeapon {
  id: string;
  name: string;
  class?: string;
  damage?: string;
  type?: string;
  pen?: string;
  specialRules?: string;
}

export interface ArmourLocation {
  name: string; // Head, Body, Right Arm, etc.
  ap: number;   // armour points
  type?: string;
}

export interface ArmourBlock {
  head: ArmourLocation;
  body: ArmourLocation;
  rightArm: ArmourLocation;
  leftArm: ArmourLocation;
  rightLeg: ArmourLocation;
  leftLeg: ArmourLocation;
}

/**
 * TALENTS / GEAR / WEAPON TRAINING (page 2 bottom)
 */

export interface TalentsAndTraitsBlock {
  homeworldBackground: string;
  advancesTalentsAndTraits: string;
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
  | "exotic"; // plus free-text below

export interface WeaponTrainingBlock {
  trained: WeaponTrainingTalentId[];
  exoticNotes?: string;
}

/**
 * ADVANCES + XP (page 3)
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
 * PSYCHIC POWERS (pages 4–5)
 */

export interface PsychicPower {
  id: string;
  name: string;
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
  discipline?: string;
  minorPowers: PsychicPower[];
  majorPowers: PsychicPower[];
}

/**
 * CHARACTER HEADER (top of page 1)
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
 * MAIN CHARACTER DOCUMENT
 * This is what lives in /campaigns/{campaignId}/characters/{characterId}
 */
export interface Character {
  id: string;              // firestore doc id
  campaignId: string;      // convenience; also encoded in path

  // Ownership / permissions
  userId: string | null;
  recoveryCode: string;
  isEditableByPlayer: boolean;

  // Metadata
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  // Sheet content
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
  armour: ArmourBlock;

  talentsAndTraits: TalentsAndTraitsBlock;
  gear: string[]; // simple list of lines

  weaponTraining: WeaponTrainingBlock;
  experience: ExperienceBlock;
  psychic: PsychicBlock;

  // Free-form area used in your current UI
  notes?: string;
}