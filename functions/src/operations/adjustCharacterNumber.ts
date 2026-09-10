import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCanEditCharacter } from "../shared/characterAuthorization.js";
import { assertValidCharacterFieldValue } from "../shared/characterFieldValidation.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";

const TOP_LEVEL_PROPERTIES: Record<string, ReadonlySet<string>> = {
  consumables: new Set(["quantity"]),
  drugs: new Set(["quantity"]),
  grenades: new Set(["quantity"]),
  rangedWeapons: new Set(["quantity"]),
  meleeWeapons: new Set(["quantity"]),
  armour: new Set(["spareCells"]),
};

const NESTED_PROPERTIES: Record<string, Record<string, ReadonlySet<string>>> = {
  rangedWeapons: {
    ammoEntries: new Set(["clips", "rounds"]),
    magazineSlots: new Set(["rounds"]),
  },
  meleeWeapons: {
    ammoEntries: new Set(["clips", "rounds"]),
  },
};

export interface AdjustCharacterNumberInput {
  campaignId: string;
  characterId: string;
  field: string;
  itemId: string;
  property: string;
  nestedCollection?: string;
  nestedItemId?: string;
  delta: number;
  fallbackValue: number;
  operationId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNonNegativeSafeInteger(value: unknown, label: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new HttpsError("invalid-argument", `${label} must be a non-negative safe integer.`);
  }
}

function validateLocator(input: AdjustCharacterNumberInput): void {
  if (!Number.isSafeInteger(input.delta) || input.delta === 0) {
    throw new HttpsError("invalid-argument", "Quantity change must be a non-zero safe integer.");
  }
  assertNonNegativeSafeInteger(input.fallbackValue, "Fallback value");

  if (input.nestedCollection === undefined && input.nestedItemId === undefined) {
    if (!TOP_LEVEL_PROPERTIES[input.field]?.has(input.property)) {
      throw new HttpsError("invalid-argument", "Unsupported character quantity target.");
    }
    return;
  }

  if (!input.nestedCollection || !input.nestedItemId) {
    throw new HttpsError(
      "invalid-argument",
      "Nested collection and nested item ID must be provided together."
    );
  }
  if (!NESTED_PROPERTIES[input.field]?.[input.nestedCollection]?.has(input.property)) {
    throw new HttpsError("invalid-argument", "Unsupported nested character quantity target.");
  }
}

function findItem(items: unknown[], id: string, label: string): Record<string, unknown> {
  const item = items.find((entry) => isRecord(entry) && entry.id === id);
  if (!item || !isRecord(item)) throw new HttpsError("not-found", `${label} was not found.`);
  return item;
}

function applyChange(input: AdjustCharacterNumberInput, fieldValue: unknown): unknown[] {
  if (!Array.isArray(fieldValue)) {
    throw new HttpsError("failed-precondition", "Stored character collection is invalid.");
  }

  return fieldValue.map((entry) => {
    if (!isRecord(entry) || entry.id !== input.itemId) return entry;
    if (!input.nestedCollection || !input.nestedItemId) {
      const current = entry[input.property];
      const base =
        Number.isSafeInteger(current) && (current as number) >= 0
          ? (current as number)
          : input.fallbackValue;
      return { ...entry, [input.property]: Math.max(0, base + input.delta) };
    }

    const nested = entry[input.nestedCollection];
    if (!Array.isArray(nested)) {
      throw new HttpsError("failed-precondition", "Stored nested quantity collection is invalid.");
    }
    findItem(nested, input.nestedItemId, "Nested quantity item");
    return {
      ...entry,
      [input.nestedCollection]: nested.map((nestedEntry) => {
        if (!isRecord(nestedEntry) || nestedEntry.id !== input.nestedItemId) return nestedEntry;
        const current = nestedEntry[input.property];
        const base =
          Number.isSafeInteger(current) && (current as number) >= 0
            ? (current as number)
            : input.fallbackValue;
        return { ...nestedEntry, [input.property]: Math.max(0, base + input.delta) };
      }),
    };
  });
}

export async function adjustCharacterNumber(
  input: AdjustCharacterNumberInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  validateLocator(input);
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);
  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) throw new HttpsError("not-found", "Campaign not found.");
  const dmId = campaignSnapshot.data()?.dmId;

  await runOperationTransaction(
    db,
    idempotency,
    async (transaction) => {
      const characterSnapshot = await transaction.get(characterRef);
      if (!characterSnapshot.exists) throw new HttpsError("not-found", "Character not found.");
      const characterData = characterSnapshot.data() ?? {};
      await assertCanEditCharacter(db, callerUid, dmId, characterData);
      const currentCollection = characterData[input.field];
      if (!Array.isArray(currentCollection)) {
        throw new HttpsError("failed-precondition", "Stored character collection is invalid.");
      }
      findItem(currentCollection, input.itemId, "Quantity item");
      const nextCollection = applyChange(input, currentCollection);
      assertValidCharacterFieldValue(input.field, nextCollection);
      transaction.update(characterRef, { [input.field]: nextCollection });
    },
    { maxAttempts: 5 }
  );
}
