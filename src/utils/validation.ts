// src/utils/validation.ts

import {
  MAX_CHARACTERISTIC_VALUE,
  MIN_CHARACTERISTIC_VALUE,
  MAX_CHARACTERISTIC_ADVANCES,
} from "../constants/gameRules";

/**
 * Validation result with error message
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================
// NUMBER VALIDATION
// ============================================

/**
 * Validate a number is within a range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = "Value"
): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (value < min) {
    return { isValid: false, error: `${fieldName} cannot be less than ${min}` };
  }

  if (value > max) {
    return { isValid: false, error: `${fieldName} cannot be more than ${max}` };
  }

  return { isValid: true };
}

/**
 * Validate a non-negative number
 */
export function validateNonNegative(value: number, fieldName: string = "Value"): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (value < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  return { isValid: true };
}

/**
 * Validate an integer (no decimals)
 */
export function validateInteger(value: number, fieldName: string = "Value"): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (!Number.isInteger(value)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }

  return { isValid: true };
}

// ============================================
// STRING VALIDATION
// ============================================

/**
 * Validate a required string field
 */
export function validateRequired(value: string, fieldName: string = "Field"): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = "Field"
): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters`,
    };
  }

  if (trimmed.length > max) {
    return {
      isValid: false,
      error: `${fieldName} cannot be more than ${max} characters`,
    };
  }

  return { isValid: true };
}

// ============================================
// GAME-SPECIFIC VALIDATION
// ============================================

/**
 * Validate characteristic base value (0-100)
 */
export function validateCharacteristicBase(value: number): ValidationResult {
  const integerCheck = validateInteger(value, "Characteristic");
  if (!integerCheck.isValid) return integerCheck;

  return validateNumberRange(
    value,
    MIN_CHARACTERISTIC_VALUE,
    MAX_CHARACTERISTIC_VALUE,
    "Characteristic"
  );
}

/**
 * Validate characteristic advances (0-4)
 */
export function validateCharacteristicAdvances(value: number): ValidationResult {
  const integerCheck = validateInteger(value, "Advances");
  if (!integerCheck.isValid) return integerCheck;

  return validateNumberRange(value, 0, MAX_CHARACTERISTIC_ADVANCES, "Advances");
}

/**
 * Validate characteristic total doesn't exceed 100
 */
export function validateCharacteristicTotal(base: number, advances: number): ValidationResult {
  const total = base + advances * 5;

  if (total > MAX_CHARACTERISTIC_VALUE) {
    return {
      isValid: false,
      error: `Total characteristic cannot exceed ${MAX_CHARACTERISTIC_VALUE}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate wounds
 */
export function validateWounds(current: number, total: number): ValidationResult {
  const currentCheck = validateNonNegative(current, "Current wounds");
  if (!currentCheck.isValid) return currentCheck;

  const totalCheck = validateNonNegative(total, "Total wounds");
  if (!totalCheck.isValid) return totalCheck;

  if (current > total) {
    return {
      isValid: false,
      error: "Current wounds cannot exceed total wounds",
    };
  }

  return { isValid: true };
}

/**
 * Validate fate points
 */
export function validateFatePoints(current: number, total: number): ValidationResult {
  const currentCheck = validateNonNegative(current, "Current fate");
  if (!currentCheck.isValid) return currentCheck;

  const totalCheck = validateNonNegative(total, "Total fate");
  if (!totalCheck.isValid) return totalCheck;

  if (current > total) {
    return {
      isValid: false,
      error: "Current fate cannot exceed total fate",
    };
  }

  return { isValid: true };
}

/**
 * Validate recovery code format (DH-XXXX-YYYY)
 */
export function validateRecoveryCode(code: string): ValidationResult {
  const trimmed = code.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: "Recovery code is required" };
  }

  // Simple format check: should start with DH- and have dashes
  if (!trimmed.startsWith("DH-")) {
    return {
      isValid: false,
      error: "Recovery code must start with 'DH-'",
    };
  }

  // Check has at least 2 segments after DH-
  const segments = trimmed.split("-");
  if (segments.length < 3) {
    return {
      isValid: false,
      error: "Recovery code format: DH-XXXX-YYYY",
    };
  }

  return { isValid: true };
}

/**
 * Validate campaign name
 */
export function validateCampaignName(name: string): ValidationResult {
  const requiredCheck = validateRequired(name, "Campaign name");
  if (!requiredCheck.isValid) return requiredCheck;

  return validateStringLength(name, 1, 100, "Campaign name");
}

/**
 * Validate character name
 */
export function validateCharacterName(name: string): ValidationResult {
  const requiredCheck = validateRequired(name, "Character name");
  if (!requiredCheck.isValid) return requiredCheck;

  return validateStringLength(name, 1, 100, "Character name");
}

// ============================================
// PARSE & VALIDATE HELPERS
// ============================================

/**
 * Parse string to integer with validation
 */
export function parseAndValidateInt(
  value: string,
  min: number,
  max: number,
  fieldName: string = "Value"
): { value: number; error?: string } {
  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    return { value: 0, error: `${fieldName} must be a number` };
  }

  const validation = validateNumberRange(parsed, min, max, fieldName);
  if (!validation.isValid) {
    return { value: parsed, error: validation.error };
  }

  return { value: parsed };
}

/**
 * Sanitize numeric input (allows only digits, optional minus)
 */
export function sanitizeNumericInput(value: string, allowNegative = false): string {
  if (allowNegative) {
    return value.replace(/[^0-9-]/g, "");
  }
  return value.replace(/[^0-9]/g, "");
}
