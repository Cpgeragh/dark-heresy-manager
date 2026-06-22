// src/data/reference/weaponUpgradeReference.ts
// Reference data for weapon upgrades from the Core Rulebook.
// Note: cost and availability refer to the component only, not the cost of attaching it.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WeaponUpgradeRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Weight modifier, e.g. "×1/2", "+1 kg", "—" */
  weightModifier: string;
  value: string;
  availability: string;
  /** Full rules description */
  description: string;
  /** What weapon types this upgrade can be applied to */
  applicableTo: string;
  /** Creation components are reference data only and are not fitted as normal attachments. */
  isCreationComponent?: boolean;
}

// ─── Reference Data ──────────────────────────────────────────────────────────

export const WEAPON_UPGRADE_REFERENCE: WeaponUpgradeRef[] = [
  // ── Core Rulebook ─────────────────────────────────────────────────────────

  {
    id: "cr-compact",
    name: "Compact",
    source: SkillSource.CR,
    weightModifier: "×1/2",
    value: "50 Thrones",
    availability: "Average",
    description:
      "A smaller version of a pistol or basic weapon favoured for concealment over stopping power. " +
      "Halves the weapon's weight, clip size, and range, and reduces its Damage by 1.",
    applicableTo: "Any Pistol or Basic Las, Solid Projectile, Flame, Bolt or Plasma weapon.",
  },

  {
    id: "cr-exterminator",
    name: "Exterminator",
    source: SkillSource.CR,
    weightModifier: "+1 kg",
    value: "35 Thrones",
    availability: "Common",
    description:
      "A small one-shot flamer device. Instead of firing the weapon normally, the shooter may " +
      "use the exterminator cartridge, resolving effects as if firing a flamer. " +
      "One-shot only — must be replaced once used.",
    applicableTo: "Any weapon.",
  },

  {
    id: "cr-extra-grip",
    name: "Extra Grip",
    source: SkillSource.CR,
    weightModifier: "×1/3",
    value: "25 Thrones",
    availability: "Plentiful",
    description:
      "Also known as a pistol grip. Allows the weapon to be wielded in one hand without the " +
      "usual –20 penalty for firing a basic weapon one-handed. Range is halved.",
    applicableTo: "Any Basic ranged weapon can have melee attachments.",
  },

  {
    id: "cr-fire-selector",
    name: "Fire Selector",
    source: SkillSource.CR,
    weightModifier: "+0.5 kg",
    value: "25 Thrones",
    availability: "Scarce",
    description:
      "Allows the weapon to hold up to three different clips simultaneously. " +
      "At the start of the shooter's Turn he may choose which clip to draw ammunition from that round.",
    applicableTo: "(Bolt) and (SP) Pistols or (SP) and (Bolt) Basic Weapons.",
  },

  {
    id: "cr-melee-upgrade",
    name: "Melee Attachment",
    source: SkillSource.CR,
    weightModifier: "+2 kg",
    value: "25 Thrones",
    availability: "Plentiful",
    description:
      "A bayonet, chain blade, or other long-bladed combat attachment. " +
      "A weapon fitted with a melee attachment counts as a spear in close combat.",
    applicableTo: "Any Basic ranged weapon.",
  },

  {
    id: "cr-mono",
    name: "Mono",
    source: SkillSource.CR,
    weightModifier: "0",
    value: "40 Thrones",
    availability: "Scarce",
    description:
      "Mono weapons have specially fashioned blades with superfine edges that cut through " +
      "armour and never lose their edge. The weapon no longer counts as Primitive and gains +2 Penetration.",
    applicableTo: "Any close combat weapon.",
  },

  {
    id: "cr-overcharge-pack",
    name: "Overcharge Pack",
    source: SkillSource.CR,
    weightModifier: "+0.5 kg",
    value: "15 Thrones",
    availability: "Common",
    description:
      "An enhanced power pack for a las weapon. Adds 1 to the weapon's Damage. " +
      "The increased output halves the clip size.",
    applicableTo: "Any Pistol (Las) or Basic (Las) weapon.",
  },

  {
    id: "cr-red-dot-laser-sight",
    name: "Red-Dot Laser Sight",
    source: SkillSource.CR,
    weightModifier: "+0.5 kg",
    value: "50 Thrones",
    availability: "Scarce",
    description:
      "Grants a +10 bonus to Ballistic Skill Tests when the weapon is fired on single shot. " +
      "Counts as a sight — a weapon may only have one sight fitted.",
    applicableTo: "Any Pistol or Basic Las, Solid Projectile, Bolt, Primitive or Plasma weapon.",
  },

  {
    id: "cr-silencer",
    name: "Silencer",
    source: SkillSource.CR,
    weightModifier: "+0.5 kg",
    value: "10 Thrones",
    availability: "Plentiful",
    description:
      "Lowers the noise and flash from a weapon's discharge, preventing easy detection. " +
      "Awareness Tests to hear shots made with a silenced weapon suffer an additional –20 penalty " +
      "and can only be attempted at half the normal range for detecting gunshots.",
    applicableTo: "Stub revolver, stub automatic, hand cannon, autogun and hunting rifle.",
  },

  {
    id: "cr-telescopic-sight",
    name: "Telescopic Sight",
    source: SkillSource.CR,
    weightModifier: "+1 kg",
    value: "35 Thrones",
    availability: "Average",
    description:
      "Magnifies the target's image for precise long-range shots. Ignores all penalties for " +
      "long and extreme range, provided the shooter takes a Full Action to aim. " +
      "Counts as a sight — a weapon may only have one sight fitted.",
    applicableTo: "Any Basic Las, Solid Projectile, Bolt, Primitive or Plasma weapon.",
  },

  {
    id: "lw-integrated-weapon-components",
    name: "Integrated Weapon Components",
    source: SkillSource.LW,
    weightModifier: "+0.5 kg",
    value: "200 Thrones",
    availability: "Extremely Rare",
    description:
      "Used to create new Integrated Weapons; this is creation component data, not a normal fitted attachment. " +
      "Integrated weapons are linked to a Potentia Coil, have unlimited ammunition, do not need to reload unless otherwise noted, and do not Jam; a Jam instead gives the user 1 Fatigue. " +
      "Las weapons gain the normal integrated benefits. Integrated Plasma and Melta weapons double Clip Size while connected; Plasma weapons can still Overheat but lose Recharge while connected. " +
      "Integrated Solid Projectile and Launcher weapons instead gain Reliable and Storm. " +
      "Only Chain, Shock, or Power melee weapons can be integrated: Chain gains Razor Sharp, Shock imposes an additional -30 penalty on Toughness Tests to resist Stunning, and Power gains +2 Damage and +2 Penetration. Primitive weapons cannot be integrated. " +
      "Creating one follows normal weapon upgrade rules, but requires trained Forbidden Lore (Adeptus Mechanicus); components are only available on Forge Worlds.",
    applicableTo:
      "Creation of Integrated Weapons only; not selectable as a normal weapon attachment.",
    isCreationComponent: true,
  },
];
