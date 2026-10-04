export const RECOVERY_CODE_PREFIX = "DH";
export const RECOVERY_CODE_SEGMENTS = 2;
export const RECOVERY_CODE_SEGMENT_LENGTH = 4;
export const RECOVERY_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const RECOVERY_CODE_PATTERN = new RegExp(
  `^${RECOVERY_CODE_PREFIX}(?:-[${RECOVERY_CODE_ALPHABET}]{${RECOVERY_CODE_SEGMENT_LENGTH}}){${RECOVERY_CODE_SEGMENTS}}$`
);

export function isRecoveryCodeFormat(value: unknown): value is string {
  return typeof value === "string" && RECOVERY_CODE_PATTERN.test(value);
}
