// src/data/reference/weaponReference.ts
// Stat-block reference data for ranged and melee weapons, organised by source book.
// Feeds into the reference-lookup UI on the Weapons tab.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RangedWeaponRef {
  id: string;
  name: string;
  source: SkillSource;
  class: string;
  range: string;
  rof: string;
  damage: string;
  pen: number;
  clip: number;
  reload: string;
  specialRules: string;
  weight: string;
  value: string;
  rarity: string;
}

export interface MeleeWeaponRef {
  id: string;
  name: string;
  source: SkillSource;
  class: string;
  damage: string;
  pen: number;
  specialRules: string;
  twoHanded?: boolean;
  weight: string;
  value: string;
  rarity: string;
}

// ─── Ranged Weapons ──────────────────────────────────────────────────────────

export const RANGED_WEAPON_REFERENCE: RangedWeaponRef[] = [

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "godwyn-deaz-pattern-bolter",
    name: "Godwyn-De'az Pattern Bolter",
    source: SkillSource.BoM,
    class: "Basic",
    range: "90m",
    rof: "S/2/–",
    damage: "1d10+5 X",
    pen: 4,
    clip: 30,
    reload: "Full",
    specialRules: "Reliable, Tearing",
    weight: "7kg",
    value: "250 Thrones",
    rarity: "Rare",
  },
  {
    id: "godwyn-deaz-storm-bolter",
    name: "Godwyn-De'az Storm Bolter",
    source: SkillSource.BoM,
    class: "Basic",
    range: "90m",
    rof: "S/2/4",
    damage: "1d10+5 X",
    pen: 4,
    clip: 60,
    reload: "Full",
    specialRules: "Reliable, Tearing, Storm",
    weight: "9kg",
    value: "500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "seraphim-inferno-pistol",
    name: "Seraphim Inferno Pistol",
    source: SkillSource.BoM,
    class: "Pistol",
    range: "10m",
    rof: "S/–/–",
    damage: "2d10+2 E",
    pen: 10,
    clip: 6,
    reload: "Full",
    specialRules: "Reliable",
    weight: "2kg",
    value: "500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "seraphim-hand-flamer",
    name: "Seraphim Hand Flamer",
    source: SkillSource.BoM,
    class: "Pistol",
    range: "10m",
    rof: "S/–/–",
    damage: "1d10+4 E",
    pen: 2,
    clip: 6,
    reload: "Full",
    specialRules: "Flame",
    weight: "3kg",
    value: "150 Thrones",
    rarity: "Rare",
  },
  {
    id: "heavy-flamer",
    name: "Heavy Flamer",
    source: SkillSource.BoM,
    class: "Heavy",
    range: "30m",
    rof: "S/–/–",
    damage: "2d10+4 E",
    pen: 4,
    clip: 10,
    reload: "2 Full",
    specialRules: "Flame",
    weight: "35kg",
    value: "1,000 Thrones",
    rarity: "Very Rare",
  },

];

// ─── Melee Weapons ───────────────────────────────────────────────────────────

export const MELEE_WEAPON_REFERENCE: MeleeWeaponRef[] = [

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "baptismal-hammer",
    name: "Baptismal Hammer/Mace",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10+1 I",
    pen: 0,
    specialRules: "Unbalanced",
    weight: "3kg",
    value: "10 Thrones",
    rarity: "Common",
  },
  {
    id: "daemon-pike",
    name: "Daemon Pike",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10 R",
    pen: 2,
    specialRules: "Holy",
    weight: "3kg",
    value: "75 Thrones",
    rarity: "Rare",
  },
  {
    id: "ecclesiarchy-corsesque",
    name: "Ecclesiarchy Corsesque",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10 R",
    pen: 2,
    specialRules: "Unbalanced, Holy",
    twoHanded: true,
    weight: "4kg",
    value: "80 Thrones",
    rarity: "Rare",
  },
  {
    id: "eviscerator",
    name: "Eviscerator",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10+10 R",
    pen: 5,
    specialRules: "Tearing, Unwieldy, Special (96–00 roll causes wielder to take damage)",
    twoHanded: true,
    weight: "10kg",
    value: "750 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "flame-hammer",
    name: "Flame Hammer",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "2d10 I",
    pen: 1,
    specialRules: "Unwieldy, Special",
    twoHanded: true,
    weight: "5kg",
    value: "200 Thrones",
    rarity: "Rare",
  },
  {
    id: "mancatcher",
    name: "Mancatcher",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10",
    pen: 0,
    specialRules: "Unwieldy, Special",
    twoHanded: true,
    weight: "4kg",
    value: "25 Thrones",
    rarity: "Common",
  },
  {
    id: "scordata",
    name: "Scordata",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "0",
    pen: 0,
    specialRules: "Primitive, Flexible",
    weight: "0.5kg",
    value: "15 Thrones",
    rarity: "Common",
  },

];
