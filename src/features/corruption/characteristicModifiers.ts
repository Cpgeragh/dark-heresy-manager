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
