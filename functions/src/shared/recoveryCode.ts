// functions/src/shared/recoveryCode.ts
//
// Server-side Recovery Code generation and HMAC hashing. The code format
// comes from shared-rules, the same source the browser uses.

import { randomInt, createHmac, createHash } from "node:crypto";
import {
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from "shared-rules";

export function generateRecoveryCode(): string {
  const segments: string[] = [];
  for (let s = 0; s < RECOVERY_CODE_SEGMENTS; s++) {
    let segment = "";
    for (let i = 0; i < RECOVERY_CODE_SEGMENT_LENGTH; i++) {
      segment += RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)];
    }
    segments.push(segment);
  }
  return `${RECOVERY_CODE_PREFIX}-${segments.join("-")}`;
}

export function hashRecoveryCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

export function hashForKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
