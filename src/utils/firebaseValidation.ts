import { PRODUCT_LIMITS } from "../constants/productLimits";
import type { CustomItemCategory, CustomItemCreator } from "../types/CustomItems";
import { validateCharacterName, validateRecoveryCode } from "./validation";

type UnknownRecord = Record<string, unknown>;

const CHARACTER_TOP_LEVEL_KEYS = new Set([
  "id",
  "campaignId",
  "userId",
  "recoveryCode",
  "isEditableByPlayer",
  "createdAt",
  "updatedAt",
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
  "consumables",
  "drugs",
  "grenades",
  "shields",
  "cybernetics",
  "archeotech",
  "companions",
  "weaponTraining",
  "experience",
  "psychic",
  "notes",
  "portraitUrl",
  "backgroundComplete",
]);

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

const CHARACTERISTIC_KEYS = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"];

const CUSTOM_ITEM_KEYS: Record<CustomItemCategory, ReadonlySet<string>> = {
  gear: new Set([
    "name",
    "description",
    "weight",
    "value",
    "availability",
    "source",
    "grantedByTalentEntryUid",
    "grantedByTalentName",
    "grantedByType",
  ]),
  consumable: new Set(["name", "description", "weight", "value", "availability", "source"]),
  drug: new Set(["name", "weight", "value", "availability", "source", "notes"]),
  cybernetic: new Set([
    "name",
    "craftsmanship",
    "notes",
    "value",
    "availability",
    "source",
    "concealedWeapon",
    "grantedByTalentEntryUid",
    "grantedByTalentName",
    "grantedByType",
  ]),
  weapon: new Set([
    "weaponKind",
    "name",
    "class",
    "damage",
    "pen",
    "range",
    "rof",
    "clip",
    "rld",
    "specialRules",
    "strengthBonusMultiplier",
    "weight",
    "value",
    "availability",
    "source",
    "custom",
    "craftsmanship",
    "ammoTracking",
    "ammoType",
    "loadedAmmoByProfile",
    "magazineSlots",
    "activeMagazineSlotId",
    "alternateRangedAmmoEntries",
    "loadedAlternateRangedAmmoId",
    "alternateRangedAmmoReferenceId",
    "description",
    "integrated",
    "concealedBionic",
    "type",
  ]),
  armour: new Set([
    "armourKind",
    "name",
    "locations",
    "ap",
    "apOverrides",
    "notes",
    "weight",
    "value",
    "availability",
    "source",
    "craftsmanship",
    "qualities",
    "custom",
    "isForceField",
    "protectionRating",
    "spareCells",
    "damage",
    "pen",
    "specialRules",
  ]),
  archeotech: new Set([
    "name",
    "type",
    "description",
    "notes",
    "weight",
    "value",
    "availability",
    "source",
    "weaponClass",
    "damage",
    "range",
    "rof",
    "pen",
    "clip",
    "rld",
    "specialRules",
    "ap",
    "locations",
    "stacks",
    "craftsmanship",
    "bodyLocation",
    "protectionRating",
  ]),
  power: new Set([
    "name",
    "psyRatingTalentEntryUid",
    "discipline",
    "threshold",
    "focusTime",
    "sustained",
    "range",
    "description",
    "source",
    "origin",
    "isMinor",
    "custom",
  ]),
  trait: new Set(["name", "description", "source"]),
};

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
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    encodedByteLength(value) > 1_500 ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    containsControlCharacter(value)
  ) {
    throw new Error(`${label} is invalid.`);
  }
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
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
  if ("recoveryCode" in data) assertRecoveryCode(data.recoveryCode);
  if ("isEditableByPlayer" in data)
    assertBoolean(data.isEditableByPlayer, "Player edit permission");
  if ("backgroundComplete" in data)
    assertBoolean(data.backgroundComplete, "Background completion state");

  for (const key of CHARACTER_ARRAY_KEYS) {
    if (key in data && !Array.isArray(data[key])) throw new Error(`${key} must be an array.`);
  }

  if ("notes" in data && typeof data.notes !== "string" && !Array.isArray(data.notes)) {
    throw new Error("notes must be text or an array.");
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
  assertRecord(value, label);
  assertAllowedKeys(value, new Set(["userId", "characterId", "characterName"]), label);
  assertFirestoreDocumentId(value.userId, `${label} user ID`);
  if (value.characterId !== undefined)
    assertFirestoreDocumentId(value.characterId, `${label} character ID`);
  if (value.characterName !== undefined) {
    assertString(value.characterName, `${label} character name`);
    const result = validateCharacterName(value.characterName);
    if (!result.isValid) throw new Error(result.error);
  }
}

export function assertCustomItemData(
  category: unknown,
  value: unknown
): asserts value is UnknownRecord {
  if (typeof category !== "string" || !(category in CUSTOM_ITEM_KEYS)) {
    throw new Error("Custom-item category is invalid.");
  }
  const typedCategory = category as CustomItemCategory;
  assertRecord(value, "Custom-item data");
  assertAllowedKeys(value, CUSTOM_ITEM_KEYS[typedCategory], "Custom-item data");
  assertString(value.name, "Custom-item name");
  const name = value.name.trim();
  if (!name) throw new Error("Custom-item name is required.");
  if (name.length > PRODUCT_LIMITS.customItemNameCharacters) {
    throw new Error(
      `Custom-item name cannot exceed ${PRODUCT_LIMITS.customItemNameCharacters} characters.`
    );
  }
  if (
    typedCategory === "weapon" &&
    !["ranged", "melee", "grenade"].includes(String(value.weaponKind))
  ) {
    throw new Error("Custom weapon kind is invalid.");
  }
  if (typedCategory === "armour" && !["worn", "shield"].includes(String(value.armourKind))) {
    throw new Error("Custom armour kind is invalid.");
  }
  assertNestedDataBounds(value, {
    label: "Custom-item data",
    maxBytes: PRODUCT_LIMITS.customItemDataBytes,
    maxArrayEntries: PRODUCT_LIMITS.customItemArrayEntries,
    maxObjectKeys: PRODUCT_LIMITS.customItemObjectKeys,
    maxDepth: PRODUCT_LIMITS.customItemNestingDepth,
    maxStringCharacters: PRODUCT_LIMITS.customItemTextCharacters,
  });
  assertExpectedIdFields(value, "Custom-item data");
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
