// functions/src/shared/customItemCopyMutation.ts
//
// Duplicates the per-character custom-item copy update/removal
// logic from src/services/customItemService.ts (buildCharacterCopyUpdate,
// buildCharacterCopyRemoval, updateLinkedArray). functions/ cannot import
// from src/, so this is a deliberate, minimal, structurally-typed copy —
// keep it in sync with the client version if that logic ever changes.

export type CustomItemCategory =
  | "gear"
  | "consumable"
  | "drug"
  | "cybernetic"
  | "weapon"
  | "armour"
  | "archeotech"
  | "power"
  | "trait";

export interface LinkedItem {
  customLibraryId?: string;
  customLibraryVersionId?: string;
  [key: string]: unknown;
}

export interface CharacterItemArrays {
  gear?: LinkedItem[];
  consumables?: LinkedItem[];
  drugs?: LinkedItem[];
  cybernetics?: LinkedItem[];
  archeotech?: LinkedItem[];
  rangedWeapons?: LinkedItem[];
  meleeWeapons?: LinkedItem[];
  grenades?: LinkedItem[];
  armour?: LinkedItem[];
  shields?: LinkedItem[];
  psychic: {
    minorPowers: LinkedItem[];
    majorPowers: LinkedItem[];
  };
  [key: string]: unknown;
}

function updateLinkedArray(
  field: string,
  items: LinkedItem[] | undefined,
  customLibraryId: string,
  customLibraryVersionId: string,
  definitionData: Record<string, unknown>
): ({ updatedCopies: number } & Record<string, unknown>) | null {
  if (!items?.length) return null;

  let updatedCopies = 0;
  const next = items.map((item) => {
    if (item.customLibraryId !== customLibraryId) return item;
    updatedCopies += 1;
    return {
      ...item,
      ...definitionData,
      customLibraryId,
      customLibraryVersionId,
    };
  });

  if (updatedCopies === 0) return null;
  return { [field]: next, updatedCopies };
}

function stripKindFields(data: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...data };
  delete copy.weaponKind;
  delete copy.armourKind;
  return copy;
}

export function buildCharacterCopyUpdate(
  character: CharacterItemArrays,
  category: CustomItemCategory,
  customItemId: string,
  customLibraryVersionId: string,
  data: Record<string, unknown>
): ({ updatedCopies: number } & Record<string, unknown>) | null {
  if (category === "weapon") {
    const weaponKind = data.weaponKind;
    if (weaponKind === "ranged") {
      return updateLinkedArray(
        "rangedWeapons",
        character.rangedWeapons,
        customItemId,
        customLibraryVersionId,
        stripKindFields(data)
      );
    }
    if (weaponKind === "melee") {
      return updateLinkedArray(
        "meleeWeapons",
        character.meleeWeapons,
        customItemId,
        customLibraryVersionId,
        stripKindFields(data)
      );
    }
    return updateLinkedArray(
      "grenades",
      character.grenades,
      customItemId,
      customLibraryVersionId,
      stripKindFields(data)
    );
  }

  if (category === "armour") {
    return data.armourKind === "shield"
      ? updateLinkedArray(
          "shields",
          character.shields,
          customItemId,
          customLibraryVersionId,
          stripKindFields(data)
        )
      : updateLinkedArray(
          "armour",
          character.armour,
          customItemId,
          customLibraryVersionId,
          stripKindFields(data)
        );
  }

  if (category === "power") {
    const powerField: "minorPowers" | "majorPowers" = data.isMinor ? "minorPowers" : "majorPowers";
    const items = character.psychic[powerField];
    if (!items.length) return null;

    let updatedCopies = 0;
    const next = items.map((item) => {
      if (item.customLibraryId !== customItemId) return item;
      updatedCopies += 1;
      return { ...item, ...data, customLibraryId: customItemId, customLibraryVersionId };
    });

    if (updatedCopies === 0) return null;
    return { psychic: { ...character.psychic, [powerField]: next }, updatedCopies };
  }

  switch (category) {
    case "gear":
      return updateLinkedArray("gear", character.gear, customItemId, customLibraryVersionId, data);
    case "consumable":
      return updateLinkedArray(
        "consumables",
        character.consumables,
        customItemId,
        customLibraryVersionId,
        data
      );
    case "drug":
      return updateLinkedArray(
        "drugs",
        character.drugs,
        customItemId,
        customLibraryVersionId,
        data
      );
    case "cybernetic":
      return updateLinkedArray(
        "cybernetics",
        character.cybernetics,
        customItemId,
        customLibraryVersionId,
        data
      );
    case "archeotech":
      return updateLinkedArray(
        "archeotech",
        character.archeotech,
        customItemId,
        customLibraryVersionId,
        data
      );
    default:
      return null;
  }
}

export function buildCharacterCopyRemoval(
  character: CharacterItemArrays,
  customItemId: string
): ({ removedCopies: number } & Record<string, unknown>) | null {
  const fields = [
    "gear",
    "consumables",
    "drugs",
    "cybernetics",
    "archeotech",
    "rangedWeapons",
    "meleeWeapons",
    "grenades",
    "armour",
    "shields",
  ] as const;

  let removedCopies = 0;
  const update: Record<string, unknown> = {};

  for (const field of fields) {
    const items = character[field] as LinkedItem[] | undefined;
    if (!items?.length) continue;
    const filtered = items.filter((item) => item.customLibraryId !== customItemId);
    if (filtered.length < items.length) {
      removedCopies += items.length - filtered.length;
      update[field] = filtered;
    }
  }

  const nextPsychic = { ...character.psychic };
  let psychicChanged = false;
  for (const field of ["minorPowers", "majorPowers"] as const) {
    const items = character.psychic[field];
    const filtered = items.filter((item) => item.customLibraryId !== customItemId);
    if (filtered.length < items.length) {
      removedCopies += items.length - filtered.length;
      nextPsychic[field] = filtered;
      psychicChanged = true;
    }
  }
  if (psychicChanged) update.psychic = nextPsychic;

  if (removedCopies === 0) return null;
  return { ...update, removedCopies };
}
