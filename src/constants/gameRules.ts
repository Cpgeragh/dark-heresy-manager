// src/constants/gameRules.ts

/**
 * Dark Heresy Game Mechanics Constants
 *
 * These values are derived from the Dark Heresy rulebook
 * and should only be changed if the game rules change.
 */

// ============================================
// CHARACTERISTIC CALCULATIONS
// ============================================

/**
 * Divisor for calculating characteristic bonus
 * Bonus = floor(characteristic / 10)
 */
export const CHARACTERISTIC_BONUS_DIVISOR = 10;

export const MAX_CHARACTERISTIC_VALUE = 100;
export const MIN_CHARACTERISTIC_VALUE = 0;
export const MAX_CHARACTERISTIC_ADVANCES = 4;
export const CHARACTERISTIC_ADVANCE_INCREMENT = 5;

// ============================================
// WOUNDS & FATE
// ============================================

export const WOUNDS_CRITICAL_THRESHOLD = 3;
export const FATE_CRITICAL_THRESHOLD = 0;

// ============================================
// SKILL CALCULATIONS
// ============================================

/** Used for opposed tests. */
export const SKILL_HALF_DIVISOR = 2;

// ============================================
// SKILL ADVANCEMENT COSTS
// ============================================

export const SKILL_ADVANCE_VALUES = {
  untrained: 0,
  trained: 0,
  "+10": 10,
  "+20": 20,
} as const;

// ============================================
// MOVEMENT CALCULATIONS
// ============================================

/**
 * Movement is based on Agility Bonus (AB)
 */
export const MOVEMENT_HALF_MULTIPLIER = 1;
export const MOVEMENT_FULL_MULTIPLIER = 2;
export const MOVEMENT_CHARGE_MULTIPLIER = 3;
export const MOVEMENT_RUN_MULTIPLIER = 6;
