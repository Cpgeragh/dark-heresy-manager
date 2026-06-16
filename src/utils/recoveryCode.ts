// src/utils/recoveryCode.ts
// Pure utility for generating character recovery codes.

import {
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from "../constants/ui";

/**
 * Generate a recovery code in format: DH-XXXX-YYYY
 * Uses crypto-strong randomness over the full uppercase alphanumeric set.
 */
export function generateRecoveryCode(): string {
  const totalChars = RECOVERY_CODE_SEGMENTS * RECOVERY_CODE_SEGMENT_LENGTH;
  const randoms = new Uint32Array(totalChars);
  crypto.getRandomValues(randoms);

  let chars = "";
  for (let i = 0; i < totalChars; i++) {
    chars += RECOVERY_CODE_ALPHABET[randoms[i] % RECOVERY_CODE_ALPHABET.length];
  }

  const segments: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_SEGMENTS; i++) {
    const start = i * RECOVERY_CODE_SEGMENT_LENGTH;
    segments.push(chars.slice(start, start + RECOVERY_CODE_SEGMENT_LENGTH));
  }

  return `${RECOVERY_CODE_PREFIX}-${segments.join("-")}`;
}

/**
 * Format raw user input into the DH-XXXX-YYYY shape as they type:
 * uppercases, strips non-alphanumerics, caps length, and re-inserts dashes.
 */
export function formatRecoveryCodeInput(raw: string): string {
  const maxChars =
    RECOVERY_CODE_PREFIX.length + RECOVERY_CODE_SEGMENTS * RECOVERY_CODE_SEGMENT_LENGTH;

  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxChars);

  const parts: string[] = [clean.slice(0, RECOVERY_CODE_PREFIX.length)];
  for (let i = 0; i < RECOVERY_CODE_SEGMENTS; i++) {
    const start = RECOVERY_CODE_PREFIX.length + i * RECOVERY_CODE_SEGMENT_LENGTH;
    if (clean.length > start) {
      parts.push(clean.slice(start, start + RECOVERY_CODE_SEGMENT_LENGTH));
    }
  }
  return parts.join("-");
}
