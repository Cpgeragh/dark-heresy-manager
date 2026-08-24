// functions/src/shared/validation.ts
//
// Stage 3.1: shared request-field validation for every protected callable.
// Each callable defines its own allowed and required field names; this
// enforces the shape uniformly and throws a safe, deliberate error rather
// than letting mismatched requests through with silently-ignored fields.

import { HttpsError } from "firebase-functions/v2/https";

export function assertRequestFields(
  data: unknown,
  allowed: readonly string[],
  required: readonly string[] = []
): asserts data is Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new HttpsError("invalid-argument", "Request data must be an object.");
  }

  const allowedSet = new Set(allowed);
  const unknownKey = Object.keys(data).find((key) => !allowedSet.has(key));
  if (unknownKey) {
    throw new HttpsError("invalid-argument", `Unexpected field: ${unknownKey}.`);
  }

  const missingKey = required.find((key) => !(key in data));
  if (missingKey) {
    throw new HttpsError("invalid-argument", `Missing required field: ${missingKey}.`);
  }
}
