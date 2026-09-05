// src/constants/ui.ts

/**
 * UI/UX Constants
 *
 * These values control timing, animations, and user interface behavior.
 */

// ============================================
// TOAST NOTIFICATIONS
// ============================================

export const DEFAULT_TOAST_DURATION = 5000;
export const IMPORTANT_TOAST_DURATION = 8000;
export const ERROR_TOAST_DURATION = 7000;
export const COPY_FEEDBACK_DURATION = 2000;

// ============================================
// ANIMATIONS
// ============================================

export const TOAST_ANIMATION_DURATION = 300;
export const SEARCH_DEBOUNCE_DELAY = 300;

// ============================================
// RECOVERY CODES
// ============================================

export const RECOVERY_CODE_SEGMENT_LENGTH = 4;
export const RECOVERY_CODE_SEGMENTS = 2;
export const RECOVERY_CODE_PREFIX = "DH";

/**
 * Alphabet for recovery-code segments: full uppercase alphanumeric set.
 */
export const RECOVERY_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
