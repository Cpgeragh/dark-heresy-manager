import type { CharacteristicModifier } from "./characteristicModifiers";

export type RollValues = Record<string, string>;

export function getRoll1d10Modifiers(
  modifiers: CharacteristicModifier[] | undefined
): CharacteristicModifier[] {
  return (modifiers ?? []).filter((modifier) => modifier.kind === "roll1d10");
}

export function areRollModifierValuesValid(
  modifiers: CharacteristicModifier[],
  rolls: RollValues
): boolean {
  return modifiers.every((modifier) => {
    const parsed = Number(rolls[modifier.characteristic]);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10;
  });
}
