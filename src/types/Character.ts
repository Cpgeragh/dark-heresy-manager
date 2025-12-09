// src/types/Character.ts

import type { Timestamp } from "firebase/firestore";
import type { CharField } from "../utils/characterFactory";

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
  characteristic: keyof Characteristics;
  level: SkillAdvanceLevel;
  miscModifier?: number;
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
  name: string;
  ap: number;
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
 * TALENTS + TRAINING + GEAR
 */
export interface TalentsAndTraitsBlock {
  homeworldBackground: string;
  advancesTalentsAndTraits: string;
}

export type WeaponTrainingTalentId =
  | "basic-bolt" | "basic-flame" | "basic-las" | "basic-launcher"
  | "basic-melta" | "basic-plasma" | "basic-primitive" | "basic-sp"
  | "pistol-bolt" | "pistol-flame" | "pistol-las" | "pistol-launcher"
  | "pistol-melta" | "pistol-plasma" | "pistol-primitive" | "pistol-sp"
  | "melee-primitive" | "melee-chain" | "melee-shock" | "melee-power"
  | "exotic";

export interface WeaponTrainingBlock {
  trained: WeaponTrainingTalentId[];
  exoticNotes?: string;
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
  id: string;            // added by converter
  campaignId: string;    // stored in Firestore (Option A)

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
  armour: ArmourBlock;

  talentsAndTraits: TalentsAndTraitsBlock;
  gear: string[];

  weaponTraining: WeaponTrainingBlock;
  experience: ExperienceBlock;
  psychic: PsychicBlock;

  notes?: string;
}