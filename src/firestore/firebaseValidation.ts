import { PRODUCT_LIMITS } from "../constants/productLimits";
import type { Character, CharacterHeader, Characteristics } from "../types/Character";
import type { CustomItemCreator } from "../types/CustomItems";
import type { CustomItemCategory, CustomItemDataByCategory } from "../types/CustomItems";
import { validateCharacterName, validateRecoveryCode } from "../utils/validation";
import {
  CUSTOM_ITEM_DATA_KEYS,
  assertCustomItemCreatorData,
  assertCustomItemData as assertSharedCustomItemData,
  assertCustomItemDocumentId,
} from "shared-rules";

type UnknownRecord = Record<string, unknown>;

type UnionKeys<T> = T extends unknown ? keyof T : never;
type CategoryKeys<C extends CustomItemCategory> = UnionKeys<CustomItemDataByCategory[C]>;
type CustomItemSchemaParity = {
  [C in CustomItemCategory]: Exclude<
    CategoryKeys<C>,
    (typeof CUSTOM_ITEM_DATA_KEYS)[C][number]
  > extends never
    ? Exclude<(typeof CUSTOM_ITEM_DATA_KEYS)[C][number], CategoryKeys<C>> extends never
      ? true
      : false
    : false;
};
const CUSTOM_ITEM_SCHEMA_PARITY: CustomItemSchemaParity = {
  gear: true,
  consumable: true,
  drug: true,
  cybernetic: true,
  weapon: true,
  armour: true,
  archeotech: true,
  power: true,
  trait: true,
};
void CUSTOM_ITEM_SCHEMA_PARITY;

/**
 * Builds an allowlist from an object literal keyed by every member of K, so
 * the compiler rejects a missing or an extra key against the real type
 * instead of letting this list silently drift from it.
 */
function keysOf<K extends string>(shape: Record<K, true>): K[] {
  return Object.keys(shape) as K[];
}

const CHARACTER_TOP_LEVEL_KEYS = new Set(
  keysOf<keyof Character>({
    id: true,
    campaignId: true,
    userId: true,
    recoveryCode: true,
    isEditableByPlayer: true,
    createdAt: true,
    updatedAt: true,
    header: true,
    characteristics: true,
    skills: true,
    wounds: true,
    fate: true,
    insanity: true,
    corruption: true,
    movement: true,
    rangedWeapons: true,
    meleeWeapons: true,
    armour: true,
    talentsAndTraits: true,
    gear: true,
    consumables: true,
    drugs: true,
    grenades: true,
    shields: true,
    cybernetics: true,
    archeotech: true,
    companions: true,
    weaponTraining: true,
    experience: true,
    psychic: true,
    notes: true,
    portraitUrl: true,
    backgroundComplete: true,
  })
);

const REQUIRED_CHARACTER_KEYS = [
  "campaignId",
  "userId",
  "recoveryCode",
  "isEditableByPlayer",
  "header",
  "characteristics",
  "skills",
  "wounds",
  "fate",
  "insanity",
  "corruption",
  "movement",
  "rangedWeapons",
  "meleeWeapons",
  "armour",
  "talentsAndTraits",
  "gear",
  "weaponTraining",
  "experience",
  "psychic",
] as const;

const CHARACTER_ARRAY_KEYS = [
  "skills",
  "rangedWeapons",
  "meleeWeapons",
  "armour",
  "gear",
  "consumables",
  "drugs",
  "grenades",
  "shields",
  "cybernetics",
  "archeotech",
  "companions",
] as const;

const HEADER_KEYS = new Set(
  keysOf<keyof CharacterHeader>({
    characterName: true,
    playerName: true,
    career: true,
    rank: true,
    careerPath: true,
    homeWorld: true,
    divination: true,
    description: true,
    age: true,
    gender: true,
    skin: true,
    hair: true,
    eyes: true,
    height: true,
    weight: true,
    quirks: true,
  })
);

const CHARACTERISTIC_KEYS = keysOf<keyof Characteristics>({
  ws: true,
  bs: true,
  s: true,
  t: true,
  ag: true,
  int: true,
  per: true,
  wp: true,
  fel: true,
});

export const ACCEPTED_PORTRAIT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function encodedByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, label: string): asserts value is UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
}

function assertAllowedKeys(
  value: UnknownRecord,
  allowed: ReadonlySet<string>,
  label: string
): void {
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  if (unknownKey) throw new Error(`${label} contains an unsupported field: ${unknownKey}.`);
}

function assertRequiredKeys(
  value: UnknownRecord,
  required: readonly string[],
  label: string
): void {
  const missingKey = required.find((key) => !(key in value));
  if (missingKey) throw new Error(`${label} is missing required field: ${missingKey}.`);
}

export function assertFirestoreDocumentId(value: unknown, label: string): asserts value is string {
  assertCustomItemDocumentId(value, label);
}

export function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be true or false.`);
}

export function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
}

export function assertBulkOperationCount(count: unknown, label = "Bulk operation"): void {
  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 0 ||
    count > PRODUCT_LIMITS.bulkOperationDocuments
  ) {
    throw new Error(
      `${label} cannot affect more than ${PRODUCT_LIMITS.bulkOperationDocuments} documents at once.`
    );
  }
}

export function assertRecoveryCode(value: unknown): asserts value is string {
  assertString(value, "Recovery code");
  const result = validateRecoveryCode(value);
  if (!result.isValid) throw new Error(result.error);
}

function assertExpectedIdFields(value: unknown, path = "Data"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertExpectedIdFields(entry, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, entry] of Object.entries(value)) {
    if ((key === "id" || key.endsWith("Id") || key.endsWith("Uid")) && entry != null) {
      assertFirestoreDocumentId(entry, `${path}.${key}`);
    }
    assertExpectedIdFields(entry, `${path}.${key}`);
  }
}

export function assertNestedDataBounds(
  value: unknown,
  options: {
    label: string;
    maxBytes: number;
    maxArrayEntries: number;
    maxObjectKeys: number;
    maxDepth: number;
    maxStringCharacters?: number;
  }
): void {
  let serialised: string;
  try {
    serialised = JSON.stringify(value);
  } catch {
    throw new Error(`${options.label} must be serialisable.`);
  }
  if (serialised === undefined) throw new Error(`${options.label} must be serialisable.`);
  if (encodedByteLength(serialised) > options.maxBytes) {
    throw new Error(`${options.label} exceeds its ${options.maxBytes}-byte limit.`);
  }

  const visit = (entry: unknown, depth: number, path: string): void => {
    if (depth > options.maxDepth) {
      throw new Error(`${options.label} cannot be nested deeper than ${options.maxDepth} levels.`);
    }
    if (entry === null || typeof entry === "boolean") return;
    if (typeof entry === "number") {
      if (!Number.isFinite(entry)) throw new Error(`${path} must be a finite number.`);
      return;
    }
    if (typeof entry === "string") {
      if (options.maxStringCharacters !== undefined && entry.length > options.maxStringCharacters) {
        throw new Error(`${path} cannot exceed ${options.maxStringCharacters} characters.`);
      }
      return;
    }
    if (Array.isArray(entry)) {
      if (entry.length > options.maxArrayEntries) {
        throw new Error(`${path} cannot contain more than ${options.maxArrayEntries} entries.`);
      }
      entry.forEach((child, index) => visit(child, depth + 1, `${path}[${index}]`));
      return;
    }
    if (isRecord(entry)) {
      const keys = Object.keys(entry);
      if (keys.length > options.maxObjectKeys) {
        throw new Error(`${path} cannot contain more than ${options.maxObjectKeys} fields.`);
      }
      for (const [key, child] of Object.entries(entry)) {
        if (child === undefined) throw new Error(`${path}.${key} cannot be undefined.`);
        visit(child, depth + 1, `${path}.${key}`);
      }
      return;
    }
    throw new Error(`${path} contains an unsupported value.`);
  };

  visit(value, 0, options.label);
}

function assertCharacterCoreTypes(data: UnknownRecord, requireComplete: boolean): void {
  if ("id" in data) assertFirestoreDocumentId(data.id, "Character ID");
  if ("campaignId" in data) assertFirestoreDocumentId(data.campaignId, "Campaign ID");
  if ("userId" in data && data.userId !== null) assertFirestoreDocumentId(data.userId, "Owner ID");
  if ("recoveryCode" in data && data.recoveryCode !== "") assertRecoveryCode(data.recoveryCode);
  if ("isEditableByPlayer" in data)
    assertBoolean(data.isEditableByPlayer, "Player edit permission");
  if ("backgroundComplete" in data)
    assertBoolean(data.backgroundComplete, "Background completion state");

  for (const key of CHARACTER_ARRAY_KEYS) {
    if (key in data && !Array.isArray(data[key])) throw new Error(`${key} must be an array.`);
  }

  if ("notes" in data && !Array.isArray(data.notes)) {
    throw new Error("notes must be an array.");
  }
  if ("portraitUrl" in data) {
    assertString(data.portraitUrl, "Portrait");
    if (encodedByteLength(data.portraitUrl) > PRODUCT_LIMITS.portraitEncodedBytes) {
      throw new Error(
        `Portrait cannot exceed ${PRODUCT_LIMITS.portraitEncodedBytes} encoded bytes.`
      );
    }
  }

  if ("header" in data) {
    assertRecord(data.header, "Character header");
    assertAllowedKeys(data.header, HEADER_KEYS, "Character header");
    if (requireComplete || "characterName" in data.header) {
      assertString(data.header.characterName, "Character name");
      const result = validateCharacterName(data.header.characterName);
      if (!result.isValid) throw new Error(result.error);
    }
  }

  if ("characteristics" in data) {
    assertRecord(data.characteristics, "Characteristics");
    assertAllowedKeys(data.characteristics, new Set(CHARACTERISTIC_KEYS), "Characteristics");
    if (requireComplete)
      assertRequiredKeys(data.characteristics, CHARACTERISTIC_KEYS, "Characteristics");
    for (const key of CHARACTERISTIC_KEYS) {
      if (!(key in data.characteristics)) continue;
      const field = data.characteristics[key];
      assertRecord(field, `Characteristic ${key}`);
      assertAllowedKeys(
        field,
        new Set(["base", "advances", "advancePurchases"]),
        `Characteristic ${key}`
      );
      if (typeof field.base !== "number" || !Number.isFinite(field.base))
        throw new Error(`Characteristic ${key}.base must be a finite number.`);
      if (typeof field.advances !== "number" || !Number.isInteger(field.advances))
        throw new Error(`Characteristic ${key}.advances must be a whole number.`);
    }
  }

  for (const key of [
    "wounds",
    "fate",
    "insanity",
    "corruption",
    "movement",
    "talentsAndTraits",
    "weaponTraining",
    "experience",
    "psychic",
  ]) {
    if (key in data) assertRecord(data[key], key);
  }
}

export function assertCharacterPayload(value: unknown, requireComplete = false): void {
  assertRecord(value, "Character data");
  assertAllowedKeys(value, CHARACTER_TOP_LEVEL_KEYS, "Character data");
  if (requireComplete) assertRequiredKeys(value, REQUIRED_CHARACTER_KEYS, "Character data");
  assertCharacterCoreTypes(value, requireComplete);
  assertNestedDataBounds(value, {
    label: "Character data",
    maxBytes: PRODUCT_LIMITS.characterDocumentBytes,
    maxArrayEntries: PRODUCT_LIMITS.characterArrayEntries,
    maxObjectKeys: PRODUCT_LIMITS.characterObjectKeys,
    maxDepth: PRODUCT_LIMITS.characterNestingDepth,
    maxStringCharacters: PRODUCT_LIMITS.characterFieldCharacters,
  });
  assertExpectedIdFields(value, "Character data");
}

export function assertCharacterImportData(value: unknown): asserts value is UnknownRecord {
  if (isRecord(value) && "id" in value) {
    throw new Error("Character data contains an unsupported field: id.");
  }
  assertCharacterPayload(value, true);
}

export async function readCharacterImportFile(file: {
  size: number;
  text: () => Promise<string>;
}): Promise<UnknownRecord> {
  if (!Number.isFinite(file.size) || file.size < 0)
    throw new Error("Character file size is invalid.");
  if (file.size > PRODUCT_LIMITS.characterImportBytes) {
    throw new Error("Character file is too large to import.");
  }
  const text = await file.text();
  if (encodedByteLength(text) > PRODUCT_LIMITS.characterImportBytes) {
    throw new Error("Character file is too large to import.");
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Character file is not valid JSON.");
  }
  assertCharacterImportData(data);
  return data;
}

export function assertCustomItemCreator(
  value: unknown,
  label = "Custom-item creator"
): asserts value is CustomItemCreator {
  assertCustomItemCreatorData(value, label);
}

export function assertCustomItemData(
  category: unknown,
  value: unknown
): asserts value is UnknownRecord {
  assertSharedCustomItemData(category, value);
}

export function assertPortraitSource(file: { size: number; type: string }): void {
  if (!Number.isFinite(file.size) || file.size < 0)
    throw new Error("Portrait file size is invalid.");
  if (file.size > PRODUCT_LIMITS.portraitInputBytes) {
    throw new Error(`Portrait source cannot exceed ${PRODUCT_LIMITS.portraitInputBytes} bytes.`);
  }
  if (!(ACCEPTED_PORTRAIT_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Portrait must be a JPEG, PNG, or WebP image.");
  }
}

export function assertEncodedPortrait(value: unknown): asserts value is string {
  assertString(value, "Portrait");
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(value)) {
    throw new Error("Encoded portrait type is invalid.");
  }
  if (encodedByteLength(value) > PRODUCT_LIMITS.portraitEncodedBytes) {
    throw new Error(`Portrait cannot exceed ${PRODUCT_LIMITS.portraitEncodedBytes} encoded bytes.`);
  }
}
