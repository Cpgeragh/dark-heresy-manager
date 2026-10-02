export const WEAPON_TYPES = [
  "Bolt",
  "Chain",
  "Exotic",
  "Flame",
  "Las",
  "Launcher",
  "Melta",
  "Plasma",
  "Power",
  "Primitive",
  "Shock",
  "SP",
] as const;

export type WeaponType = (typeof WEAPON_TYPES)[number];

export type WeaponClass = "Pistol" | "Basic" | "Heavy" | "Thrown" | "Melee" | "Melee / Thrown";

export interface WeaponClassification {
  class: WeaponClass;
  type: WeaponType;
  exoticTraining?: string;
}

const idsByType: Record<WeaponType, readonly string[]> = {
  Las: [
    "cr-laspistol",
    "cr-las-carbine",
    "cr-lasgun",
    "cr-long-las",
    "cr-mp-lascannon",
    "dh-digital-laser",
    "dh-synapse-disruptor",
  ],
  SP: [
    "cr-autopistol",
    "cr-stub-revolver",
    "cr-stub-automatic",
    "cr-hand-cannon",
    "cr-autogun",
    "cr-hunting-rifle",
    "cr-shotgun",
    "cr-pump-action-shotgun",
    "cr-combat-shotgun",
    "cr-heavy-stubber",
    "ius-automatic-pistol",
    "judgeslayer-handcannon",
    "raffir-ringleader-pistol",
    "raffir-pax-factorem-rifle",
    "vox-legi-combat-shotgun",
    "bulldog-heavy-stubber",
    "dh-baraspian-palm-gun",
    "dh-hell-rifle",
    "dh-sting-blunt",
  ],
  Bolt: [
    "cr-bolt-pistol",
    "cr-boltgun",
    "cr-heavy-bolter",
    "godwyn-deaz-pattern-bolter",
    "godwyn-deaz-storm-bolter",
  ],
  Melta: ["cr-inferno-pistol", "cr-meltagun", "seraphim-inferno-pistol"],
  Plasma: ["cr-plasma-pistol", "cr-plasma-gun"],
  Flame: ["cr-hand-flamer", "cr-flamer", "seraphim-hand-flamer", "heavy-flamer"],
  Launcher: ["cr-grenade-launcher", "cr-rpg-launcher"],
  Primitive: [
    "cr-bolas",
    "cr-hand-bow",
    "cr-flintlock-pistol",
    "cr-musket",
    "cr-bow",
    "cr-sling",
    "cr-crossbow",
    "cr-throwing-star-knife",
    "ih-blunderbuss",
    "ih-composite-bow",
    "ih-heavy-crossbow",
    "ih-deuce-pistol",
    "ih-flick-bow",
    "ih-javelin",
    "ih-longbow",
    "ih-siskan-musket",
    "ih-vibe-spear",
    "ih-volonx-bone-bolas",
    "cr-axe",
    "cr-brass-knuckles",
    "cr-club",
    "cr-flail",
    "cr-great-weapon",
    "cr-hammer",
    "cr-improvised",
    "cr-knife",
    "cr-shield",
    "cr-spear",
    "cr-sword",
    "cr-staff",
    "boj-cosh",
    "boj-shiv",
    "boj-side-handle-baton",
    "baptismal-hammer",
    "daemon-pike",
    "ecclesiarchy-corsesque",
    "fire-lance",
    "flame-hammer",
    "mancatcher",
    "scoriada",
    "dh-blackwing-halberd",
    "dh-great-hammer",
    "dh-daggered-vambraces",
    "dh-quicksilver-blade",
    "dh-reliquary-sword",
    "dh-sacred-incense",
    "dh-truename-staff",
    "lw-percussion-mallet",
    "lw-venator-blade",
    "ih-bastard-sword",
    "ih-buckler",
    "ih-cutlass",
    "ih-long-sabre",
    "ih-mirror-shield",
    "ih-moon-blade",
    "ih-punch-dagger",
    "ih-sabre",
    "ih-scythe",
    "ih-spetum",
    "ih-steam-drill",
    "ih-stiletto",
    "ih-tower-shield-metal",
    "ih-tower-shield-wood",
    "ih-emperors-whisper",
    "ih-kraken-tooth-dagger",
  ],
  Chain: ["cr-chainsword", "cr-chain-axe", "eviscerator"],
  Power: [
    "cr-power-blade",
    "cr-power-sword",
    "agni-power-maul",
    "bakka-power-ram",
    "cyclopea-power-maul",
    "lathe-power-maul",
    "dh-null-rod",
    "dh-thunder-hammer",
    "lw-omnissian-rod",
  ],
  Shock: [
    "cr-shock-maul",
    "cr-electro-flail",
    "boj-electropick",
    "hredrian-shock-staff",
    "orthlack-shock-baton",
    "boj-shocker",
    "dh-concussion-mace",
    "dh-shock-staff",
  ],
  Exotic: [
    "cr-needle-pistol",
    "cr-web-pistol",
    "cr-needle-rifle",
    "cr-webber",
    "ca-slugga",
    "ca-shoota",
    "ca-snazzgun",
    "ca-shuriken-pistol",
    "ca-avenger-shuriken-catapult",
    "ca-ranger-long-rifle",
    "ca-choppa",
    "dh-conversion-beamer",
    "dh-tyranicus-heavy-webber",
    "dh-excruciating-whip",
    "dh-hellblade",
    "dh-hellaxe",
    "dh-plaguesword",
    "dh-warp-staff",
    "lw-lathe-laspistol",
    "lw-lathe-lasrifle",
    "lw-lathe-lasblaster",
    "lw-phased-plasma-rifle",
    "lw-catalytic-mass-driver",
    "lw-heavy-catalytic-mass-driver",
    "lw-graviton-pulse-launcher",
    "lw-coil-whip",
    "lw-lathes-arc-welder",
    "ih-fedrid-razor-disk",
    "ih-volonx-thunderclap",
  ],
};

const typeById = new Map<string, WeaponType>(
  Object.entries(idsByType).flatMap(([type, ids]) =>
    ids.map((id) => [id, type as WeaponType] as const)
  )
);

const exoticClassById: Readonly<Record<string, WeaponClass>> = {
  "ih-fedrid-razor-disk": "Thrown",
  "ih-volonx-thunderclap": "Thrown",
  "ih-aegis-redback": "Heavy",
  "ih-galvian-needler": "Pistol",
  "ih-hypo-pistol": "Pistol",
  "ih-widower": "Pistol",
  "ih-graviton-gun": "Basic",
  "ih-rad-cleanser": "Heavy",
  "ih-aegis-shock-blaster": "Pistol",
  "ih-chain-stick": "Melee",
  "ih-double-flail": "Melee",
  "ih-lightning-gauntlet": "Melee",
  "ih-lightning-chain": "Melee",
  "ih-breacher": "Melee",
  "ih-vivisector": "Melee",
  "ih-bulkhead-cutter": "Melee",
};

const exoticTrainingById: Readonly<Record<string, string>> = {
  "lw-lathe-laspistol": "Integrated Ranged Weapon",
  "lw-lathe-lasrifle": "Integrated Ranged Weapon",
  "lw-lathe-lasblaster": "Integrated Ranged Weapon",
  "lw-phased-plasma-rifle": "Integrated Ranged Weapon",
  "lw-catalytic-mass-driver": "Integrated Ranged Weapon",
  "lw-heavy-catalytic-mass-driver": "Integrated Ranged Weapon",
  "lw-graviton-pulse-launcher": "Integrated Ranged Weapon",
  "lw-coil-whip": "Integrated Melee Weapon",
  "lw-lathes-arc-welder": "Integrated Melee Weapon",
};

const canonicalClass = (value: string): WeaponClass => {
  const base = value.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (base === "Melee or Thrown" || base === "Melee, Thrown") return "Melee / Thrown";
  if (
    base === "Pistol" ||
    base === "Basic" ||
    base === "Heavy" ||
    base === "Thrown" ||
    base === "Melee" ||
    base === "Melee / Thrown"
  ) {
    return base;
  }
  throw new Error(`Unknown weapon class: ${value}`);
};

export function classifyWeaponReference(
  id: string,
  name: string,
  rawClass: string
): WeaponClassification {
  const parenthetical = rawClass.match(/\(([^)]+)\)\s*$/)?.[1];
  if (rawClass.startsWith("Exotic")) {
    const weaponClass = exoticClassById[id];
    if (!weaponClass) throw new Error(`Missing physical class for Exotic weapon: ${id}`);
    return {
      class: weaponClass,
      type: "Exotic",
      exoticTraining: exoticTrainingById[id] ?? parenthetical ?? name,
    };
  }

  const mappedType = typeById.get(id);
  const type = parenthetical as WeaponType | undefined;
  const resolvedType = type && WEAPON_TYPES.includes(type) ? type : mappedType;
  if (!resolvedType) throw new Error(`Missing weapon type for reference: ${id}`);

  return {
    class: canonicalClass(rawClass),
    type: resolvedType,
    ...(resolvedType === "Exotic" ? { exoticTraining: exoticTrainingById[id] ?? name } : {}),
  };
}
