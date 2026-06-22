// src/data/reference/weaponReference.ts
// Stat-block reference data for ranged and melee weapons, organised by source book.
// Feeds into the reference-lookup UI on the Weapons tab.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GrenadeRef {
  id: string;
  name: string;
  source: string;
  /** Distinguishes grenades from mines; defaults to "Grenade" if omitted */
  type?: "Grenade" | "Mine";
  class: string;
  /** Damage string, "—" if no damage, or "Special" */
  damage: string;
  /** Penetration, "—" if not applicable */
  pen: string;
  /** Special rules string, "—" if none */
  specialRules: string;
  weight: string;
  value: string;
  availability: string;
  /** Full rules text for info modal */
  description?: string;
}

export interface RangedWeaponRef {
  id: string;
  name: string;
  source: SkillSource;
  class: string;
  range: string;
  rof: string;
  damage: string;
  pen: number | string;
  clip: number;
  reload: string;
  specialRules: string;
  weight: string;
  value: string;
  availability: string;
  /** Default ammo type label shown on the weapon card. Omit for integrated/no-ammo weapons. */
  ammoType?: string;
  /** AmmoRef IDs compatible with this weapon — drives the ammo picker dropdown. */
  compatibleAmmoIds?: string[];
  /** clip = spare clips/packs plus partial rounds; loose = individual rounds only. */
  ammoTracking?: "clip" | "loose";
  /** True for thrown weapons where the item itself is the projectile (bolas, throwing stars). Shows a quantity counter instead of ammo entries. */
  isThrown?: boolean;
  /** Prose description / special rules note shown in the info modal. */
  description?: string;
}

export interface MeleeWeaponRef {
  id: string;
  name: string;
  source: SkillSource;
  class: string;
  damage: string;
  pen: number | string;
  specialRules: string;
  twoHanded?: boolean;
  weight: string;
  value: string;
  availability: string;
  /** Prose description / special rules note shown in the info modal. */
  description?: string;
}

// ─── Ranged Weapons ──────────────────────────────────────────────────────────

export const RANGED_WEAPON_REFERENCE: RangedWeaponRef[] = [
  // ── Core Rulebook ─────────────────────────────────────────────────────────

  // Las
  {
    id: "cr-laspistol",
    name: "Laspistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+2 E",
    pen: 0,
    clip: 30,
    reload: "Full",
    specialRules: "Reliable",
    description:
      "Light, compact, and reliable las weapon common throughout the Imperium. Designs range from ornate heirlooms to brutally simple underhive weapons.",
    weight: "1.5 kg",
    value: "50 Thrones",
    availability: "Common",
    ammoType: "Charge Pack (Pistol)",
    compatibleAmmoIds: ["cr-charge-pack-pistol", "cr-hot-shot-charge"],
    ammoTracking: "clip",
  },
  {
    id: "cr-las-carbine",
    name: "Las Carbine",
    source: SkillSource.CR,
    class: "Basic",
    range: "60m",
    rof: "S/2/–",
    damage: "1d10+2 E",
    pen: 0,
    clip: 40,
    reload: "Full",
    specialRules: "Reliable",
    description:
      "Cut-down lasgun with fewer shots and shorter range, but easier to carry and aim. " +
      "Can be fired one-handed at only a -10 penalty instead of the normal -20 for Basic weapons.",
    weight: "3 kg",
    value: "75 Thrones",
    availability: "Common",
    ammoType: "Charge Pack (Basic)",
    compatibleAmmoIds: ["cr-charge-pack-basic", "cr-hot-shot-charge"],
    ammoTracking: "clip",
  },
  {
    id: "cr-lasgun",
    name: "Lasgun",
    source: SkillSource.CR,
    class: "Basic",
    range: "100m",
    rof: "S/3/–",
    damage: "1d10+3 E",
    pen: 0,
    clip: 60,
    reload: "Full",
    specialRules: "Reliable",
    description:
      "Robust and dependable standard las weapon found on almost every Imperial world, favoured by the Emperor's forces and many enemies alike.",
    weight: "4 kg",
    value: "75 Thrones",
    availability: "Common",
    ammoType: "Charge Pack (Basic)",
    compatibleAmmoIds: ["cr-charge-pack-basic", "cr-hot-shot-charge"],
    ammoTracking: "clip",
  },
  {
    id: "cr-long-las",
    name: "Long Las",
    source: SkillSource.CR,
    class: "Basic",
    range: "150m",
    rof: "S/–/–",
    damage: "1d10+3 E",
    pen: 1,
    clip: 40,
    reload: "Full",
    specialRules: "Accurate, Reliable",
    description:
      "Specially modified lasgun built for snipers, with extra range and accuracy. Its long barrel can make it unwieldy in close quarters.",
    weight: "4.5 kg",
    value: "100 Thrones",
    availability: "Scarce",
    ammoType: "Charge Pack (Basic)",
    compatibleAmmoIds: ["cr-charge-pack-basic", "cr-hot-shot-charge"],
    ammoTracking: "clip",
  },
  {
    id: "cr-mp-lascannon",
    name: "Man-Portable Lascannon",
    source: SkillSource.CR,
    class: "Heavy",
    range: "300m",
    rof: "S/–/–",
    damage: "5d10+10 E",
    pen: 10,
    clip: 5,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Heavy battlefield lascannon with separate power packs, normally crewed by two or more people and capable of punching through very thick armour at long range.",
    weight: "55 kg",
    value: "5,000 Thrones",
    availability: "Very Rare",
    ammoType: "Charge Pack (Heavy)",
    compatibleAmmoIds: ["cr-charge-pack-heavy"],
    ammoTracking: "clip",
  },

  // Solid Projectile
  {
    id: "cr-autopistol",
    name: "Autopistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/–/6",
    damage: "1d10+2 I",
    pen: 0,
    clip: 18,
    reload: "Full",
    specialRules: "—",
    description:
      "Compact rapid-firing solid projectile pistol, popular with gangers, outlaws, and other close-range fighters.",
    weight: "2.5 kg",
    value: "75 Thrones",
    availability: "Common",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets", "cr-man-stopper-bullets"],
    ammoTracking: "clip",
  },
  {
    id: "cr-stub-revolver",
    name: "Stub Revolver",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+3 I",
    pen: 0,
    clip: 6,
    reload: "2 Full",
    specialRules: "Reliable",
    description: "Ancient, reliable revolver design often carried as a dependable backup weapon.",
    weight: "1 kg",
    value: "40 Thrones",
    availability: "Plentiful",
    ammoType: "Bullets",
    compatibleAmmoIds: [
      "cr-bullets",
      "cr-dumdum-bullets",
      "cr-man-stopper-bullets",
      "lw-purity-round",
    ],
    ammoTracking: "loose",
  },
  {
    id: "cr-stub-automatic",
    name: "Stub Automatic",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/3/–",
    damage: "1d10+3 I",
    pen: 0,
    clip: 9,
    reload: "Full",
    specialRules: "—",
    description:
      "Common automatic variant of the stub revolver with better rate of fire and clip capacity, but less reliability.",
    weight: "1.5 kg",
    value: "50 Thrones",
    availability: "Plentiful",
    ammoType: "Bullets",
    compatibleAmmoIds: [
      "cr-bullets",
      "cr-dumdum-bullets",
      "cr-man-stopper-bullets",
      "lw-purity-round",
    ],
    ammoTracking: "clip",
  },
  {
    id: "cr-hand-cannon",
    name: "Hand Cannon",
    source: SkillSource.CR,
    class: "Pistol",
    range: "35m",
    rof: "S/–/–",
    damage: "1d10+4 I",
    pen: 2,
    clip: 5,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Oversized stub revolver variant firing huge rounds with ferocious recoil. If not fired two-handed, attacks suffer a -10 Ballistic Skill penalty.",
    weight: "3 kg",
    value: "65 Thrones",
    availability: "Average",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets", "cr-dumdum-bullets", "cr-man-stopper-bullets"],
    ammoTracking: "loose",
  },
  {
    id: "cr-autogun",
    name: "Autogun",
    source: SkillSource.CR,
    class: "Basic",
    range: "90m",
    rof: "S/3/10",
    damage: "1d10+3 I",
    pen: 0,
    clip: 30,
    reload: "Full",
    specialRules: "—",
    description:
      "Cheap, rugged, easily manufactured solid projectile weapon common across the Imperium, especially in rougher regions.",
    weight: "3.5 kg",
    value: "100 Thrones",
    availability: "Average",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets", "cr-man-stopper-bullets"],
    ammoTracking: "clip",
  },
  {
    id: "cr-hunting-rifle",
    name: "Hunting Rifle",
    source: SkillSource.CR,
    class: "Basic",
    range: "150m",
    rof: "S/–/–",
    damage: "1d10+3 I",
    pen: 0,
    clip: 5,
    reload: "Full",
    specialRules: "Accurate",
    description:
      "Accurate long gun used by frontier hunters and wealthy sportsmen; in trained hands it can bring down prey at extreme range.",
    weight: "5 kg",
    value: "100 Thrones",
    availability: "Scarce",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "loose",
  },
  {
    id: "cr-shotgun",
    name: "Shotgun",
    source: SkillSource.CR,
    class: "Basic",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+4 I",
    pen: 0,
    clip: 2,
    reload: "2 Full",
    specialRules: "Scatter, Reliable",
    description:
      "Common short-ranged weapon favoured for urban and shipboard fighting, where its stopping power is most effective.",
    weight: "5 kg",
    value: "60 Thrones",
    availability: "Common",
    ammoType: "Shells",
    compatibleAmmoIds: ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"],
    ammoTracking: "loose",
  },
  {
    id: "cr-pump-action-shotgun",
    name: "Pump-Action Shotgun",
    source: SkillSource.CR,
    class: "Basic",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+4 I",
    pen: 0,
    clip: 8,
    reload: "2 Full",
    specialRules: "Scatter",
    description:
      "Enforcer-favoured shotgun with the strengths of a double-barrelled shotgun and greater clip capacity; its chambering sound is famously intimidating.",
    weight: "5 kg",
    value: "75 Thrones",
    availability: "Average",
    ammoType: "Shells",
    compatibleAmmoIds: ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"],
    ammoTracking: "loose",
  },
  {
    id: "cr-combat-shotgun",
    name: "Combat Shotgun",
    source: SkillSource.CR,
    class: "Basic",
    range: "30m",
    rof: "S/3/–",
    damage: "1d10+4 I",
    pen: 0,
    clip: 18,
    reload: "Full",
    specialRules: "Scatter",
    description:
      "Automatic drum-fed shotgun built for warfare, combining short-range destructive power with a loud intimidating rate of fire.",
    weight: "6.5 kg",
    value: "150 Thrones",
    availability: "Scarce",
    ammoType: "Shells",
    compatibleAmmoIds: ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"],
    ammoTracking: "loose",
  },
  {
    id: "cr-heavy-stubber",
    name: "Heavy Stubber",
    source: SkillSource.CR,
    class: "Heavy",
    range: "120m",
    rof: "–/–/10",
    damage: "1d10+4 I",
    pen: 3,
    clip: 200,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Support weapon popular on lower-tech worlds, with outlaws, and with hive gangers. " +
      "May use an ammunition drum instead of belt feed: Clip 40, cost +100 Thrones, reload reduced to 1 Full Action.",
    weight: "35 kg",
    value: "750 Thrones",
    availability: "Scarce",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "clip",
  },

  // Bolt
  {
    id: "cr-bolt-pistol",
    name: "Bolt Pistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/2/–",
    damage: "1d10+5 X",
    pen: 4,
    clip: 8,
    reload: "Full",
    specialRules: "—",
    description:
      "High-status Imperial sidearm firing destructive bolt shells. Expensive to maintain and feed, but feared for its battlefield power.",
    weight: "3.5 kg",
    value: "250 Thrones",
    availability: "Rare",
    ammoType: "Bolt Shells",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
    ammoTracking: "clip",
  },
  {
    id: "cr-boltgun",
    name: "Boltgun",
    source: SkillSource.CR,
    class: "Basic",
    range: "90m",
    rof: "S/2/–",
    damage: "1d10+5 X",
    pen: 4,
    clip: 24,
    reload: "Full",
    specialRules: "—",
    description:
      "Fires distinctive self-propelled explosive bolt rounds, known for their roar on discharge and violent detonation on impact.",
    weight: "7 kg",
    value: "500 Thrones",
    availability: "Very Rare",
    ammoType: "Bolt Shells",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
    ammoTracking: "clip",
  },
  {
    id: "cr-heavy-bolter",
    name: "Heavy Bolter",
    source: SkillSource.CR,
    class: "Heavy",
    range: "120m",
    rof: "–/–/10",
    damage: "2d10 X",
    pen: 5,
    clip: 60,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Heavy support version of the boltgun using larger bolt shells with more propellant, giving greater distance and stopping power against infantry and light vehicles.",
    weight: "40 kg",
    value: "2,000 Thrones",
    availability: "Very Rare",
    ammoType: "Bolt Shells",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
    ammoTracking: "clip",
  },

  // Melta
  {
    id: "cr-inferno-pistol",
    name: "Inferno Pistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "10m",
    rof: "S/–/–",
    damage: "2d10+4 E",
    pen: 12,
    clip: 3,
    reload: "Full",
    specialRules: "—",
    description:
      "Exceptionally rare and expensive melta pistol; possession is a mark of status among powerful and influential Imperial servants.",
    weight: "2.5 kg",
    value: "7,500 Thrones",
    availability: "Very Rare",
    ammoType: "Melta Canister (pistol)",
    compatibleAmmoIds: ["cr-melta-canister-pistol", "cr-melta-canister-basic"],
    ammoTracking: "clip",
  },
  {
    id: "cr-meltagun",
    name: "Meltagun",
    source: SkillSource.CR,
    class: "Basic",
    range: "20m",
    rof: "S/–/–",
    damage: "2d10+4 E",
    pen: 12,
    clip: 5,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Common melta weapon prized for close-range armour destruction and breaching. " +
      "May use a backpack and feed line instead of attached canisters, doubling Clip Size, adding 6 kg, and increasing cost by 100 Thrones.",
    weight: "8 kg",
    value: "4,000 Thrones",
    availability: "Rare",
    ammoType: "Melta Canister (basic)",
    compatibleAmmoIds: ["cr-melta-canister-pistol", "cr-melta-canister-basic"],
    ammoTracking: "clip",
  },

  // Plasma
  {
    id: "cr-plasma-pistol",
    name: "Plasma Pistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+6 E",
    pen: 6,
    clip: 10,
    reload: "4 Full",
    specialRules: "Recharge, Overheats",
    description:
      "Extremely dangerous pistol firing superheated plasma; capable of dropping almost any foe at close range but prone to overheating.",
    weight: "4 kg",
    value: "4,000 Thrones",
    availability: "Very Rare",
    ammoType: "Plasma Flask (pistol)",
    compatibleAmmoIds: ["cr-plasma-flask-pistol", "cr-plasma-flask-basic"],
    ammoTracking: "clip",
  },
  {
    id: "cr-plasma-gun",
    name: "Plasma Gun",
    source: SkillSource.CR,
    class: "Basic",
    range: "90m",
    rof: "S/2/–",
    damage: "1d10+6 E",
    pen: 6,
    clip: 20,
    reload: "8 Full",
    specialRules: "Recharge, Overheats",
    description:
      "Rare and ancient Imperial plasma weapon, still deadly after centuries of service. " +
      "May use a backpack and feed line instead of plasma flasks, doubling Clip Size, adding 6 kg, and increasing cost by 100 Thrones.",
    weight: "11 kg",
    value: "3,000 Thrones",
    availability: "Very Rare",
    ammoType: "Plasma Flask (basic)",
    compatibleAmmoIds: ["cr-plasma-flask-pistol", "cr-plasma-flask-basic"],
    ammoTracking: "clip",
  },

  // Flame
  {
    id: "cr-hand-flamer",
    name: "Hand Flamer",
    source: SkillSource.CR,
    class: "Pistol",
    range: "10m",
    rof: "S/–/–",
    damage: "1d10+4 E",
    pen: 2,
    clip: 2,
    reload: "2 Full",
    specialRules: "Flame",
    description:
      "Pistol-sized flame weapon for personal close combat, where its short range and poor precision are less of a drawback.",
    weight: "3.5 kg",
    value: "200 Thrones",
    availability: "Rare",
    ammoType: "Fuel (pistol)",
    compatibleAmmoIds: ["cr-fuel-pistol", "cr-fuel-basic", "dh-psyflame-ammunition"],
    ammoTracking: "clip",
  },
  {
    id: "cr-flamer",
    name: "Flamer",
    source: SkillSource.CR,
    class: "Basic",
    range: "20m",
    rof: "S/–/–",
    damage: "1d10+4 E",
    pen: 3,
    clip: 3,
    reload: "2 Full",
    specialRules: "Flame",
    description:
      "Projects burning promethium in a cone, ideal for enemies in cover or confined spaces. " +
      "May use a backpack fuel hose instead of an underslung canister, doubling Clip Size, adding 6 kg, and increasing cost by 100 Thrones.",
    weight: "6 kg",
    value: "300 Thrones",
    availability: "Scarce",
    ammoType: "Fuel (basic)",
    compatibleAmmoIds: ["cr-fuel-pistol", "cr-fuel-basic", "dh-psyflame-ammunition"],
    ammoTracking: "clip",
  },

  // Primitive
  {
    id: "cr-bolas",
    name: "Bolas",
    source: SkillSource.CR,
    class: "Thrown",
    range: "10m",
    rof: "S/–/–",
    damage: "—",
    pen: 0,
    clip: 1,
    reload: "—",
    specialRules: "Primitive, Snare, Inaccurate",
    description:
      "Usually non-lethal thrown entangling weapon used by bounty hunters and law enforcement to wrap targets in weighted cords or wire.",
    weight: "1.5 kg",
    value: "10 Thrones",
    availability: "Average",
    isThrown: true,
  },
  {
    id: "cr-hand-bow",
    name: "Hand Bow",
    source: SkillSource.CR,
    class: "Pistol",
    range: "15m",
    rof: "S/–/–",
    damage: "1d10 R",
    pen: 0,
    clip: 1,
    reload: "Full",
    specialRules: "Primitive",
    description:
      "Compact pistol-grip crossbow with short range, silent operation, and easy concealment, favoured by assassins.",
    weight: "1 kg",
    value: "200 Thrones",
    availability: "Rare",
    ammoType: "Arrows/Quarrels",
    compatibleAmmoIds: ["cr-arrows-quarrels", "lw-purity-round"],
    ammoTracking: "loose",
  },
  {
    id: "cr-flintlock-pistol",
    name: "Flintlock Pistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "15m",
    rof: "S/–/–",
    damage: "1d10+2 I",
    pen: 0,
    clip: 1,
    reload: "3 Full",
    specialRules: "Primitive, Unreliable, Inaccurate",
    description:
      "Primitive blackpowder pistol, ranging from noble-crafted duelling pieces to crude underhive pipe-and-powder weapons.",
    weight: "4 kg",
    value: "10 Thrones",
    availability: "Common",
    ammoType: "Shot",
    compatibleAmmoIds: ["cr-shot"],
    ammoTracking: "loose",
  },
  {
    id: "cr-musket",
    name: "Musket",
    source: SkillSource.CR,
    class: "Basic",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+2 I",
    pen: 0,
    clip: 1,
    reload: "5 Full",
    specialRules: "Primitive, Unreliable, Inaccurate",
    description:
      "Crude blackpowder longarm that fires once before reloading, is prone to failure, and is deadly mainly against unarmoured foes.",
    weight: "7 kg",
    value: "30 Thrones",
    availability: "Common",
    ammoType: "Shot",
    compatibleAmmoIds: ["cr-shot"],
    ammoTracking: "loose",
  },
  {
    id: "cr-bow",
    name: "Bow",
    source: SkillSource.CR,
    class: "Basic",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10 R",
    pen: 0,
    clip: 1,
    reload: "Half",
    specialRules: "Primitive, Reliable",
    description:
      "Ancient silent weapon still used across the galaxy, especially by assassins and gangers even on high-tech worlds.",
    weight: "2 kg",
    value: "10 Thrones",
    availability: "Common",
    ammoType: "Arrows/Quarrels",
    compatibleAmmoIds: ["cr-arrows-quarrels"],
    ammoTracking: "loose",
  },
  {
    id: "cr-sling",
    name: "Sling",
    source: SkillSource.CR,
    class: "Basic",
    range: "15m",
    rof: "S/–/–",
    damage: "1d10-2 I",
    pen: 0,
    clip: 1,
    reload: "Full",
    specialRules: "Primitive",
    description:
      "Simple but difficult-to-master projectile sling. When used to throw grenades, use the grenade's effects for Damage but keep the sling's Range.",
    weight: "0.5 kg",
    value: "10 Thrones",
    availability: "Plentiful",
  },
  {
    id: "cr-crossbow",
    name: "Crossbow",
    source: SkillSource.CR,
    class: "Basic",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10 R",
    pen: 0,
    clip: 1,
    reload: "2 Full",
    specialRules: "Primitive",
    description: "Mechanical bow weapon, less common than bows but equally deadly.",
    weight: "3 kg",
    value: "10 Thrones",
    availability: "Common",
    ammoType: "Arrows/Quarrels",
    compatibleAmmoIds: ["cr-arrows-quarrels", "lw-purity-round"],
    ammoTracking: "loose",
  },
  {
    id: "cr-throwing-star-knife",
    name: "Throwing Star/Knife",
    source: SkillSource.CR,
    class: "Thrown",
    range: "5m",
    rof: "S/–/–",
    damage: "1d5 R",
    pen: 0,
    clip: 1,
    reload: "—",
    specialRules: "Primitive",
    description:
      "Carefully crafted small thrown blade or star designed purely for throwing and capable of inflicting serious wounds.",
    weight: "0.5 kg",
    value: "5 Thrones",
    availability: "Plentiful",
    isThrown: true,
  },

  // Launchers
  {
    id: "cr-grenade-launcher",
    name: "Grenade Launcher",
    source: SkillSource.CR,
    class: "Basic",
    range: "60m",
    rof: "S/–/–",
    damage: "By grenade",
    pen: 0,
    clip: 6,
    reload: "Full",
    specialRules: "—",
    description:
      "Uses compressed gas to launch grenades in high arcs for indirect fire or directly against visible foes. Damage, Penetration, and qualities are determined by the grenade fired.",
    weight: "9 kg",
    value: "500 Thrones",
    availability: "Scarce",
    ammoType: "Grenades",
  },
  {
    id: "cr-rpg-launcher",
    name: "RPG Launcher",
    source: SkillSource.CR,
    class: "Heavy",
    range: "120m",
    rof: "S/–/–",
    damage: "By grenade",
    pen: 0,
    clip: 1,
    reload: "Full",
    specialRules: "—",
    description:
      "More powerful launcher than a standard grenade launcher, capable of accurately striking targets hundreds of metres away. Damage, Penetration, and qualities are determined by the ammunition fired.",
    weight: "15 kg",
    value: "1,200 Thrones",
    availability: "Rare",
    ammoType: "Grenades",
  },

  // Exotic
  {
    id: "cr-needle-pistol",
    name: "Needle Pistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10 R",
    pen: 0,
    clip: 6,
    reload: "Full",
    specialRules: "Accurate, Toxic",
    description:
      "Silent assassin weapon using a low-power laser to fire toxin-coated crystalline needles. Wounded enemies are quickly paralysed or killed.",
    weight: "1.5 kg",
    value: "1,250 Thrones",
    availability: "Very Rare",
    ammoType: "Exotic",
    compatibleAmmoIds: ["cr-exotic"],
    ammoTracking: "loose",
  },
  {
    id: "cr-web-pistol",
    name: "Web Pistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/–/–",
    damage: "—",
    pen: 0,
    clip: 1,
    reload: "Full",
    specialRules: "Snare",
    description:
      "Fires expanding sticky filaments. In addition to Snare, each failed escape Test adds cumulative -10 to future escape Tests; beyond -30, each further failed Test deals 1d5+1 Damage. Webbing breaks down after 1d10 rounds.",
    weight: "3.5 kg",
    value: "1,200 Thrones",
    availability: "Rare",
    ammoType: "Exotic",
    compatibleAmmoIds: ["cr-exotic"],
    ammoTracking: "loose",
  },
  {
    id: "cr-needle-rifle",
    name: "Needle Rifle",
    source: SkillSource.CR,
    class: "Basic",
    range: "180m",
    rof: "S/–/–",
    damage: "1d10 R",
    pen: 0,
    clip: 6,
    reload: "2 Full",
    specialRules: "Accurate, Toxic",
    description:
      "Sniper needle weapon combining range, stealth, and toxins, but with poor effectiveness against heavily armoured targets.",
    weight: "2 kg",
    value: "1,000 Thrones",
    availability: "Very Rare",
    ammoType: "Exotic",
    compatibleAmmoIds: ["cr-exotic"],
    ammoTracking: "loose",
  },
  {
    id: "cr-webber",
    name: "Webber",
    source: SkillSource.CR,
    class: "Basic",
    range: "50m",
    rof: "S/–/–",
    damage: "—",
    pen: 0,
    clip: 1,
    reload: "Full",
    specialRules: "Snare",
    description:
      "Larger web weapon used to subdue crowds and lawbreakers. Its webbing breaks down and flakes away after 1d5 hours.",
    weight: "8 kg",
    value: "750 Thrones",
    availability: "Rare",
    ammoType: "Exotic",
    compatibleAmmoIds: ["cr-exotic"],
    ammoTracking: "loose",
  },

  // ── Book of Judgement ─────────────────────────────────────────────────────
  {
    id: "ius-automatic-pistol",
    name: "Ius Automatic",
    source: SkillSource.BoJ,
    class: "Pistol",
    range: "30m",
    rof: "S/3/–",
    damage: "1d10+3 I",
    pen: 0,
    clip: 11,
    reload: "Full",
    specialRules: "Reliable",
    description:
      "Ubiquitous Arbites and Scintillan enforcer backup pistol. Sturdy, reliable, foolproof, and built to survive punishment that would damage lesser firearms.",
    weight: "1.7 kg",
    value: "95 Thrones",
    availability: "Average",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets", "cr-man-stopper-bullets"],
    ammoTracking: "clip",
  },
  {
    id: "judgeslayer-handcannon",
    name: '"Judgeslayer" Handcannon',
    source: SkillSource.BoJ,
    class: "Pistol",
    range: "20m",
    rof: "S/–/–",
    damage: "1d10+2 I",
    pen: 6,
    clip: 4,
    reload: "2 Full",
    specialRules: "Unreliable, Unstable",
    description:
      "Backstreet anti-Arbites handcannon built to stop carapace-armoured law officers, with dangerous disregard for the user's safety.",
    weight: "3.5 kg",
    value: "100 Thrones",
    availability: "Average",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets", "cr-dumdum-bullets", "cr-man-stopper-bullets"],
    ammoTracking: "loose",
  },
  {
    id: "raffir-ringleader-pistol",
    name: "Raffir Ringleader Pistol",
    source: SkillSource.BoJ,
    class: "Pistol",
    range: "30m",
    rof: "S/–/–",
    damage: "1d10+4 I",
    pen: 3,
    clip: 5,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Huge Raffir clan shock-and-terror pistol issued to senior Arbites officers for executing high-profile targets and breaking follower morale.",
    weight: "0.25 kg",
    value: "500 Thrones",
    availability: "Rare",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "loose",
  },
  {
    id: "raffir-pax-factorem-rifle",
    name: "Raffir 'Pax Factorem' Rifle",
    source: SkillSource.BoJ,
    class: "Basic",
    range: "150m",
    rof: "S/2/–",
    damage: "1d10+3 I",
    pen: 2,
    clip: 5,
    reload: "Full",
    specialRules: "Accurate",
    description:
      "Large calibre semi-automatic Gunmetal City sniper rifle used by assassins and enforcer sharpshooter teams.",
    weight: "6.5 kg",
    value: "750 Thrones",
    availability: "Rare",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "loose",
  },
  {
    id: "vox-legi-combat-shotgun",
    name: "Vox Legi-Pattern Arbites Combat Shotgun",
    source: SkillSource.BoJ,
    class: "Basic",
    range: "30m",
    rof: "S/2/–",
    damage: "1d10+9 I",
    pen: 0,
    clip: 14,
    reload: "2 Full",
    specialRules: "Reliable, Scatter",
    description:
      "Large-bore Arbites combat shotgun with heavy psychological impact. Counts as a club in melee. " +
      "The user may hand-load one shotgun shell as a single Full Action; it may be a different shell type and must be the next shell fired.",
    weight: "7 kg",
    value: "400 Thrones",
    availability: "Very Rare",
    ammoType: "Shells",
    compatibleAmmoIds: ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"],
    ammoTracking: "loose",
  },
  {
    id: "bulldog-heavy-stubber",
    name: "Bulldog Heavy Stubber",
    source: SkillSource.BoJ,
    class: "Heavy",
    range: "120m",
    rof: "–/–/8",
    damage: "1d10+4 I",
    pen: 3,
    clip: 50,
    reload: "Full",
    specialRules: "Reliable",
    description:
      "Reliable Arbites heavy stubber that can switch between belt and magazine feed, accepts exotic ammunition well, and can be hip-fired in a gyro-mount or Rhino-mounted.",
    weight: "30 kg",
    value: "800 Thrones",
    availability: "Rare",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "clip",
  },

  // ── Creatures Anathema ───────────────────────────────────────────────────

  // Ork Weaponry
  {
    id: "ca-slugga",
    name: "Slugga",
    source: SkillSource.CA,
    class: "Pistol",
    range: "20m",
    rof: "S/3/–",
    damage: "1d10+4 I",
    pen: 0,
    clip: 18,
    reload: "Full",
    specialRules: "Inaccurate, Unreliable (not for Orks)",
    description:
      "Basic Ork solid-shot pistol. Devastating up close, though Ork inaccuracy means many sluggas cause more harm as crude clubs than as firearms.",
    weight: "2 kg",
    value: "100 Thrones",
    availability: "Scarce (Common for Orks)",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "clip",
  },
  {
    id: "ca-shoota",
    name: "Shoota",
    source: SkillSource.CA,
    class: "Basic",
    range: "60m",
    rof: "S/3/10",
    damage: "1d10+4 I",
    pen: 0,
    clip: 30,
    reload: "Full",
    specialRules: "Inaccurate, Unreliable (not for Orks)",
    description:
      "Catch-all Ork firearm for loud short- to mid-range guns, cobbled together to throw out hails of bullets with little concern for accuracy or recoil.",
    weight: "4 kg",
    value: "200 Thrones",
    availability: "Scarce (Common for Orks)",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "clip",
  },
  {
    id: "ca-snazzgun",
    name: "Snazzgun",
    source: SkillSource.CA,
    class: "Basic",
    range: "100m",
    rof: "S/2/–",
    damage: "2d10 I or E",
    pen: "1d10",
    clip: 20,
    reload: "2 Full",
    specialRules: "Inaccurate, Overheats, Unreliable",
    description:
      "Flash Git shoota variant that fires either energy bolts or shells, chosen per weapon. Penetration is 1d10, rolled separately each shot. " +
      "Not Unreliable for Orks. Targeting equipment or bionics remove Inaccurate instead of granting bonuses to hit.",
    weight: "7 kg",
    value: "1,500 Thrones",
    availability: "Rare (Scarce for Orks)",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "clip",
  },

  // Eldar Weaponry
  {
    id: "ca-shuriken-pistol",
    name: "Shuriken Pistol",
    source: SkillSource.CA,
    class: "Pistol",
    range: "20m",
    rof: "S/3/5",
    damage: "1d10+2 R",
    pen: 4,
    clip: 40,
    reload: "2 Full",
    specialRules: "Reliable",
    description:
      "Eldar shuriken weapon grown from wraithbone, firing monomolecular discs. Shuriken ammunition is Very Rare and has a base price of 500 Thrones per clip.",
    weight: "1.2 kg",
    value: "5,000 Thrones",
    availability: "Very Rare",
    ammoType: "Shuriken Clip",
    compatibleAmmoIds: ["ca-shuriken-clip"],
    ammoTracking: "clip",
  },
  {
    id: "ca-avenger-shuriken-catapult",
    name: "Avenger Shuriken Catapult",
    source: SkillSource.CA,
    class: "Basic",
    range: "80m",
    rof: "S/3/10",
    damage: "1d10+4 R",
    pen: 6,
    clip: 100,
    reload: "2 Full",
    specialRules: "Reliable, Tearing",
    description:
      "Dire Avenger variant of the shuriken catapult, grown from wraithbone with a longer barrel and built-in range-finders for greater danger at extended range. " +
      "Shuriken ammunition is Very Rare and has a base price of 500 Thrones per clip.",
    weight: "2.5 kg",
    value: "9,500 Thrones",
    availability: "Very Rare",
    ammoType: "Shuriken Clip",
    compatibleAmmoIds: ["ca-shuriken-clip"],
    ammoTracking: "clip",
  },
  {
    id: "ca-ranger-long-rifle",
    name: "Ranger Long Rifle",
    source: SkillSource.CA,
    class: "Basic",
    range: "200m",
    rof: "S/–/–",
    damage: "1d10+3 E",
    pen: 2,
    clip: 40,
    reload: "Full",
    specialRules: "Accurate, Reliable",
    description:
      "Eldar Ranger sniper rifle grown for its user, with crystals able to focus a tight beam over great distance. " +
      "Pen doubles to 4 with Aim, or triples to 6 with a Full Action Aim.",
    weight: "2 kg",
    value: "8,500 Thrones",
    availability: "Very Rare",
    ammoType: "Shuriken Clip",
    compatibleAmmoIds: ["ca-shuriken-clip"],
    ammoTracking: "clip",
  },

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
    description:
      "Adepta Sororitas bolter blessed and presented to a Battle Sister, maintained as a venerated heirloom and symbol of faith and judgement.",
    weight: "9 kg",
    value: "3,000 Thrones",
    availability: "Very Rare",
    ammoType: "Bolt Shells",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
    ammoTracking: "clip",
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
    description:
      "Ecclesiarchy storm bolter, effectively two synchronised bolters with a high rate of fire and high ammunition consumption.",
    weight: "12 kg",
    value: "9,000 Thrones",
    availability: "Extremely Rare",
    ammoType: "Bolt Shells",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
    ammoTracking: "clip",
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
    description:
      "Designed for Seraphim to use as a pair, including in melee. With Dual Shot, a character may fire both at once, increasing Damage by 1d10 and doubling Penetration.",
    weight: "2 kg",
    value: "9,000 Thrones",
    availability: "Extremely Rare",
    ammoType: "Melta Canister (pistol)",
    compatibleAmmoIds: ["cr-melta-canister-pistol", "cr-melta-canister-basic"],
    ammoTracking: "clip",
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
    description:
      "Paired Seraphim hand flamers designed for ranged or melee use by properly trained wielders. " +
      "With Dual Shot, both flamers make a combined attack dealing 1d10+10 Damage and imposing -20 on targets' Agility Tests to avoid the flames. " +
      "May attack a single melee target without expending ammunition, unless the GM rules otherwise over a long battle.",
    weight: "2 kg",
    value: "1,000 Thrones",
    availability: "Extremely Rare",
    ammoType: "Fuel (pistol)",
    compatibleAmmoIds: ["cr-fuel-pistol", "cr-fuel-basic", "dh-psyflame-ammunition"],
    ammoTracking: "clip",
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
    description:
      "Large crew-served flamer; characters in power armour or with Strength 40+ can carry the promethium and operate it. " +
      "With Sanctified Ammo, automatically confirms Righteous Fury against Daemons and Psykers.",
    weight: "45 kg",
    value: "1,000 Thrones",
    availability: "Rare",
    ammoType: "Fuel (basic)",
    compatibleAmmoIds: ["cr-fuel-basic", "dh-psyflame-ammunition"],
    ammoTracking: "clip",
  },

  // ── Daemon Hunter ─────────────────────────────────────────────────────────

  // Las
  {
    id: "dh-digital-laser",
    name: "Digital Laser",
    source: SkillSource.DH,
    class: "Pistol",
    range: "4m",
    rof: "S/–/–",
    damage: "1d10+3 E",
    pen: 7,
    clip: 1,
    reload: "Special",
    specialRules: "Reliable",
    description:
      "Each digi-weapon can only be fired once, and reloading one is exceptionally difficult. " +
      "Can be fired even when the character is holding something else. May be used in melee like a pistol. " +
      "–20 to detect or recognise as a weapon.",
    weight: "0.1 kg",
    value: "9,000 Thrones",
    availability: "Unique",
  },
  {
    id: "dh-synapse-disruptor",
    name: "Synapse Disruptor",
    source: SkillSource.DH,
    class: "Basic",
    range: "40m",
    rof: "S/–/–",
    damage: "Special",
    pen: 0,
    clip: 10,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Fires a near-invisible beam. If maintained for 3+ rounds (BS Test each round if target moves >5m): " +
      "first failed WP Test = roll on Hallucinogen Effects Table; second failure = –20 to concentration " +
      "Tests for 1d5 minutes. Disguised as a lasgun.",
    weight: "5 kg",
    value: "3,500 Thrones",
    availability: "Very Rare",
    ammoType: "Special Power Cell",
    compatibleAmmoIds: ["dh-synapse-power-cell"],
    ammoTracking: "clip",
  },

  // Solid Projectile
  {
    id: "dh-baraspian-palm-gun",
    name: "Baraspian Palm Gun",
    source: SkillSource.DH,
    class: "Pistol",
    range: "5m",
    rof: "S/–/–",
    damage: "1d10 R",
    pen: 0,
    clip: 2,
    reload: "Full",
    specialRules: "—",
    description:
      "–20 to detect/recognise when disassembled (Ordinary +10 Tech-Use to assemble/disassemble). " +
      "On a BS roll of 94–00, the user shoots their own arm (1 degree of success hit).",
    weight: "0.5 kg",
    value: "150 Thrones",
    availability: "Rare",
    ammoType: "Bullets",
    compatibleAmmoIds: ["cr-bullets"],
    ammoTracking: "loose",
  },
  {
    id: "dh-hell-rifle",
    name: "Hell Rifle",
    source: SkillSource.DH,
    class: "Basic",
    range: "300m",
    rof: "S/–/–",
    damage: "2d10+4 R",
    pen: 7,
    clip: 0,
    reload: "—",
    specialRules: "Felling (2)",
    description:
      "Radical Ordo Malleus weapon that fires impossibly sharp shards of matter, possibly Daemonic in origin. " +
      "No specimen has been surrendered to the Adeptus Mechanicus, so its true function is unknown.",
    weight: "10 kg",
    value: "—",
    availability: "Unique",
  },
  {
    id: "dh-sting-blunt",
    name: "Sting-Blunt",
    source: SkillSource.DH,
    class: "Pistol",
    range: "30m",
    rof: "S/2/–",
    damage: "1d10 R",
    pen: 0,
    clip: 5,
    reload: "Full",
    specialRules: "Shocking",
    description:
      "Low-calibre Malfian pistol using a power pack and charged circuitry-traced bullets to deliver impact plus electric shock. " +
      "Sting-Blunt ammunition costs 50 Thrones per magazine.",
    weight: "1.5 kg",
    value: "350 Thrones",
    availability: "Common",
    ammoType: "Sting-Blunt Magazine",
    compatibleAmmoIds: ["dh-sting-blunt-magazine"],
    ammoTracking: "clip",
  },

  // Exotic
  {
    id: "dh-conversion-beamer",
    name: "Conversion Beamer",
    source: SkillSource.DH,
    class: "Heavy",
    range: "100m",
    rof: "S/–/–",
    damage: "1d10+9 / 3d10+9 / 6d10+12 E",
    pen: 0,
    clip: 4,
    reload: "2 Full",
    specialRules: "—",
    description:
      "Damage varies by range — ≤15m: 1d10+9 Pen 2; up to Short Range: 3d10+9 Pen 8 Felling (1); " +
      "beyond Short Range: 6d10+12 Pen 14 Felling (2) Blast (2).",
    weight: "85 kg",
    value: "—",
    availability: "Unique",
    ammoType: "Exotic",
    compatibleAmmoIds: ["cr-exotic"],
    ammoTracking: "loose",
  },
  {
    id: "dh-tyranicus-heavy-webber",
    name: "Tyranicus Heavy Webber",
    source: SkillSource.DH,
    class: "Heavy",
    range: "75m",
    rof: "S/–/–",
    damage: "—",
    pen: 0,
    clip: 1,
    reload: "2 Full",
    specialRules: "Blast (4), Snare",
    description:
      "Each failed escape Test adds cumulative –10 to future escape Tests; " +
      "at –30, target takes 1d5+1 damage per failed Test. Webbing dissolves after 2d5 hours.",
    weight: "12 kg",
    value: "2,500 Thrones",
    availability: "Rare",
    ammoType: "Exotic",
    compatibleAmmoIds: ["cr-exotic"],
    ammoTracking: "loose",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────

  {
    id: "lw-lathe-laspistol",
    name: "Lathe Laspistol",
    source: SkillSource.LW,
    class: "Pistol",
    range: "40m",
    rof: "S/2/–",
    damage: "1d10+5 E",
    pen: 2,
    clip: 0,
    reload: "—",
    specialRules: "Tearing",
    description:
      "Integrated Weapon: unlimited ammunition and no reload while connected to a Potentia Coil. " +
      "Does not Jam; if it would Jam, the user gains 1 Fatigue instead. " +
      "Physically linked to the user and requires an Ordinary (+10) Tech-Use Test and a Half Action to disconnect or reconnect. " +
      "Smallest integrated weapon in standard Crimson Guard use; deadly, with good rate of fire and penetration, but shorter range than the rifle.",
    weight: "2 kg",
    value: "150 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-lathe-lasrifle",
    name: "Lathe Lasrifle",
    source: SkillSource.LW,
    class: "Basic",
    range: "100m",
    rof: "S/2/–",
    damage: "1d10+5 E",
    pen: 2,
    clip: 0,
    reload: "—",
    specialRules: "Tearing",
    description:
      "Integrated Weapon: unlimited ammunition and no reload while connected to a Potentia Coil. " +
      "Does not Jam; if it would Jam, the user gains 1 Fatigue instead. " +
      "Physically linked to the user and requires an Ordinary (+10) Tech-Use Test and a Half Action to disconnect or reconnect. " +
      "Ancient archeotech-derived las weapon and standard weapon of the Crimson Guard, packing more punch than regular lasguns.",
    weight: "4.5 kg",
    value: "200 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-lathe-lasblaster",
    name: "Lathe Lasblaster",
    source: SkillSource.LW,
    class: "Basic",
    range: "80m",
    rof: "S/–/4",
    damage: "1d10+5 E",
    pen: 8,
    clip: 0,
    reload: "—",
    specialRules: "Tearing",
    description:
      "Integrated Weapon: unlimited ammunition and no reload while connected to a Potentia Coil. " +
      "Does not Jam; if it would Jam, the user gains 1 Fatigue instead. " +
      "Replaces the user's hand and forearm at the elbow; the arm cannot be used for anything else once installed. " +
      "Installed using bionics and implants rules but does not add to Toughness Bonus. " +
      "Tests to adapt external power supplies or recharge depleted Lathe-Lasblasters suffer an additional -20 penalty.",
    weight: "6 kg",
    value: "950 Thrones",
    availability: "Extremely Rare",
  },
  {
    id: "lw-phased-plasma-rifle",
    name: "Phased Plasma Rifle",
    source: SkillSource.LW,
    class: "Basic",
    range: "100m",
    rof: "S/2/4",
    damage: "2d10 E",
    pen: 6,
    clip: 0,
    reload: "—",
    specialRules: "—",
    description:
      "Integrated Weapon: unlimited ammunition and no reload while connected to a Potentia Coil. " +
      "Does not Jam; if it would Jam, the user gains 1 Fatigue instead. " +
      "A Crimson Guard special issue plasma weapon that largely removes normal plasma drawbacks, almost eliminating the need for recharging and greatly reducing excess heat.",
    weight: "12 kg",
    value: "1,200 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-catalytic-mass-driver",
    name: "Catalytic Mass Driver",
    source: SkillSource.LW,
    class: "Basic",
    range: "120m",
    rof: "S/–/5",
    damage: "1d10 R",
    pen: 12,
    clip: 0,
    reload: "—",
    specialRules: "—",
    description:
      "Integrated Weapon: uses energy from a Potentia Coil to propel tiny metal shards at very high velocity. " +
      "One of the few integrated weapons known to run out of ammunition, though its drum-sized magazines can last for many hours of constant use.",
    weight: "7 kg",
    value: "600 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-heavy-catalytic-mass-driver",
    name: "Heavy Catalytic Mass Driver",
    source: SkillSource.LW,
    class: "Heavy",
    range: "150m",
    rof: "S/–/10",
    damage: "1d10+4 R",
    pen: 12,
    clip: 0,
    reload: "—",
    specialRules: "—",
    description:
      "Integrated Weapon: larger version of the standard Catalytic Mass Driver. " +
      "Uses Potentia Coil energy to propel tiny metal shards at very high velocity; its drum-sized magazines can last for many hours of constant use.",
    weight: "16 kg",
    value: "2,800 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-graviton-pulse-launcher",
    name: "Graviton Pulse Launcher",
    source: SkillSource.LW,
    class: "Heavy",
    range: "20m",
    rof: "S/–/–",
    damage: "Special",
    pen: 0,
    clip: 0,
    reload: "—",
    specialRules: "Blast (6), Inaccurate",
    description:
      "Integrated Weapon: projects a barely contained gravitic orb with limited range. " +
      "Everything caught in the blast must take a Hard (-20) Strength Test or be knocked down. " +
      "Being thrown to a solid surface from standing inflicts 1d5 Impact Damage with the Primitive quality to the Body, with worse effects possible at the GM's discretion. " +
      "For 1d5 rounds, moving or performing physical actions within the blast radius requires an Arduous (-40) Strength Test.",
    weight: "24 kg",
    value: "4,700 Thrones",
    availability: "Extremely Rare",
  },
];

// ─── Melee Weapons ───────────────────────────────────────────────────────────

export const MELEE_WEAPON_REFERENCE: MeleeWeaponRef[] = [
  // ── Core Rulebook ─────────────────────────────────────────────────────────

  // Primitive
  {
    id: "cr-axe",
    name: "Axe",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+1 R",
    pen: 0,
    specialRules: "Primitive, Unbalanced",
    description:
      "Brutal tool and weapon; lacks a sword's reach and parrying ability, but creates lethal wounds when it lands.",
    weight: "4 kg",
    value: "20 Thrones",
    availability: "Average",
  },
  {
    id: "cr-brass-knuckles",
    name: "Brass Knuckles",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d5-1 I",
    pen: 0,
    specialRules: "Primitive",
    description:
      "Simple knuckle dusters worn over the fingers, turning a punch into a bone-breaking blow.",
    weight: "0.5 kg",
    value: "5 Thrones",
    availability: "Plentiful",
  },
  {
    id: "cr-club",
    name: "Club",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Primitive",
    description:
      "Primitive bludgeon, maul, or club relying on weight and strength to cave in a foe's skull.",
    weight: "2 kg",
    value: "5 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-flail",
    name: "Flail",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+2 I",
    pen: 0,
    specialRules: "Flexible, Primitive",
    description:
      "Difficult-to-wield pole or handle with spiked balls on chains or rods, capable of inflicting terrible wounds.",
    twoHanded: true,
    weight: "4 kg",
    value: "20 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-great-weapon",
    name: "Great Weapon",
    source: SkillSource.CR,
    class: "Melee",
    damage: "2d10 R",
    pen: 2,
    specialRules: "Primitive, Unwieldy",
    description:
      "Oversized two-handed version of a melee weapon, such as a huge axe, hammer, sword, or club, built to inflict serious damage with each blow.",
    twoHanded: true,
    weight: "7 kg",
    value: "70 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-hammer",
    name: "Hammer",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+1 I",
    pen: 0,
    specialRules: "Primitive, Unbalanced",
    description:
      "Heavy striking tool turned weapon, favoured by many Imperial servants as a symbol of righteous justice.",
    weight: "4 kg",
    value: "10 Thrones",
    availability: "Common",
  },
  {
    id: "cr-improvised",
    name: "Improvised",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10-2 I",
    pen: 0,
    specialRules: "Primitive, Unbalanced",
    description:
      "Any handy weighted object used as a weapon. Striking with the butt of a Basic ranged weapon counts as an improvised weapon.",
    weight: "—",
    value: "—",
    availability: "—",
  },
  {
    id: "cr-knife",
    name: "Knife",
    source: SkillSource.CR,
    class: "Melee, Thrown",
    damage: "1d5 R",
    pen: 0,
    specialRules: "Primitive",
    description: "Ubiquitous backup weapon across the Imperium. Can be thrown up to 3 metres.",
    weight: "0.5 kg",
    value: "5 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-shield",
    name: "Shield",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d5 I",
    pen: 0,
    specialRules: "Defensive, Primitive",
    description:
      "Protective defensive weapon made from anything from improvised sheets to armourplas. Attacking with a shield imposes a -20 penalty.",
    weight: "3 kg",
    value: "25 Thrones",
    availability: "Average",
  },
  {
    id: "cr-spear",
    name: "Spear",
    source: SkillSource.CR,
    class: "Melee, Thrown",
    damage: "1d10 R",
    pen: 0,
    specialRules: "Primitive",
    description:
      "Common hunting and warrior weapon on feral and medieval worlds. Can be thrown up to 10 metres.",
    twoHanded: true,
    weight: "3 kg",
    value: "15 Thrones",
    availability: "Common",
  },
  {
    id: "cr-sword",
    name: "Sword",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10 R",
    pen: 0,
    specialRules: "Balanced, Primitive",
    description:
      "Blade weapon ranging from short daggers to elaborate duelling swords, with exact shape and edge depending on purpose and user taste.",
    weight: "3 kg",
    value: "15 Thrones",
    availability: "Common",
  },
  {
    id: "cr-staff",
    name: "Staff",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Balanced, Primitive",
    description:
      "Long simple weapon useful for striking before an enemy can close; common among pilgrims and travellers.",
    twoHanded: true,
    weight: "3 kg",
    value: "10 Thrones",
    availability: "Plentiful",
  },

  // Chain
  {
    id: "cr-chainsword",
    name: "Chainsword",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+2 R",
    pen: 2,
    specialRules: "Balanced, Tearing",
    description:
      "Sword-shaped chain weapon with exposed spinning teeth that bite into flesh and bone.",
    weight: "6 kg",
    value: "275 Thrones",
    availability: "Rare",
  },
  {
    id: "cr-chain-axe",
    name: "Chain Axe",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+4 R",
    pen: 2,
    specialRules: "Tearing",
    description:
      "Heavy brutal chain weapon that delivers hideous damage; double-sided versions can continue operating if one side is fouled.",
    weight: "13 kg",
    value: "450 Thrones",
    availability: "Very Rare",
  },

  // Power
  {
    id: "cr-power-blade",
    name: "Power Blade",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+3 E",
    pen: 6,
    specialRules: "Power Field",
    description:
      "Dagger-sized power weapon made far deadlier by its field and easily concealed by those who prefer to appear unarmed.",
    weight: "1.5 kg",
    value: "1,750 Thrones",
    availability: "Very Rare",
  },
  {
    id: "cr-power-sword",
    name: "Power Sword",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+5 E",
    pen: 6,
    specialRules: "Balanced, Power Field",
    description:
      "Rare and valuable power sword, often a treasured heirloom and deadly status symbol in skilled hands.",
    weight: "3.5 kg",
    value: "2,500 Thrones",
    availability: "Very Rare",
  },

  // Shock
  {
    id: "cr-shock-maul",
    name: "Shock Maul",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Shocking",
    description:
      "Crowd-control shock weapon common among Arbites and enforcers, capable of being deadly in enthusiastic hands.",
    weight: "2.5 kg",
    value: "150 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-electro-flail",
    name: "Electro-Flail",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+2 I",
    pen: 0,
    specialRules: "Flexible, Shocking",
    description:
      "Short-reach shock flail with multiple tendril lashes, striking in masses of blows to incapacitate foes.",
    twoHanded: true,
    weight: "4.5 kg",
    value: "375 Thrones",
    availability: "Rare",
  },

  // ── Book of Judgement ─────────────────────────────────────────────────────

  // Primitive
  {
    id: "boj-cosh",
    name: "Cosh",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d10-1 I",
    pen: 0,
    specialRules: "Primitive",
    description:
      "Weighted flexible cosh used to knock out targets. Against a Surprised opponent, deals Fatigue instead of Wounds, still reduced by Armour and Toughness.",
    weight: "1 kg",
    value: "15 Thrones",
    availability: "Common",
  },
  {
    id: "boj-shiv",
    name: "Shiv",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d5-1 R",
    pen: 0,
    specialRules: "Primitive, Unbalanced",
    description:
      "Improvised stabbing weapon made from whatever materials are available; crude, fragile, and deadly in desperate hands.",
    weight: "0.5 kg",
    value: "—",
    availability: "Plentiful",
  },
  {
    id: "boj-side-handle-baton",
    name: "Side Handle Baton",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "—",
    description:
      "Club with a side handle for defensive forearm use. Grants +5 to Weapon Skill Tests made to Parry.",
    weight: "2.5 kg",
    value: "30 Thrones",
    availability: "Average",
  },

  // Power
  {
    id: "agni-power-maul",
    name: "Agni-pattern Power Maul",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "Low: 1d10 I; High: 1d10+4 E",
    pen: "Low: 0; High: 4",
    specialRules: "Shocking, Power Field",
    description:
      "Small inexpensive power maul with adjustable energy settings. Low setting has Shocking; high setting has Power Field. User may switch settings once per turn as a Free Action.",
    weight: "0.75 kg",
    value: "1,500 Thrones",
    availability: "Rare",
  },
  {
    id: "bakka-power-ram",
    name: "Bakka-pattern Power Ram",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "2d10 I",
    pen: 6,
    specialRules: "Power Field, Unwieldy",
    description:
      "Heavy entry ram designed to breach doors and walls. Weapon Skill Tests in melee suffer -20. Doubles damage against inanimate structures such as doors and walls.",
    twoHanded: true,
    weight: "25 kg",
    value: "1,250 Thrones",
    availability: "Rare",
  },
  {
    id: "cyclopea-power-maul",
    name: "Cyclopea-pattern Power Maul",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "2d10 I",
    pen: 5,
    specialRules: "Power Field, Unwieldy, Shocking",
    description:
      "Huge two-handed riot maul with an overcharged disruption field. On hit, grants Fear (1) against that target's allies for the remainder of the encounter.",
    twoHanded: true,
    weight: "8.5 kg",
    value: "4,000 Thrones",
    availability: "Rare",
  },
  {
    id: "lathe-power-maul",
    name: "Lathe-pattern Power Maul",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "Low: 1d10-1 I; High: 1d10+5 I",
    pen: "Low: 0; High: 5",
    specialRules: "Shocking, Power Field",
    description:
      "Elegant Lathe-crafted power maul handled more like a sword than a club. Low setting has Shocking; high setting has Power Field. User may switch settings once per turn as a Free Action. +5 WS when attempting to Parry.",
    weight: "0.5 kg",
    value: "2,100 Thrones",
    availability: "Very Rare",
  },

  // Shock
  {
    id: "boj-electropick",
    name: "Electropick",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d10+4 E",
    pen: 6,
    specialRules: "Power Field, Unwieldy, Unstable, Overheats",
    description:
      "Modified mining-tool disruptor weapon used by criminals against heavily armoured Arbitrators and enforcers; rare surviving examples are prized on the black market.",
    weight: "3 kg",
    value: "800 Thrones",
    availability: "Very Rare",
  },
  {
    id: "hredrian-shock-staff",
    name: "Hredrian Shock-Staff",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Balanced, Shocking",
    description:
      "Double-ended shock staff used by the Hallmarshals of Hredrin to keep knife-wielding foes at reach before stunning them.",
    weight: "4 kg",
    value: "325 Thrones",
    availability: "Rare",
  },
  {
    id: "orthlack-shock-baton",
    name: 'Orthlack "Grudge"-pattern Extendable Shock Baton',
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d10-1 I",
    pen: 0,
    specialRules: "Shocking",
    description:
      "Concealable baton that expands from a palm-width rod to an eighteen-inch club. Its tiny shock generator has five Shock discharges before recharging.",
    weight: "1.5 kg",
    value: "200 Thrones",
    availability: "Scarce",
  },
  {
    id: "boj-shocker",
    name: "Shocker",
    source: SkillSource.BoJ,
    class: "Melee",
    damage: "1d5-2 E",
    pen: 0,
    specialRules: "Shocking",
    description:
      "Small box-shaped shock device with two spikes; pressed against exposed skin to deliver a stunning electrical discharge.",
    weight: "0.75 kg",
    value: "90 Thrones",
    availability: "Scarce",
  },

  // Shields
  // ── Creatures Anathema ───────────────────────────────────────────────────
  {
    id: "ca-choppa",
    name: "Choppa",
    source: SkillSource.CA,
    class: "Melee",
    damage: "1d10+1 R",
    pen: 2,
    specialRules: "Tearing, Unbalanced",
    description:
      "Catch-all Ork melee weapon, covering crude cleavers, machetes, smoky chainblades, and simple powered blades.",
    weight: "5 kg",
    value: "600 Thrones",
    availability: "Scarce (Common for Orks)",
  },

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "baptismal-hammer",
    name: "Baptismal Hammer/Mace",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10+1 I",
    pen: 0,
    specialRules: "Toxic, Unbalanced",
    description:
      "Ecclesiarchy hammer or mace with an integral tank of caustic fluid. Has Toxic. " +
      "Alternatively the tank can be filled with promethium and an igniter, forcing struck targets to make an Agility Test to avoid catching fire.",
    weight: "4.5 kg",
    value: "500 Thrones",
    availability: "Scarce",
  },
  {
    id: "daemon-pike",
    name: "Daemon Pike",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10 R",
    pen: 2,
    specialRules: "Holy",
    description:
      "Three- to four-metre adamantine-silver and diamantine polearm for breaking charges by daemons, mutants, and warp creatures. " +
      "Prayers, blessed oils, and sacred waters make it a Holy weapon.",
    weight: "4 kg",
    value: "1,000 Thrones",
    availability: "Rare",
  },
  {
    id: "ecclesiarchy-corsesque",
    name: "Ecclesiarchy Corsesque",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10 R",
    pen: 2,
    specialRules: "Unbalanced, Holy",
    description:
      "Ecclesiarchy symbol forged into a sharp blessed weapon, made only for suitably ranked individuals rather than normal purchase. " +
      "Counts as a Holy weapon.",
    twoHanded: true,
    weight: "6 kg",
    value: "—",
    availability: "Issued Only",
  },
  {
    id: "eviscerator",
    name: "Eviscerator",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10+10 R",
    pen: 5,
    specialRules: "Tearing, Unwieldy",
    description:
      "Massive two-handed chain weapon fitted with a crude disruption field. " +
      "On an attack roll of 96-00, the wielder must succeed on an Agility Test or take damage from the weapon, including Strength Bonus.",
    twoHanded: true,
    weight: "12 kg",
    value: "750 Thrones",
    availability: "Scarce",
  },
  {
    id: "fire-lance",
    name: "Fire Lance",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10 R",
    pen: 0,
    specialRules: "—",
    description:
      "Fire Lance / Flame Hammer: ignores 3 points of the target's Toughness Bonus after modifiers such as Unnatural Toughness. " +
      "Cauterizes wounds it inflicts, so ongoing bleeding effects caused by the weapon are ignored. " +
      "May fire once as a Flamer; after doing so it needs refuelling and no longer ignores Toughness or cauterizes wounds until recharged.",
    weight: "4 kg",
    value: "550 Thrones",
    availability: "Rare",
  },
  {
    id: "flame-hammer",
    name: "Flame Hammer",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "2d10 I",
    pen: 2,
    specialRules: "Unwieldy",
    description:
      "Fire Lance / Flame Hammer: ignores 3 points of the target's Toughness Bonus after modifiers such as Unnatural Toughness. " +
      "Cauterizes wounds it inflicts, so ongoing bleeding effects caused by the weapon are ignored. " +
      "May fire once as a Flamer; after doing so it needs refuelling and no longer ignores Toughness or cauterizes wounds until recharged.",
    twoHanded: true,
    weight: "8 kg",
    value: "800 Thrones",
    availability: "Rare",
  },
  {
    id: "mancatcher",
    name: "Mancatcher",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Unwieldy",
    description:
      "Pole-arm restraint weapon used to capture targets alive. On a successful hit with a -20 WS penalty, a humanoid target is restrained. " +
      "To move, the target must win an opposed Strength vs Weapon Skill Test or pass a Contortionist Test.",
    twoHanded: true,
    weight: "4 kg",
    value: "200 Thrones",
    availability: "Rare",
  },
  {
    id: "scoriada",
    name: "Scoriada",
    source: SkillSource.BoM,
    class: "Melee",
    damage: "0 I",
    pen: 0,
    specialRules: "Primitive, Flexible",
    description:
      "Whip of knotted cloth or soft leather used for corporal mortification. As a weapon, deals only the wielder's Strength Bonus as Damage. " +
      "With the Flagellant talent, daily mortification can be endured without suffering a wound on a Hard (-10) Toughness Test.",
    weight: "1 kg",
    value: "5 Thrones",
    availability: "Scarce",
  },

  // ── Daemon Hunter ─────────────────────────────────────────────────────────

  // Primitive
  {
    id: "dh-blackwing-halberd",
    name: "Blackwing Halberd",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+3 R",
    pen: 4,
    specialRules: "Balanced",
    description:
      "Elegant halberd made from razor-sharp black stone stronger than steel, perfectly balanced for both offence and defence.",
    weight: "5 kg",
    value: "500 Thrones",
    availability: "Rare",
  },
  {
    id: "dh-great-hammer",
    name: "Great Hammer",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+4 R",
    pen: 2,
    specialRules: "Unwieldy",
    description:
      "Slow, crushing two-handed hammer. Grants +10 to Weapon Skill Tests to Stun opponents.",
    twoHanded: true,
    weight: "8 kg",
    value: "70 Thrones",
    availability: "Common",
  },
  {
    id: "dh-daggered-vambraces",
    name: "Daggered Vambracers",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10 R",
    pen: 0,
    specialRules: "Unwieldy",
    description:
      "Curved blades fixed to stiff metal bracers. May make melee attacks even when both hands are otherwise occupied.",
    weight: "1 kg",
    value: "100 Thrones",
    availability: "Common",
  },
  {
    id: "dh-quicksilver-blade",
    name: "Quicksilver Blade",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+2 R",
    pen: 0,
    specialRules: "Balanced",
    description:
      "Xenos duelling blade with fluid, hard-to-track motion. Opponents attempting to parry, but not dodge, suffer -10 to their Weapon Skill Test.",
    weight: "2 kg",
    value: "1,000 Thrones",
    availability: "Rare",
  },
  {
    id: "dh-reliquary-sword",
    name: "Reliquary Blade",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+2 R",
    pen: 3,
    specialRules: "Balanced, Sanctified",
    description:
      "Sword recovered from the crypts of saints and seers in times of dire need. Always Best Craftsmanship and Sanctified.",
    weight: "3 kg",
    value: "3,000 Thrones",
    availability: "Very Rare",
  },
  {
    id: "dh-sacred-incense",
    name: "Sacred Incense",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+2 I",
    pen: 0,
    specialRules: "Flexible, Sanctified",
    description:
      "Holy incense burned from braziers or censers, weakening daemonkind for about one hour. " +
      "Daemons within 10m of the bearer suffer -10 WS and -10 to all Warp Instability Tests.",
    weight: "5 kg",
    value: "3,000 Thrones",
    availability: "Very Rare",
  },
  {
    id: "dh-truename-staff",
    name: "Truename Staff",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Balanced, Sanctified",
    description:
      "Ordo Malleus staff etched with the True Names of nine and ninety daemons. Always Best Craftsmanship and Sanctified.",
    weight: "4 kg",
    value: "2,000 Thrones",
    availability: "Very Rare",
  },

  // Power
  {
    id: "dh-null-rod",
    name: "Null Rod",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+4 I",
    pen: 6,
    specialRules: "Power Field",
    description:
      "Warp-disrupting rod with a power field and special effects against daemons and psykers. " +
      "Psychic powers used within or entering the field have a 70% chance of failure, checked before Psychic Phenomena. " +
      "For every 10 continuous rounds a psyker spends within the field, they must pass a Challenging (+0) Willpower Test or gain 1 Insanity Point.",
    weight: "3 kg",
    value: "9,000 Thrones",
    availability: "Very Rare",
  },
  {
    id: "dh-thunder-hammer",
    name: "Thunder Hammer",
    source: SkillSource.DH,
    class: "Melee",
    damage: "2d10+4 E",
    pen: 10,
    specialRules: "Power Field, Unwieldy",
    description:
      "Two-handed hammer designed to incapacitate foes with stunning force. " +
      "Doubles Strength Bonus for damage, or increases Unnatural Strength multiplier by 1.",
    twoHanded: true,
    weight: "18 kg",
    value: "5,000 Thrones",
    availability: "Very Rare",
  },

  // Shock
  {
    id: "dh-concussion-mace",
    name: "Concussion Mace",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+3 I",
    pen: 4,
    specialRules: "Unwieldy, Blast (1)",
    description:
      "Gravity-plate mace that creates a small crushing field. On a WS roll of 94-00, the wielder is within the blast radius and takes damage equal to the weapon's normal damage.",
    weight: "15 kg",
    value: "200 Thrones",
    availability: "Scarce",
  },
  {
    id: "dh-shock-staff",
    name: "Shock Staff",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Shocking",
    description:
      "Walking-staff-like shock weapon with a crackling electrical tip. When deactivated, attempts to identify it as a weapon suffer -20.",
    weight: "4 kg",
    value: "250 Thrones",
    availability: "Scarce",
  },

  // Daemonic Weapons
  {
    id: "dh-excruciating-whip",
    name: "Excruciating Whip",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10 I",
    pen: 2,
    specialRules: "Snare, Excruciating",
    description:
      "Painful whip of flesh, bone, or chain. Each round the target is snared, it must pass a Difficult (-10) Willpower or Toughness Test, target's choice, or be Stunned for 1 round. Daemonic weapon.",
    weight: "5 kg",
    value: "—",
    availability: "Very Rare",
  },
  {
    id: "dh-hellblade",
    name: "Hellblade",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+2 R",
    pen: 0,
    specialRules: "Balanced",
    description:
      "Brass Khornate blade covered in chains, skulls, and flayed leather. Wielder adds Strength Bonus to Penetration. Daemonic weapon.",
    weight: "4 kg",
    value: "—",
    availability: "Very Rare",
  },
  {
    id: "dh-hellaxe",
    name: "Hellaxe",
    source: SkillSource.DH,
    class: "Melee",
    damage: "2d10+4 R",
    pen: 0,
    specialRules: "Unwieldy",
    description:
      "Brass Khornate axe covered in chains, skulls, and flayed leather. Wielder adds Strength Bonus to Penetration. Daemonic weapon.",
    twoHanded: true,
    weight: "9 kg",
    value: "—",
    availability: "Very Rare",
  },
  {
    id: "dh-plaguesword",
    name: "Plaguesword",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10+1 R",
    pen: 2,
    specialRules: "Balanced, Toxic",
    description:
      "Nurgle daemon weapon dripping with disease and poison, often a rusting glaive, mace, or short spear. " +
      "GM may substitute a specific disease for the Toxic quality.",
    weight: "4 kg",
    value: "—",
    availability: "Very Rare",
  },
  {
    id: "dh-warp-staff",
    name: "Warp Staff",
    source: SkillSource.DH,
    class: "Melee",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Balanced",
    description:
      "Tzeentchian sorcerous staff engraved with impossible runes. Wielder does not suffer Psychic Phenomena; instead, each time Phenomena would trigger, " +
      "add Psy Rating to the next psychic power's damage. If the next power deals no damage, the bonus is lost.",
    weight: "3 kg",
    value: "—",
    availability: "Very Rare",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────

  {
    id: "lw-coil-whip",
    name: "Coil Whip",
    source: SkillSource.LW,
    class: "Melee",
    damage: "1d10+5 E",
    pen: 4,
    specialRules: "Flexible, Shocking",
    description:
      "Integrated melee weapon: a long segmented chain glowing with electrical energy. " +
      "Often used by Venatorii Decani and Electro-Priests; can knock even a man in full power armour off his feet.",
    weight: "3 kg",
    value: "600 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-lathes-arc-welder",
    name: "Lathes Arc Welder",
    source: SkillSource.LW,
    class: "Melee",
    damage: "1d10+5 E",
    pen: 10,
    specialRules: "Unwieldy",
    description:
      "Does not add Strength Bonus to Damage. " +
      "Can cut through metres of adamantine plating up to 40 centimetres thick each minute, with thinner material cut faster. " +
      "Usually wrist-mounted and rapidly extendable, making it easily concealable. " +
      "Enemies attempting to Parry this weapon suffer a –20 penalty to their WS Test.",
    weight: "2 kg",
    value: "1,700 Thrones",
    availability: "Very Rare",
  },
  {
    id: "lw-percussion-mallet",
    name: "Percussion Mallet",
    source: SkillSource.LW,
    class: "Melee / Thrown",
    damage: "1d10+2 E",
    pen: 5,
    specialRules: "Unwieldy",
    description:
      "Doubles the wielder's Strength Bonus for Damage. " +
      "Characters with the Unnatural Strength trait add 1 to their multiplier instead. Can be used as a Thrown weapon.",
    weight: "4 kg",
    value: "3,000 Thrones",
    availability: "Rare",
  },
  {
    id: "lw-omnissian-rod",
    name: "Omnissian Rod",
    source: SkillSource.LW,
    class: "Melee",
    damage: "1d10+10 E",
    pen: 7,
    specialRules: "Balanced, Flexible, Power Field",
    description:
      "Exceptionally rare symbol and weapon gifted only to high-ranking members of the Cult Mechanicus. " +
      "Bearer receives +20 to Interaction Tests involving followers of the Machine God. " +
      "Its prominent Imperial Aquila improves the Disposition of those loyal to the Imperium by one step.",
    weight: "9 kg",
    value: "—",
    availability: "Adeptus Mechanicus Only",
  },
  {
    id: "lw-venator-blade",
    name: "Venator Blade",
    source: SkillSource.LW,
    class: "Melee / Thrown",
    damage: "1d5+3 R",
    pen: 4,
    specialRules: "Razor Sharp",
    description:
      "Always Best Craftsmanship (+15 WS, +1 Damage already included in profile). " +
      "Counts as AP 35 when used to Parry.",
    weight: "0.5 kg",
    value: "2,500 Thrones",
    availability: "Very Rare",
  },
];

// ─── Grenades ────────────────────────────────────────────────────────────────
// Range for all thrown grenades is SBx3 (Strength Bonus × 3 metres).

export const GRENADE_REFERENCE: GrenadeRef[] = [
  // ── Core Rulebook ──────────────────────────────────────────────────────────
  {
    id: "cr-frag-grenade",
    name: "Frag Grenade",
    source: SkillSource.CR,
    class: "Thrown",
    damage: "2d10 X",
    pen: "0",
    specialRules: "Blast (4)",
    weight: "0.5 kg",
    value: "10 Thrones",
    availability: "Common",
    description:
      "Uses an explosive charge and shrapnel fragments to shred targets " +
      "over a wide area. The Blast (4) quality affects all within 4 metres.",
  },
  {
    id: "cr-krak-grenade",
    name: "Krak Grenade",
    source: SkillSource.CR,
    class: "Thrown",
    damage: "2d10+4 X",
    pen: "6",
    specialRules: "—",
    weight: "0.5 kg",
    value: "50 Thrones",
    availability: "Rare",
    description:
      "Concentrated explosives designed to punch through armoured targets " +
      "such as vehicles or bunkers. Krak detonations do not produce a Blast " +
      "effect — their focused explosion makes them impractical against people.",
  },
  {
    id: "cr-blind-grenade",
    name: "Blind Grenade",
    source: SkillSource.CR,
    class: "Thrown",
    damage: "—",
    pen: "—",
    specialRules: "Smoke",
    weight: "0.5 kg",
    value: "25 Thrones",
    availability: "Scarce",
    description:
      "Explodes with dense smoke, IR baffles and broadband EM chaff. " +
      "In calm conditions the cloud is roughly 3m wide and 2m tall and lasts " +
      "3 Rounds. High winds may reduce this. Sensors and vision that would " +
      "normally pierce smoke cannot see through the blind grenade's haze.",
  },
  {
    id: "cr-photon-flash-grenade",
    name: "Photon Flash Grenade",
    source: SkillSource.CR,
    class: "Thrown",
    damage: "Special",
    pen: "0",
    specialRules: "—",
    weight: "0.5 kg",
    value: "60 Thrones",
    availability: "Scarce",
    description:
      "Detonates like a small star, blinding anyone nearby and overloading " +
      "cheap or primitive vision systems. Anyone within 15 metres must succeed " +
      "on a Toughness Test or be blinded for 1d5 Rounds.",
  },
  {
    id: "cr-hallucinogen-grenade",
    name: "Hallucinogen Grenade",
    source: SkillSource.CR,
    class: "Thrown",
    damage: "Special",
    pen: "0",
    specialRules: "—",
    weight: "0.5 kg",
    value: "40 Thrones",
    availability: "Rare",
    description:
      "Induces short-lived psychological delusions. Anyone within 10 metres " +
      "must succeed on a Difficult (–10) Toughness Test or be overcome with " +
      "hallucinations for 1d10 Rounds. Roll 1d100 each turn: 01–50 act " +
      "normally; 51–75 run screaming; 76–100 attack the nearest creature.",
  },
  {
    id: "cr-fire-bomb",
    name: "Fire Bomb",
    source: SkillSource.CR,
    class: "Thrown",
    damage: "1d10+3 E",
    pen: "6",
    specialRules: "Blast (3)",
    weight: "0.5 kg",
    value: "5 Thrones",
    availability: "Plentiful",
    description:
      "A breakable canister of flammable liquid with a cloth fuse. " +
      "The canister breaks open on impact and the burning liquid spreads. " +
      "A target struck must make an Agility Test or catch on fire.",
  },

  // ── Daemon Hunter ─────────────────────────────────────────────────────────
  {
    id: "dh-psyk-out-grenade",
    name: "Psyk-Out Grenade",
    source: SkillSource.DH,
    class: "Thrown",
    damage: "1d10 X",
    pen: "0",
    specialRules: "Blast (3)",
    weight: "1 kg",
    value: "5,000 Thrones",
    availability: "Very Rare",
    description:
      "Psykers in the blast radius must pass a Very Hard (-30) Willpower Test " +
      "or lose 1 Psy Rating per degree of failure, recovered at 1 point every 6 hours. " +
      "Losing 2 or more Psy Rating also causes Psychic Phenomena for 10 minus WP Bonus rounds. " +
      "Psykers in the lingering dust cloud for the next 5 rounds automatically fail to manifest psychic powers.",
  },
  {
    id: "dh-psykotroke-grenades",
    name: "Psykotroke Grenades",
    source: SkillSource.DH,
    class: "Thrown",
    damage: "Special",
    pen: "Special",
    specialRules: "Blast (3)",
    weight: "1 kg",
    value: "500 Thrones",
    availability: "Rare",
    description:
      "The psycho-reactive nerve agent does not need to be breathed in, so sealed suits offer no protection. " +
      "Anyone in the blast radius must pass a Hard (-20) Willpower Test or roll on the Hallucinogen Effects Table, " +
      "adding +5 to the roll for each degree of failure.",
  },
  {
    id: "dh-rad-grenades",
    name: "Rad Grenades",
    source: SkillSource.DH,
    class: "Thrown",
    damage: "1d10 E",
    pen: "0",
    specialRules: "Blast (2)",
    weight: "1 kg",
    value: "500 Thrones",
    availability: "Rare",
    description:
      "Victims caught in the blast must pass a Hard (-20) Toughness Test " +
      "or suffer 2d10 Toughness damage from the burst of intense radiation.",
  },

  {
    id: "dh-empyrian-brain-mines",
    name: "Empyrian Brain Mines",
    source: SkillSource.DH,
    type: "Mine",
    class: "Exotic",
    damage: "Special",
    pen: "0",
    specialRules: "—",
    description:
      "Must be attached via melee attack. Target makes Hard Agility Test each round or loses all actions " +
      "(success = one Half Action only). Removing deals 1d10+5 R damage ignoring armour. " +
      "Burns out and detaches after 3 rounds. Not reusable.",
    weight: "1 kg",
    value: "500 Thrones",
    availability: "Very Rare",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────
  {
    id: "lw-haywire-grenade",
    name: "Haywire Grenade",
    source: SkillSource.LW,
    class: "Thrown",
    damage: "—",
    pen: "0",
    specialRules: "Haywire (3)",
    weight: "0.5 kg",
    value: "200 Thrones",
    availability: "Very Rare",
    description:
      "On detonation this grenade floods the area with disruptive electromagnetic pulses. " +
      "All electronic and mechanical devices within the blast radius are affected by the Haywire quality.",
  },
];

// ─── Shields ─────────────────────────────────────────────────────────────────

export interface ShieldRef {
  id: string;
  name: string;
  source: SkillSource;
  /** AP provided to covered locations while actively using the shield */
  ap: number;
  /** Human-readable location summary */
  locations: string;
  damage: string;
  pen: number;
  specialRules: string;
  notes?: string;
  weight: string;
  value: string;
  availability: string;
}

export const SHIELD_REFERENCE: ShieldRef[] = [
  // ── Book of Judgement ─────────────────────────────────────────────────────
  {
    id: "boj-synford-lockshield",
    name: 'Synford-Pattern "Lockshield"',
    source: SkillSource.BoJ,
    ap: 4,
    locations: "Arm & Body (head when moving / legs when stationary)",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Defensive",
    notes:
      "Provides +4 AP to the carrying arm and body. Its height also covers the head when in " +
      "motion, or the legs when stationary. Contains an armoured viewport and firing port " +
      "(Basic or Pistol weapons may be fired without penalty), a powered vox-hailer, and " +
      "mag-strips for securing prisoners with magnacles. Adjacent lockshields can be locked " +
      "together to form an armoured wall. Requires one hand to use.",
    weight: "4 kg",
    value: "90 Thrones",
    availability: "Rare",
  },
  {
    id: "boj-enforcer-riot-shield",
    name: "Enforcer Riot Shield",
    source: SkillSource.BoJ,
    ap: 1,
    locations: "Arm & Body",
    damage: "1d10 I",
    pen: 0,
    specialRules: "Defensive, Primitive",
    notes:
      "Transparent polycarbonate circular shield (~2 ft diameter), worn at the wrist. " +
      "Provides +3 AP to body and carrying arm against attacks with the Primitive quality; " +
      "+1 AP against all other attack types to the same locations. " +
      "The carrying hand remains free to use a vox or pistol-sized weapon.",
    weight: "1.5 kg",
    value: "40 Thrones",
    availability: "Scarce",
  },
];

