// functions/src/shared/recoveryCode.ts
//
// Stage 3.2a: server-side Recovery Code generation and HMAC hashing. The
// generation format (prefix, segment lengths, alphabet) deliberately
// mirrors src/utils/recoveryCode.ts and src/constants/ui.ts exactly — the
// two projects are independent (functions/ can't import from src/), so if
// that format ever changes, this needs updating to match.

import { randomInt, createHmac } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PREFIX = "DH";
const SEGMENT_LENGTH = 4;
const SEGMENTS = 2;

export function generateRecoveryCode(): string {
  const segments: string[] = [];
  for (let s = 0; s < SEGMENTS; s++) {
    let segment = "";
    for (let i = 0; i < SEGMENT_LENGTH; i++) {
      segment += ALPHABET[randomInt(ALPHABET.length)];
    }
    segments.push(segment);
  }
  return `${PREFIX}-${segments.join("-")}`;
}

export function hashRecoveryCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}
