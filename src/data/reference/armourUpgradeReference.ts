// Reference data for armour upgrades.

import { SkillSource } from "../../types/SkillSource";

export interface ArmourUpgradeRef {
  id: string;
  name: string;
  source: SkillSource;
  weight: string;
  value: string;
  availability: string;
  description: string;
  applicableTo: string;
}

export const ARMOUR_UPGRADE_REFERENCE: ArmourUpgradeRef[] = [
  {
    id: "ih-hexagrammatic-wards",
    name: "Hexagrammatic Wards",
    source: SkillSource.IH,
    weight: "—",
    value: "2,500 Thrones",
    availability: "Very Rare",
    description:
      "The armour grants a +20 bonus to resist direct psychic attack or manipulation. " +
      "Its Armour Points are doubled against Damage caused by direct psychic force or warp energy, " +
      "and it retains its Armour Points against the Warp Weapon quality.",
    applicableTo: "Carapace breastplate, full carapace armour, or power armour.",
  },
];
