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
 * Format the user-entered characters into the DH-XXXX-YYYY shape as they type.
 * The fixed DH prefix and separators are supplied automatically, so users only
 * enter the eight variable characters. Full formatted codes can still be pasted.
 */
export function formatRecoveryCodeInput(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (!upper) return "";

  const totalVariableCharacters = RECOVERY_CODE_SEGMENTS * RECOVERY_CODE_SEGMENT_LENGTH;
  const clean = upper.replace(/[^A-Z0-9]/g, "");
  const includesPrefix =
    upper.startsWith(`${RECOVERY_CODE_PREFIX}-`) ||
    (clean.startsWith(RECOVERY_CODE_PREFIX) && clean.length > totalVariableCharacters);
  const variableCharacters = (
    includesPrefix ? clean.slice(RECOVERY_CODE_PREFIX.length) : clean
  ).slice(0, totalVariableCharacters);

  if (!variableCharacters) return "";

  const firstSegment = variableCharacters.slice(0, RECOVERY_CODE_SEGMENT_LENGTH);
  const secondSegment = variableCharacters.slice(RECOVERY_CODE_SEGMENT_LENGTH);
  const secondSeparator = firstSegment.length === RECOVERY_CODE_SEGMENT_LENGTH ? "-" : "";

  return `${RECOVERY_CODE_PREFIX}-${firstSegment}${secondSeparator}${secondSegment}`;
}

/**
 * Format an input edit while allowing Backspace to move naturally across the
 * automatically inserted separator.
 */
export function formatRecoveryCodeInputChange(previousValue: string, rawValue: string): string {
  const fixedPrefix = `${RECOVERY_CODE_PREFIX}-`;
  const secondSeparatorIndex = fixedPrefix.length + RECOVERY_CODE_SEGMENT_LENGTH;
  const isDeleting = rawValue.length < previousValue.length;

  // The focused empty field displays DH- without storing it as user input.
  // Backspacing that visual prefix must keep the underlying value empty rather
  // than interpreting the remaining DH as variable code characters.
  if (isDeleting && previousValue === fixedPrefix) return "";

  // The field already displays DH- on focus. If someone nevertheless types
  // DH- themselves, discard that duplicate fixed prefix and continue normally.
  if (rawValue.toUpperCase().startsWith(`${fixedPrefix}${fixedPrefix}`)) {
    return formatRecoveryCodeInput(rawValue.slice(fixedPrefix.length));
  }

  if (isDeleting && previousValue.startsWith(fixedPrefix)) {
    const previousHasSecondSeparator = previousValue[secondSeparatorIndex] === "-";
    const previousSecondSegment = previousHasSecondSeparator
      ? previousValue.slice(secondSeparatorIndex + 1)
      : "";
    const rawWithoutTrailingSeparator = rawValue.endsWith("-") ? rawValue.slice(0, -1) : rawValue;
    const leavesCompleteFirstSegment =
      rawWithoutTrailingSeparator.length === secondSeparatorIndex &&
      rawWithoutTrailingSeparator.startsWith(fixedPrefix);

    if (previousSecondSegment && leavesCompleteFirstSegment) {
      return rawWithoutTrailingSeparator;
    }

    if (
      previousHasSecondSeparator &&
      !previousSecondSegment &&
      rawValue === previousValue.slice(0, -1)
    ) {
      return rawValue.slice(0, -1);
    }
  }

  return formatRecoveryCodeInput(rawValue);
}
