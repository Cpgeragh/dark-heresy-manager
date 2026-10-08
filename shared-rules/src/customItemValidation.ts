export const CUSTOM_ITEM_CATEGORIES = [
  "gear",
  "consumable",
  "drug",
  "cybernetic",
  "weapon",
  "armour",
  "archeotech",
  "power",
  "trait",
] as const;

export type CustomItemCategory = (typeof CUSTOM_ITEM_CATEGORIES)[number];

export const CUSTOM_ITEM_VALIDATION_LIMITS = {
  nameCharacters: 100,
  textCharacters: 4_000,
  dataBytes: 100_000,
  arrayEntries: 100,
  objectKeys: 100,
  nestingDepth: 8,
  creatorNameCharacters: 100,
} as const;

export const CUSTOM_ITEM_DATA_KEYS = {
  gear: [
    "name",
    "description",
    "weight",
    "value",
    "availability",
    "source",
    "grantedByTalentEntryUid",
    "grantedByTalentName",
    "grantedByType",
  ],
  consumable: ["name", "description", "weight", "value", "availability", "source"],
  drug: ["name", "weight", "value", "availability", "source", "notes"],
  cybernetic: [
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
  ],
  weapon: [
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
  ],
  armour: [
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
  ],
  archeotech: [
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
  ],
  power: [
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
  ],
  trait: ["name", "description", "source"],
} as const satisfies Record<CustomItemCategory, readonly string[]>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, label: string): asserts value is UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
}

function assertAllowedKeys(value: UnknownRecord, keys: readonly string[], label: string): void {
  const keySet = new Set(keys);
  const unsupported = Object.keys(value).find((key) => !keySet.has(key));
  if (unsupported) throw new Error(`${label} contains an unsupported field: ${unsupported}.`);
}

function encodedByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function assertCustomItemDocumentId(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    encodedByteLength(value) > 1_500 ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    Array.from(value).some((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code <= 31 || code === 127;
    })
  ) {
    throw new Error(`${label} is invalid.`);
  }
}

function assertExpectedIds(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertExpectedIds(entry, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if ((key === "id" || key.endsWith("Id") || key.endsWith("Uid")) && entry != null) {
      assertCustomItemDocumentId(entry, `${path}.${key}`);
    }
    assertExpectedIds(entry, `${path}.${key}`);
  }
}

function assertNestedBounds(value: unknown): void {
  let serialised: string;
  try {
    serialised = JSON.stringify(value);
  } catch {
    throw new Error("Custom-item data must be serialisable.");
  }
  if (serialised === undefined) throw new Error("Custom-item data must be serialisable.");
  if (encodedByteLength(serialised) > CUSTOM_ITEM_VALIDATION_LIMITS.dataBytes) {
    throw new Error(
      `Custom-item data exceeds its ${CUSTOM_ITEM_VALIDATION_LIMITS.dataBytes}-byte limit.`
    );
  }

  const visit = (entry: unknown, depth: number, path: string): void => {
    if (depth > CUSTOM_ITEM_VALIDATION_LIMITS.nestingDepth) {
      throw new Error(
        `Custom-item data cannot be nested deeper than ${CUSTOM_ITEM_VALIDATION_LIMITS.nestingDepth} levels.`
      );
    }
    if (entry === null || typeof entry === "boolean") return;
    if (typeof entry === "number") {
      if (!Number.isFinite(entry)) throw new Error(`${path} must be a finite number.`);
      return;
    }
    if (typeof entry === "string") {
      if (entry.length > CUSTOM_ITEM_VALIDATION_LIMITS.textCharacters) {
        throw new Error(
          `${path} cannot exceed ${CUSTOM_ITEM_VALIDATION_LIMITS.textCharacters} characters.`
        );
      }
      return;
    }
    if (Array.isArray(entry)) {
      if (entry.length > CUSTOM_ITEM_VALIDATION_LIMITS.arrayEntries) {
        throw new Error(
          `${path} cannot contain more than ${CUSTOM_ITEM_VALIDATION_LIMITS.arrayEntries} entries.`
        );
      }
      entry.forEach((child, index) => visit(child, depth + 1, `${path}[${index}]`));
      return;
    }
    if (isRecord(entry)) {
      const keys = Object.keys(entry);
      if (keys.length > CUSTOM_ITEM_VALIDATION_LIMITS.objectKeys) {
        throw new Error(
          `${path} cannot contain more than ${CUSTOM_ITEM_VALIDATION_LIMITS.objectKeys} fields.`
        );
      }
      for (const [key, child] of Object.entries(entry)) {
        if (child === undefined) throw new Error(`${path}.${key} cannot be undefined.`);
        visit(child, depth + 1, `${path}.${key}`);
      }
      return;
    }
    throw new Error(`${path} contains an unsupported value.`);
  };
  visit(value, 0, "Custom-item data");
}

export function assertCustomItemCreatorData(value: unknown, label = "Custom-item creator"): void {
  assertRecord(value, label);
  assertAllowedKeys(value, ["userId", "characterId", "characterName"], label);
  assertCustomItemDocumentId(value.userId, `${label} user ID`);
  if (value.characterId !== undefined)
    assertCustomItemDocumentId(value.characterId, `${label} character ID`);
  if (value.characterName !== undefined) {
    if (typeof value.characterName !== "string" || !value.characterName.trim()) {
      throw new Error("Character name is required.");
    }
    if (value.characterName.trim().length > CUSTOM_ITEM_VALIDATION_LIMITS.creatorNameCharacters) {
      throw new Error(
        `Character name cannot exceed ${CUSTOM_ITEM_VALIDATION_LIMITS.creatorNameCharacters} characters.`
      );
    }
  }
}

export function assertCustomItemData(
  category: unknown,
  value: unknown
): asserts value is UnknownRecord {
  if (
    typeof category !== "string" ||
    !CUSTOM_ITEM_CATEGORIES.includes(category as CustomItemCategory)
  ) {
    throw new Error("Custom-item category is invalid.");
  }
  assertRecord(value, "Custom-item data");
  assertAllowedKeys(
    value,
    CUSTOM_ITEM_DATA_KEYS[category as CustomItemCategory],
    "Custom-item data"
  );
  if (typeof value.name !== "string") throw new Error("Custom-item name must be text.");
  const name = value.name.trim();
  if (!name) throw new Error("Custom-item name is required.");
  if (name.length > CUSTOM_ITEM_VALIDATION_LIMITS.nameCharacters) {
    throw new Error(
      `Custom-item name cannot exceed ${CUSTOM_ITEM_VALIDATION_LIMITS.nameCharacters} characters.`
    );
  }
  if (category === "weapon" && !["ranged", "melee", "grenade"].includes(String(value.weaponKind))) {
    throw new Error("Custom weapon kind is invalid.");
  }
  if (category === "armour" && !["worn", "shield"].includes(String(value.armourKind))) {
    throw new Error("Custom armour kind is invalid.");
  }
  assertNestedBounds(value);
  assertExpectedIds(value, "Custom-item data");
}
