import type { CorruptionBlock, TalentsAndTraitsBlock } from "../../types/Character";
import type { CharacteristicModifier } from "./characteristicModifiers";
import { getCorruptionMalignancyRef } from "./corruptionReference";
import { getMutationRef } from "./mutationsReference";
import {
  combineCharacteristicModifierTotals,
  getTalentCharacteristicModifierSources,
  getTalentCharacteristicModifierTotals,
} from "../talents/talentEffects";
import {
  getTraitCharacteristicModifierSources,
  getTraitCharacteristicModifierTotals,
} from "../traits/traitEffects";

export type CharacteristicTotals = Partial<Record<CharacteristicModifier["characteristic"], number>>;

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

export function getCharacteristicModifierTotals(
  corruption: CorruptionBlock,
  talents?: TalentsAndTraitsBlock,
  career?: string
): CharacteristicTotals {
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

  return talents
    ? combineCharacteristicModifierTotals(
        totals,
        getTalentCharacteristicModifierTotals(talents),
        getTraitCharacteristicModifierTotals(talents, career)
      )
    : totals;
}

export interface CharacteristicModifierSource {
  name: string;
  type: "Malignancy" | "Minor Mutation" | "Major Mutation" | "Talent" | "Trait";
  amount: number;
}

export function getCharacteristicModifierSources(
  corruption: CorruptionBlock,
  characteristic: CharacteristicModifier["characteristic"],
  talents?: TalentsAndTraitsBlock,
  career?: string
): CharacteristicModifierSource[] {
  const sources: CharacteristicModifierSource[] = [];

  function checkEntry(
    name: string,
    type: CharacteristicModifierSource["type"],
    modifiers: CharacteristicModifier[] | undefined,
    rolledModifiers: Record<string, number> | undefined
  ) {
    for (const modifier of modifiers ?? []) {
      if (modifier.characteristic !== characteristic) continue;
      const amount =
        modifier.kind === "flat"
          ? modifier.sign * (modifier.value ?? 0)
          : modifier.sign * (rolledModifiers?.[characteristic] ?? 0);
      sources.push({ name, type, amount });
    }
  }

  const malignancies = Array.isArray(corruption.malignancies) ? corruption.malignancies : [];
  for (const entry of malignancies) {
    const ref = getCorruptionMalignancyRef(entry.referenceId);
    checkEntry(ref?.name ?? entry.name, "Malignancy", ref?.modifiers, entry.rolledModifiers);
  }
  for (const entry of corruption.minorMutations ?? []) {
    const ref = getMutationRef(entry.referenceId);
    checkEntry(ref?.name ?? entry.name, "Minor Mutation", ref?.modifiers, entry.rolledModifiers);
  }
  for (const entry of corruption.majorMutations ?? []) {
    const ref = getMutationRef(entry.referenceId);
    checkEntry(ref?.name ?? entry.name, "Major Mutation", ref?.modifiers, entry.rolledModifiers);
  }

  if (talents) {
    sources.push(...getTalentCharacteristicModifierSources(talents, characteristic));
    sources.push(...getTraitCharacteristicModifierSources(talents, characteristic, career));
  }
  return sources;
}
