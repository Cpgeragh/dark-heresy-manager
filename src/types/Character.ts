// src/types/Character.ts

import type { Timestamp } from "firebase/firestore";
import { SkillSource } from "./SkillSource";
import type { CustomItemOrigin } from "../constants/customItems";

/**
 * CHARACTERISTICS
 */
export interface CharField {
  base: number;
  advances: number;
  /** Paid XP and rank attribution for each purchased Characteristic Advance tier. */
  advancePurchases?: Partial<Record<CharacteristicAdvanceTier, XpPurchaseRecord>>;
}

export type CharacteristicAdvanceTier = "simple" | "intermediate" | "trained" | "expert";

/**
 * Immutable accounting metadata captured when an XP purchase is confirmed.
 * Career-table purchases use sourceRankId; purchases without a named table
 * source use purchasedAtRankId.
 */
export interface XpPurchaseRecord {
  cost: number;
  careerId?: string;
  sourceRankId?: string;
  purchasedAtRankId?: string;
}

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

  // Source book for this skill
  source: SkillSource;

  // User-entered notes
  notes?: string;

  /** XP cost paid for tiers bought off the career table, keyed by the tier reached. */
  manualCosts?: Partial<Record<Exclude<SkillAdvanceLevel, "untrained">, number>>;
  /** Exact paid cost and rank attribution for each purchased tier. */
  xpPurchases?: Partial<Record<Exclude<SkillAdvanceLevel, "untrained">, XpPurchaseRecord>>;
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
  source?: string; // a custom disorder's own origin (Custom / 2nd Ed)
}

export interface InsanityTraumaEntry {
  id: string;
  referenceId?: string;
  roll?: string;
  name?: string;
  effect?: string;
  notes?: string;
  custom?: boolean;
  source?: string; // a custom trauma's own origin (Custom / 2nd Ed)
}

export interface InsanityBlock {
  points: number;
  disorders: string | InsanityDisorderEntry[];
  disorderNotes?: string;
  currentTrauma?: InsanityTraumaEntry[];
}

export interface CorruptionMalignancyEntry {
  id: string;
  referenceId?: string;
  roll?: string;
  name: string;
  effect?: string;
  notes?: string;
  custom?: boolean;
  source?: string; // a custom malignancy's own origin (Custom / 2nd Ed)
  rolledModifiers?: Record<string, number>;
}

export interface CorruptionMutationEntry {
  id: string;
  referenceId?: string;
  roll?: string;
  name: string;
  effect?: string;
  notes?: string;
  custom?: boolean;
  source?: string; // a custom mutation's own origin (Custom / 2nd Ed)
  rolledModifiers?: Record<string, number>;
}

export interface CorruptionBlock {
  points: number;
  malignancies: string | CorruptionMalignancyEntry[];
  malignancyNotes?: string;
  minorMutations?: CorruptionMutationEntry[];
  majorMutations?: CorruptionMutationEntry[];
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
  profile?: string; // firing profile this ammunition belongs to; omitted for ordinary single-profile weapons
  clips: number; // full clips/magazines carried, including the loaded clip
  rounds: number; // loose individual rounds carried
  loaded: boolean; // true = currently chambered
}

/** One fixed magazine fitted to a weapon with an internal magazine selector. */
export interface WeaponMagazineSlot {
  id: string;
  referenceId?: string;
  name?: string;
  rounds: number;
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
  loadedAmmoByProfile?: Record<string, string>; // ammo-entry id selected for each firing profile
  magazineSlots?: WeaponMagazineSlot[]; // fixed internal magazines, when supplied by the weapon
  activeMagazineSlotId?: string; // the currently selected internal magazine
  ammoTracking?: "clip" | "loose"; // clip = spare clips plus partial rounds; loose = rounds only
  ammoType?: string; // custom/reference ammo family label used for chip display and ammo filtering
  quantity?: number; // for thrown weapons (bolas, throwing stars) — how many carried
  description?: string; // rules text copied from reference data when needed
  integrated?: boolean; // true for custom built-in weapons without a reference id
  equipped?: boolean; // true = carried on body, shown expanded and pinned to top
  concealedBionic?: { cyberneticId: string; craftsmanship: CyberneticCraftsmanship };
}

export interface MeleeWeapon extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // set when created from MELEE_WEAPON_REFERENCE
  name: string;
  class?: string;
  damage?: string;
  pen?: string;
  specialRules?: string;
  /** Multiplier applied to Strength Bonus for total melee Damage (Power Fist = 2). */
  strengthBonusMultiplier?: number;
  weight?: string;
  value?: string;
  availability?: string;
  source?: string;
  custom?: boolean;
  craftsmanship?: WeaponCraftsmanship;
  upgrades?: string[]; // WeaponUpgradeRef.id values for fitted upgrades
  quantity?: number; // for thrown melee weapons (knives, spears) — how many carried
  alternateRangedAmmoEntries?: WeaponAmmoEntry[]; // ammunition carried for a built-in ranged profile
  loadedAlternateRangedAmmoId?: string; // selected entry for a built-in ranged profile
  alternateRangedAmmoReferenceId?: string; // loaded ammunition for a built-in ranged profile
  description?: string; // custom rules text separate from qualities
  integrated?: boolean; // true for custom built-in weapons without a reference id
  equipped?: boolean; // true = carried on body, shown expanded and pinned to top
  concealedBionic?: { cyberneticId: string; craftsmanship: CyberneticCraftsmanship };
}

export type StandardCraftsmanship = "Poor" | "Common" | "Good" | "Best";
export type WeaponCraftsmanship = StandardCraftsmanship;

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

export type ArmourCraftsmanship = StandardCraftsmanship;

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
  /** ArmourUpgradeRef.id values for upgrades fitted to this piece. */
  upgrades?: string[];
  qualities?: ArmourQuality[];
  custom?: boolean; // true when created via "Add Custom"
  /** true for force fields — no locations or AP, tracked separately in the Armour tab */
  isForceField?: boolean;
  /** Protection Rating for force fields */
  protectionRating?: number;
  /** Spare replacement power cells carried, for force fields that don't recharge (e.g. Refractor Field). */
  spareCells?: number;
}

export interface CompanionItem {
  id: string;
  /** Links back to CompanionRef.id. */
  referenceId: string;
  name: string;
  source?: string;
}

/**
 * CYBERNETICS
 */
export type CyberneticCraftsmanship = Exclude<StandardCraftsmanship, "Best">;

export interface CyberneticItem extends CustomLibraryLinkFields {
  id: string;
  referenceId?: string; // links back to CyberneticRef.id
  name: string;
  craftsmanship?: CyberneticCraftsmanship;
  notes?: string; // player-added notes
  value?: string;
  availability?: string;
  source?: string;
  /** Specific body locations where this implant is installed (e.g. ["rightArm"]) */
  bodyLocation?: ArmourLocationKey[];
  concealedWeapon?: { armId: string; weaponId: string; weaponType: "ranged" | "melee" };
  grantedByTalentEntryUid?: string;
  grantedByTalentName?: string;
  grantedByType?: "Talent" | "Trait" | "Career" | "Homeworld";
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
  grantedByTalentEntryUid?: string;
  grantedByTalentName?: string;
  grantedByType?: "Talent" | "Trait" | "Career" | "Homeworld";
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
export interface TalentAcquisitionDetails {
  /** Extra Talent granted by this purchase, when the top-level specialisation is already in use. */
  grantedTalentId?: string;
  grantedTalentName?: string;
  grantedTalentSpecialisation?: string;
  /** Weapon Training granted by Cult Briefing or Sicarius Tutoring. */
  weaponTrainingId?: WeaponTrainingTalentId;
  exoticWeapon?: string;
  /** Home World selected by Cult Briefing (Culture). */
  homeworldId?: string;
  /** Required choices and rolls belonging to Traits granted by that Home World. */
  homeworldTraitChoices?: HomeworldTraitChoices;
  /** Augmetic selected by Cult Briefing (Heretek). */
  augmeticName?: string;
  augmeticReferenceId?: string;
  /** Willpower Bonus fixed at the time a Psy Rating Talent is purchased. */
  psyRatingWillpowerBonus?: number;
  psyRatingMinorPowerGrants?: number;
  psyRatingMajorPowerGrants?: number;
  psyRatingDiscipline?: string;
  psyRatingNewDiscipline?: boolean;
  /** Fate Points calculated when Touched by the Fates is purchased. */
  touchedByFatesPoints?: number;
  /** Purity of Flesh decisions and rolled losses. */
  purity?: {
    removedCyberneticIds: string[];
    removedCybernetics?: CyberneticItem[];
    /** Integrated weapons removed from the character by Purity of Flesh. */
    removedIntegratedRangedWeapons?: RangedWeapon[];
    removedIntegratedMeleeWeapons?: MeleeWeapon[];
    /** Archeotech cybernetics and integrated weapons removed by Purity of Flesh. */
    removedArcheotech?: ArcheotechItem[];
    /** Concealed-weapon links cleared when their cybernetic was removed. */
    removedConcealedWeaponLinks?: Array<{
      weaponId: string;
      weaponType: "ranged" | "melee";
      cyberneticId: string;
      craftsmanship: CyberneticCraftsmanship;
    }>;
    qualifyingBionicsRemoved: number;
    fatePointsGained: number;
    toughnessLoss?: number;
    woundsLoss?: number;
  };
  /** Whether this replacement reverses Fate gained from Purity of Flesh. */
  reformedSkinPurityReplacement?: boolean;
  purityTalentEntryUid?: string;
  /** Marks that Rite of Pure Thought's GM-led disorder review was completed. */
  riteOfPureThoughtReviewed?: boolean;
  riteOriginalDisorders?: InsanityDisorderEntry[];
  riteReplacementDisorderIds?: string[];
  /** Choices and fixed rolls made when a Trait is acquired directly. */
  trait?: TraitAcquisitionDetails;
}

export interface SkinOfIronGrant {
  rank: 1 | 3 | 5 | 7;
  kind: "new" | "upgrade";
  cyberneticId: string;
  cyberneticReferenceId?: string;
  previousCraftsmanship?: CyberneticCraftsmanship;
}

export interface SanctioningAcquisition {
  resultId: string;
  resultName: string;
  rolledValue?: number;
  ageIncrease?: number;
  thronesGained?: number;
}

export interface TraitAcquisitionDetails {
  soulBound?: {
    entity: string;
    consequence: "insanity" | "blindness" | "characteristic" | "mutation";
    characteristic?: keyof Characteristics;
    rolledValue?: number;
    mutationName?: string;
  };
  blankSlateSkillIds?: string[];
  sanctioning?: SanctioningAcquisition;
  skinOfIronGrants?: SkinOfIronGrant[];
}

export interface HomeworldTraitChoices {
  /** Noble Born — second Peer group granted by Supremely Connected. */
  peerGroup?: string;
  /** Schola Progenium — Las or SP selections granted by Skill at Arms. */
  basicWeaponGroup?: "Las" | "SP";
  pistolWeaponGroup?: "Las" | "SP";
  /** Mind Cleansed — the once-only starting Insanity roll. */
  startingInsanity?: number;
}

export interface CareerStartingChoices {
  /** Selected option index per grant, keyed by the grant's position in CareerData.startingSkillGrants/startingTalentGrants. */
  skillChoices?: Record<number, number>;
  talentChoices?: Record<number, number>;
}

export interface TalentEntry extends CustomLibraryLinkFields {
  uid: string; // unique per-character instance (crypto.randomUUID())
  talentId: string; // references TalentData.id or TraitData.id
  name: string; // display name, e.g. "Hatred (Heretics)"
  specialisation?: string; // chosen value when hasSpecialisation is true
  notes?: string; // optional player notes
  description?: string; // a custom trait's own rules text
  source?: string; // a custom trait's own origin (Custom / 2nd Ed)
  acquisition?: TalentAcquisitionDetails;
  /** Hand-typed XP cost, only used when this entry has no real cost on the character's career table. */
  manualCost?: number;
  /** Exact paid cost and source/current-rank attribution for this purchase. */
  xpPurchase?: XpPurchaseRecord;
  /** Display-only provenance for a grant calculated from another purchase; never saved as a purchase. */
  grantedByTalentEntryUid?: string;
  grantedByTalentName?: string;
  grantedByType?: "Talent" | "Trait" | "Career" | "Homeworld";
}

export interface TalentsAndTraitsBlock {
  homeworld: string; // HomeworldId (e.g. "hive-world") or "" if unset
  homeworldNotes?: string; // optional freeform background notes
  homeworldTraitChoices?: HomeworldTraitChoices;
  /** Acquisition result for the Trait granted by the selected Career. */
  careerTraitAcquisition?: TraitAcquisitionDetails;
  /** Selected option per career starting skill/talent "or" choice. */
  careerStartingChoices?: CareerStartingChoices;
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
  exoticWeapons: WeaponTrainingExoticEntry[];
  /** DM-entered cost for a fixed group trained off the real career table. */
  manualCosts?: Partial<Record<WeaponTrainingTalentId, number>>;
  /** Exact paid cost and rank attribution for each purchased fixed group. */
  xpPurchases?: Partial<Record<WeaponTrainingTalentId, XpPurchaseRecord>>;
}

export interface WeaponTrainingExoticEntry {
  name: string;
  cost: number;
  /** Exotic training is manually priced, so it is attributed to the current rank. */
  xpPurchase?: XpPurchaseRecord;
  /** True if a DM granted this as a bonus, outside the character's unlocked slot count. */
  bonus?: boolean;
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

export interface XpTransaction {
  id: string;
  type: "add" | "spend";
  amount: number;
  reason?: string;
  /** Named Career rank active when the DM recorded this transaction. */
  rankId: string;
}

export interface ExperienceBlock {
  ranks: RankAdvances[];
  total: number;
  spent: number;
  /** DM-entered XP awards and manual spending, retained as an auditable ledger. */
  transactions?: XpTransaction[];
}

/**
 * PSYCHIC
 */
export interface PsychicPower extends CustomLibraryLinkFields {
  id: string;
  /** Character-only link to the exact Minor Psychic Power/Psychic Power purchase consumed. */
  talentEntryUid?: string;
  /** Psy Rating Talent purchase that granted this power selection. */
  psyRatingTalentEntryUid?: string;
  name: string;
  discipline?: string;
  threshold?: string;
  focusTime?: string;
  sustained?: string;
  range?: string;
  description?: string;
  source?: string;
  origin?: CustomItemOrigin;
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
  /** Stable branch label selected when this Career first splits. */
  careerPath?: string;
  homeWorld?: string;
  divination?: string;
  description?: string;
  age?: number;
  gender?: string;
  skin?: string;
  hair?: string;
  eyes?: string;
  height?: number;
  weight?: number;
  quirks?: string[];
}

/**
 * MAIN CHARACTER TYPE
 * Firestore stores everything except `id`.
 */
export interface NoteEntry {
  id: string;
  title: string;
  text: string;
  updatedAt: string; // ISO timestamp; drives newest-first sort
}

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
  companions?: CompanionItem[];

  weaponTraining: WeaponTrainingBlock;
  experience: ExperienceBlock;
  psychic: PsychicBlock;

  notes?: string | NoteEntry[];
  portraitUrl?: string;

  /** True once Homeworld, Career, and Rank have all been set at least once. */
  backgroundComplete?: boolean;
}
