// src/utils/recoveryCode.ts
// Pure utility for generating character recovery codes.

import {
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from "../constants/ui";

/**
 * Generate a recovery code in format: DH-XXXX-YYYY
 */
export function generateRecoveryCode(): string {
  const makeSegment = () =>
    Math.random()
      .toString(36)
      .substring(2, 2 + RECOVERY_CODE_SEGMENT_LENGTH)
      .toUpperCase();

  const segments = Array.from({ length: RECOVERY_CODE_SEGMENTS }, () => makeSegment()).join("-");

  return `${RECOVERY_CODE_PREFIX}-${segments}`;
}
