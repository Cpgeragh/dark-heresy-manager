// functions/src/shared/validation.ts
//
// Shared request-field validation for every protected callable.
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

export function assertRequestPayloadBounds(
  data: Record<string, unknown>,
  options: { maxBytes: number; maxStringCharacters: number }
): void {
  let serialised: string;
  try {
    serialised = JSON.stringify(data);
  } catch {
    throw new HttpsError("invalid-argument", "Request data must be serialisable.");
  }
  if (Buffer.byteLength(serialised, "utf8") > options.maxBytes) {
    throw new HttpsError(
      "invalid-argument",
      `Request payload exceeds its ${options.maxBytes}-byte limit.`
    );
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.length > options.maxStringCharacters) {
      throw new HttpsError(
        "invalid-argument",
        `Field "${key}" cannot exceed ${options.maxStringCharacters} characters.`
      );
    }
  }
}

export type FieldShape = "string" | { enum: readonly string[] };

export function assertFieldShapes(
  data: Record<string, unknown>,
  shapes: Record<string, FieldShape>
): void {
  for (const [key, shape] of Object.entries(shapes)) {
    if (!(key in data)) continue;
    const value = data[key];
    if (typeof value !== "string" || value.length === 0) {
      throw new HttpsError("invalid-argument", `Field "${key}" must be a non-empty string.`);
    }
    if (typeof shape === "object" && !shape.enum.includes(value)) {
      throw new HttpsError(
        "invalid-argument",
        `Field "${key}" must be one of: ${shape.enum.join(", ")}.`
      );
    }
  }
}
