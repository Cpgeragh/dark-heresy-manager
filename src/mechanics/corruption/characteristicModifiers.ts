export interface CharacteristicModifier {
  characteristic: "ws" | "bs" | "s" | "t" | "ag" | "int" | "per" | "wp" | "fel";
  kind: "flat" | "roll1d10";
  sign: 1 | -1;
  value?: number; // magnitude, only for "flat" — roll1d10 magnitude comes from the player's own roll later
}

export const CHARACTERISTIC_LABELS: Record<CharacteristicModifier["characteristic"], string> = {
  ws: "Weapon Skill",
  bs: "Ballistic Skill",
  s: "Strength",
  t: "Toughness",
  ag: "Agility",
  int: "Intelligence",
  per: "Perception",
  wp: "Willpower",
  fel: "Fellowship",
};

export interface RollDisplayEntry {
  characteristic: CharacteristicModifier["characteristic"];
  label: string;
  value: number | undefined;
}

export function getRollDisplayEntries(
  modifiers: CharacteristicModifier[] | undefined,
  rolledModifiers: Record<string, number> | undefined
): RollDisplayEntry[] {
  return (modifiers ?? [])
    .filter((modifier) => modifier.kind === "roll1d10")
    .map((modifier) => ({
      characteristic: modifier.characteristic,
      label: CHARACTERISTIC_LABELS[modifier.characteristic],
      value: rolledModifiers?.[modifier.characteristic],
    }));
}
