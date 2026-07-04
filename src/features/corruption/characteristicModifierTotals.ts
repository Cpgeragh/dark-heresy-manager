import type { CorruptionBlock } from "../../types/Character";
import type { CharacteristicModifier } from "./characteristicModifiers";
import { getCorruptionMalignancyRef } from "./corruptionReference";
import { getMutationRef } from "./mutationsReference";

type CharacteristicTotals = Partial<Record<CharacteristicModifier["characteristic"], number>>;

function applyModifiers(
  totals: CharacteristicTotals,
  modifiers: CharacteristicModifier[] | undefined,
  rolledModifiers: Record<string, number> | undefined
) {
  for (const modifier of modifiers ?? []) {
    const magnitude = modifier.kind === "flat" ? modifier.value ?? 0 : rolledModifiers?.[modifier.characteristic] ?? 0;
    totals[modifier.characteristic] = (totals[modifier.characteristic] ?? 0) + modifier.sign * magnitude;
  }
}

export function getCharacteristicModifierTotals(corruption: CorruptionBlock): CharacteristicTotals {
  const totals: CharacteristicTotals = {};

  const malignancies = Array.isArray(corruption.malignancies) ? corruption.malignancies : [];
  for (const entry of malignancies) {
    applyModifiers(totals, getCorruptionMalignancyRef(entry.referenceId)?.modifiers, entry.rolledModifiers);
  }
  for (const entry of corruption.minorMutations ?? []) {
    applyModifiers(totals, getMutationRef(entry.referenceId)?.modifiers, entry.rolledModifiers);
  }
  for (const entry of corruption.majorMutations ?? []) {
    applyModifiers(totals, getMutationRef(entry.referenceId)?.modifiers, entry.rolledModifiers);
  }

  return totals;
}
