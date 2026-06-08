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

/**
 * Wounds threshold for critical danger (red warning)
 */
export const WOUNDS_CRITICAL_THRESHOLD = 3;

/**
 * Fate points at zero is critical (red warning)
 */
export const FATE_CRITICAL_THRESHOLD = 0;

// ============================================
// SKILL THRESHOLDS
// ============================================

/**
 * Skill total considered "Expert" level (green)
 */
export const SKILL_EXPERT_THRESHOLD = 40;

/**
 * Skill total considered "Trained" level (amber)
 */
export const SKILL_TRAINED_THRESHOLD = 30;

/**
 * Skill total considered "Basic" level (white)
 */
export const SKILL_BASIC_THRESHOLD = 20;

// ============================================
// SKILL CALCULATIONS
// ============================================

/**
 * Divisor for calculating half skill value
 * Used for opposed tests
 */
export const SKILL_HALF_DIVISOR = 2;

/**
 * Below this threshold, skill is considered "Poor" (red)
 */
export const SKILL_POOR_THRESHOLD = 20;

// ============================================
// SKILL ADVANCEMENT COSTS
// ============================================

/**
 * Advance levels and their numeric equivalents
 */
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
export const MOVEMENT_HALF_MULTIPLIER = 1; // AB × 1
export const MOVEMENT_FULL_MULTIPLIER = 2; // AB × 2
export const MOVEMENT_CHARGE_MULTIPLIER = 3; // AB × 3
export const MOVEMENT_RUN_MULTIPLIER = 6; // AB × 6
