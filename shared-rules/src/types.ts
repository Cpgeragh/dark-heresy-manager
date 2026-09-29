// shared-rules/src/types.ts
// Narrow, local types covering only the shapes this package's rule logic actually
// touches, not the full app Character type. Deliberate: functions/ cannot import
// src/types/Character.ts (outside its own rootDir), and type drift here is a
// compile-time-only risk, not the runtime data-correctness risk this package exists
// to close. Keep these in sync with src/types/Character.ts by hand when either changes.

export type CharacteristicAdvanceTier = "simple" | "intermediate" | "trained" | "expert";

export interface XpPurchaseRecord {
  cost: number;
  careerId?: string;
  sourceRankId?: string;
  purchasedAtRankId?: string;
}

export interface CharField {
  base: number;
  advances: number;
  advancePurchases?: Partial<Record<CharacteristicAdvanceTier, XpPurchaseRecord>>;
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

/** The minimal shape of a character this package's characteristic-cost logic reads. */
export interface CharacterForCharacteristicCosts {
  characteristics: Characteristics;
  header: { career?: string };
}

export type SkillAdvanceLevel = "untrained" | "trained" | "+10" | "+20";

/** The minimal shape of an owned skill this package's skill-cost logic reads. */
export interface SkillEntryForCost {
  id: string;
  level: SkillAdvanceLevel;
  manualCosts?: Partial<Record<Exclude<SkillAdvanceLevel, "untrained">, number>>;
  xpPurchases?: Partial<Record<Exclude<SkillAdvanceLevel, "untrained">, XpPurchaseRecord>>;
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

/** The minimal shape of a character this package's skill-cost logic reads. */
export interface CharacterForSkillCosts {
  skills: SkillEntryForCost[];
}
