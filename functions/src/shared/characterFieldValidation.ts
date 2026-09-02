// functions/src/shared/characterFieldValidation.ts
//
// Server-side validators for individual Character document fields, used by
// patchCharacterField. functions/ cannot import from src/, so these limits
// are deliberately duplicated from src/constants/productLimits.ts and must
// be kept in sync by hand — the same coupling already accepted for the
// Recovery Code format (recoveryCode.ts) and the custom-item copy-mutation
// logic (customItemCopyMutation.ts).

import { HttpsError } from "firebase-functions/v2/https";

const CHARACTER_FIELD_BYTES = 900_000; // matches PRODUCT_LIMITS.characterDocumentBytes
const CHARACTER_FIELD_ARRAY_ENTRIES = 200; // matches PRODUCT_LIMITS.characterArrayEntries
const CHARACTER_FIELD_OBJECT_KEYS = 100; // matches PRODUCT_LIMITS.characterObjectKeys
const CHARACTER_FIELD_NESTING_DEPTH = 8; // matches PRODUCT_LIMITS.characterNestingDepth
const CHARACTER_FIELD_STRING_CHARACTERS = 4_000; // matches PRODUCT_LIMITS.characterFieldCharacters

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively bounds a single field's value the same way the client's
 * assertNestedDataBounds bounds the whole character document — byte size,
 * array length, object key count, nesting depth, and per-string character
 * length. Shared by every field validator in this file, present and future.
 */
export function assertFieldNestedBounds(value: unknown, label: string): void {
  let serialised: string;
  try {
    serialised = JSON.stringify(value);
  } catch {
    throw new HttpsError("invalid-argument", `${label} must be serialisable.`);
  }
  if (serialised === undefined) {
    throw new HttpsError("invalid-argument", `${label} must be serialisable.`);
  }
  if (Buffer.byteLength(serialised, "utf8") > CHARACTER_FIELD_BYTES) {
    throw new HttpsError("invalid-argument", `${label} exceeds its ${CHARACTER_FIELD_BYTES}-byte limit.`);
  }

  const visit = (entry: unknown, depth: number, path: string): void => {
    if (depth > CHARACTER_FIELD_NESTING_DEPTH) {
      throw new HttpsError(
        "invalid-argument",
        `${label} cannot be nested deeper than ${CHARACTER_FIELD_NESTING_DEPTH} levels.`
      );
    }
    if (entry === null || typeof entry === "boolean") return;
    if (typeof entry === "number") {
      if (!Number.isFinite(entry)) {
        throw new HttpsError("invalid-argument", `${path} must be a finite number.`);
      }
      return;
    }
    if (typeof entry === "string") {
      if (entry.length > CHARACTER_FIELD_STRING_CHARACTERS) {
        throw new HttpsError(
          "invalid-argument",
          `${path} cannot exceed ${CHARACTER_FIELD_STRING_CHARACTERS} characters.`
        );
      }
      return;
    }
    if (Array.isArray(entry)) {
      if (entry.length > CHARACTER_FIELD_ARRAY_ENTRIES) {
        throw new HttpsError(
          "invalid-argument",
          `${path} cannot contain more than ${CHARACTER_FIELD_ARRAY_ENTRIES} entries.`
        );
      }
      entry.forEach((child, index) => visit(child, depth + 1, `${path}[${index}]`));
      return;
    }
    if (isRecord(entry)) {
      const keys = Object.keys(entry);
      if (keys.length > CHARACTER_FIELD_OBJECT_KEYS) {
        throw new HttpsError(
          "invalid-argument",
          `${path} cannot contain more than ${CHARACTER_FIELD_OBJECT_KEYS} fields.`
        );
      }
      for (const [key, child] of Object.entries(entry)) {
        if (child === undefined) {
          throw new HttpsError("invalid-argument", `${path}.${key} cannot be undefined.`);
        }
        visit(child, depth + 1, `${path}.${key}`);
      }
      return;
    }
    throw new HttpsError("invalid-argument", `${path} contains an unsupported value.`);
  };

  visit(value, 0, label);
}

function assertNotesValue(value: unknown): void {
  if (typeof value !== "string" && !Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "Notes must be text or an array.");
  }
  assertFieldNestedBounds(value, "Notes");
}

const HEADER_KEYS = new Set([
  "characterName",
  "playerName",
  "career",
  "rank",
  "careerPath",
  "homeWorld",
  "divination",
  "description",
  "age",
  "gender",
  "skin",
  "hair",
  "eyes",
  "height",
  "weight",
  "quirks",
]);

const CHARACTER_NAME_CHARACTERS = 100; // matches PRODUCT_LIMITS.characterNameCharacters

function assertHeaderValue(value: unknown): void {
  if (!isRecord(value)) {
    throw new HttpsError("invalid-argument", "Character header must be an object.");
  }
  const unknownKey = Object.keys(value).find((key) => !HEADER_KEYS.has(key));
  if (unknownKey) {
    throw new HttpsError(
      "invalid-argument",
      `Character header contains an unexpected field: ${unknownKey}.`
    );
  }
  const { characterName } = value;
  if (typeof characterName !== "string" || characterName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Character name is required.");
  }
  if (characterName.length > CHARACTER_NAME_CHARACTERS) {
    throw new HttpsError(
      "invalid-argument",
      `Character name cannot exceed ${CHARACTER_NAME_CHARACTERS} characters.`
    );
  }
  assertFieldNestedBounds(value, "Character header");
}

const PORTRAIT_ENCODED_BYTES = 350_000; // matches PRODUCT_LIMITS.portraitEncodedBytes
const PORTRAIT_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,/;

function assertPortraitUrlValue(value: unknown): void {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Portrait must be text.");
  }
  if (!PORTRAIT_DATA_URL_PATTERN.test(value)) {
    throw new HttpsError("invalid-argument", "Encoded portrait type is invalid.");
  }
  if (new TextEncoder().encode(value).byteLength > PORTRAIT_ENCODED_BYTES) {
    throw new HttpsError(
      "invalid-argument",
      `Portrait cannot exceed ${PORTRAIT_ENCODED_BYTES} encoded bytes.`
    );
  }
}

const CHARACTERISTIC_KEYS = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"];
const CHARACTERISTIC_FIELD_KEYS = new Set(["base", "advances", "advancePurchases"]);

function assertCharacteristicsValue(value: unknown): void {
  if (!isRecord(value)) {
    throw new HttpsError("invalid-argument", "Characteristics must be an object.");
  }
  const unknownKey = Object.keys(value).find((key) => !CHARACTERISTIC_KEYS.includes(key));
  if (unknownKey) {
    throw new HttpsError(
      "invalid-argument",
      `Characteristics contains an unexpected field: ${unknownKey}.`
    );
  }
  for (const key of CHARACTERISTIC_KEYS) {
    if (!(key in value)) {
      throw new HttpsError("invalid-argument", `Characteristics is missing "${key}".`);
    }
    const field = (value as Record<string, unknown>)[key];
    if (!isRecord(field)) {
      throw new HttpsError("invalid-argument", `Characteristic "${key}" must be an object.`);
    }
    const unknownFieldKey = Object.keys(field).find((k) => !CHARACTERISTIC_FIELD_KEYS.has(k));
    if (unknownFieldKey) {
      throw new HttpsError(
        "invalid-argument",
        `Characteristic "${key}" contains an unexpected field: ${unknownFieldKey}.`
      );
    }
    if (typeof field.base !== "number" || !Number.isFinite(field.base)) {
      throw new HttpsError("invalid-argument", `Characteristic "${key}".base must be a finite number.`);
    }
    if (typeof field.advances !== "number" || !Number.isInteger(field.advances)) {
      throw new HttpsError(
        "invalid-argument",
        `Characteristic "${key}".advances must be a whole number.`
      );
    }
  }
  assertFieldNestedBounds(value, "Characteristics");
}

export type CharacterFieldValidator = (value: unknown) => void;

const CHARACTER_FIELD_VALIDATORS: Record<string, CharacterFieldValidator> = {
  notes: assertNotesValue,
  header: assertHeaderValue,
  portraitUrl: assertPortraitUrlValue,
  characteristics: assertCharacteristicsValue,
};

export function assertValidCharacterFieldValue(field: string, value: unknown): void {
  const validator = CHARACTER_FIELD_VALIDATORS[field];
  if (!validator) {
    throw new HttpsError("invalid-argument", `Field "${field}" cannot be patched this way.`);
  }
  validator(value);
}
