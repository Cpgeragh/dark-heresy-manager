// src/constants/ui.ts

/**
 * UI/UX Constants
 *
 * These values control timing, animations, and user interface behavior.
 */

// ============================================
// TOAST NOTIFICATIONS
// ============================================

/**
 * Default duration for toast notifications (5 seconds)
 */
export const DEFAULT_TOAST_DURATION = 5000;

/**
 * Duration for important toast notifications like recovery codes (8 seconds)
 */
export const IMPORTANT_TOAST_DURATION = 8000;

/**
 * Duration for error toast notifications (7 seconds)
 */
export const ERROR_TOAST_DURATION = 7000;

/**
 * Duration to show "Copied!" feedback (2 seconds)
 */
export const COPY_FEEDBACK_DURATION = 2000;

// ============================================
// ANIMATIONS
// ============================================

/**
 * Toast slide-in animation duration (milliseconds)
 */
export const TOAST_ANIMATION_DURATION = 300;

/**
 * Debounce delay for search input (milliseconds)
 */
export const SEARCH_DEBOUNCE_DELAY = 300;

// ============================================
// RECOVERY CODES
// ============================================

/**
 * Length of each segment in recovery code (e.g., "DH-ABCD-EFGH")
 */
export const RECOVERY_CODE_SEGMENT_LENGTH = 4;

/**
 * Number of segments in recovery code
 */
export const RECOVERY_CODE_SEGMENTS = 2;

/**
 * Recovery code prefix
 */
export const RECOVERY_CODE_PREFIX = "DH";

/**
 * Alphabet for recovery-code segments: full uppercase alphanumeric set.
 */
export const RECOVERY_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
