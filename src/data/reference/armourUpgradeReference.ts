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
  /** When set, this upgrade only applies to these specific ArmourRef ids, instead of the general carapace/power-armour categories. */
  restrictedToArmourIds?: string[];
}

export const ARMOUR_UPGRADE_REFERENCE: ArmourUpgradeRef[] = [
  {
    id: "ih-hexagramatic-wards",
    name: "Hexagramatic Wards",
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
  {
    id: "ih-selenite-impellor",
    name: "Impellor",
    source: SkillSource.IH,
    weight: "+5 kg",
    value: "+200 Thrones",
    availability: "Scarce",
    description:
      "Allows the wearer to propel themselves through open space in zero or reduced gravity conditions with a Movement of 6. Not powerful enough to use in a normal gravity environment.",
    applicableTo: "Selenite Pattern Heavy Duty Void Suit.",
    restrictedToArmourIds: ["ih-selenite-pattern-heavy-duty-void-suit"],
  },
];
