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
