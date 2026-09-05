// src/data/reference/ammoReference.ts
// Reference data for ammunition types from the Core Rulebook and Dark Heresy sourcebooks.
// Feeds into the AmmoPicker in WeaponsTab.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AmmoRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Free-text "Used With" compatibility note */
  compatibleWith: string;
  /** Throne cost per purchase unit, e.g. "1 Throne", "16 Thrones" */
  cost?: string;
  /**
   * How many rounds/charges per purchase.
   * Numeric string ("20", "6", "1") or "full clip" for weapons
   * where the amount equals the weapon's own clip size.
   */
  purchaseAmount: string;
  availability?: string;
  /** Game-mechanical effects for special ammunition */
  description?: string;
  /** A full unit's capacity for particular weapons, when it differs from that weapon's printed Clip value. */
  capacityByWeaponId?: Record<string, number>;
  /** Fixed weight for one complete ammunition unit, when the source supplies one. */
  unitWeightKg?: number;
  /** A fitted backpack supply changes the weapon while it is loaded. */
  loadedWeaponModifiers?: {
    clipMultiplier?: number;
    weightKg?: number;
    valueThrones?: number;
  };
  /** The entry is a fitted feed configuration rather than spare ammunition. */
  isBackpackFeed?: boolean;
}

export const RECHARGING_POWER_PACKS_TEXT =
  "Las power packs can be charged in the field from most power sources. Characters may make a Tech-Use Test to successfully charge any power pack if there is a suitable power source available. The time the pack takes to charge is determined by the power output of the source and is ultimately up to the GM, but typically takes several hours. Alternatively, power packs may be charged by placing them in an open flame. This takes at least a day and permanently reduces the clip size by half the first time it is charged in this way. It also removes a las weapon's Reliable special quality, or gives it the Unreliable special quality if it was not Reliable to start with. Each time a pack is recharged in this way there is a 30% chance it is permanently rendered useless.";

export function isChargePackAmmoName(name: string): boolean {
  return /^Charge Pack \(/i.test(name);
}

export function formatAmmoName(name: string): string {
  return name.replace(
    /\(([^)]+)\)/,
    (_, type: string) => `(${type.charAt(0).toUpperCase()}${type.slice(1)})`
  );
}

export function usesUnitAmmoTracking(ammo?: Pick<AmmoRef, "id">): boolean {
  if (!ammo) return false;
  return new Set([
    "cr-dumdum-bullets",
    "cr-hot-shot-charge",
    "cr-inferno-shells",
    "cr-man-stopper-bullets",
    "dh-cryptus-shotgun-shells",
    "dh-psybolt-ammunition",
    "dh-psyflame-ammunition",
    "ih-blazer-shotgun-shells",
    "ih-void-rounds",
    "ih-psycannon-bolts",
    "ih-blessed-ammunition",
    "lw-purity-round",
  ]).has(ammo.id);
}

/** Some ammunition is purchased as a complete clip even for weapons otherwise tracked by individual rounds. */
export function isSoldAsFullClip(ammo?: Pick<AmmoRef, "purchaseAmount">): boolean {
  return ammo?.purchaseAmount?.trim().toLowerCase() === "full clip";
}

/** Resolves a full ammunition unit's capacity, including weapon-specific exceptions. */
export function ammoCapacityForWeapon(
  ammo: Pick<AmmoRef, "capacityByWeaponId"> | undefined,
  weaponReferenceId: string | undefined,
  fallbackClip: string | undefined
): string | undefined {
  const override = weaponReferenceId ? ammo?.capacityByWeaponId?.[weaponReferenceId] : undefined;
  return override != null ? String(override) : fallbackClip;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export const AMMO_REFERENCE: AmmoRef[] = [
  // ── Core Rulebook — Basic ────────────────────────────────────────────────

  {
    id: "cr-arrows-quarrels",
    name: "Arrows/Quarrels",
    source: SkillSource.CR,
    compatibleWith: "Bows, crossbows and hand bows",
    cost: "1 Throne",
    purchaseAmount: "20",
    availability: "Common",
    description:
      "Arrows and quarrels come in a variety of shapes, sizes and materials ranging from crude wooden shafts with flint tips to steel darts with razor-sharp points.",
  },
  {
    id: "cr-shot",
    name: "Shot",
    source: SkillSource.CR,
    compatibleWith: "Flintlock pistol and musket",
    cost: "1 Throne",
    purchaseAmount: "20",
    availability: "Common",
    description:
      "Solid lead or stone balls and a powder charge used in primitive blackpowder weapons.",
  },
  {
    id: "cr-bullets",
    name: "Bullets",
    source: SkillSource.CR,
    compatibleWith:
      "Autopistol, stub revolver, stub automatic, hand cannon, autogun, hunting rifle and heavy stubber",
    cost: "1 Throne",
    purchaseAmount: "20",
    availability: "Plentiful",
    description:
      "Hard rounds common to many weapons. Bullets from one kind of firearm cannot be used in another unless they are very similar in make.",
  },
  {
    id: "cr-shells",
    name: "Shells",
    source: SkillSource.CR,
    compatibleWith: "Shotguns, pump-action shotguns and combat shotguns",
    cost: "1 Throne",
    purchaseAmount: "20",
    availability: "Common",
    description:
      "Shells contain dozens of tiny balls and scatter over a wide area when fired, making them ideal for close-in work where accuracy is less important.",
  },

  // ── Core Rulebook — Charge Packs ────────────────────────────────────────

  {
    id: "cr-charge-pack-pistol",
    name: "Charge Pack (Pistol)",
    source: SkillSource.CR,
    compatibleWith: "Laspistol, las carbine, lasgun, long las, MP lascannon",
    cost: "10 Thrones",
    purchaseAmount: "full clip",
    availability: "Common",
    description:
      "Powerful batteries used almost exclusively by las weapons. Provides shots equal to the weapon's full clip value.",
    capacityByWeaponId: {
      "ih-voss-pattern-hellpistol": 5,
    },
  },
  {
    id: "cr-charge-pack-basic",
    name: "Charge Pack (Basic)",
    source: SkillSource.CR,
    compatibleWith: "Laspistol, las carbine, lasgun, long las, MP lascannon",
    cost: "15 Thrones",
    purchaseAmount: "full clip",
    availability: "Common",
    description:
      "Powerful batteries used almost exclusively by las weapons. Provides shots equal to the weapon's full clip value.",
    capacityByWeaponId: {
      "ih-dlaku-hellgun": 12,
      "ih-voss-pattern-hellgun": 10,
    },
  },
  {
    id: "ih-hellgun-capacitor",
    name: "Hellgun Capacitor",
    source: SkillSource.IH,
    compatibleWith: "D’laku Hellgun, Voss Pattern Hellgun, and Voss Pattern Hellpistol",
    cost: "50 Thrones",
    purchaseAmount: "full clip",
    availability: "Rare",
    description:
      "A backpack-mounted power source. It provides the listed weapon’s full capacitor capacity and weighs 6 kg.",
    unitWeightKg: 6,
    capacityByWeaponId: {
      "ih-dlaku-hellgun": 40,
      "ih-voss-pattern-hellgun": 40,
      "ih-voss-pattern-hellpistol": 20,
    },
  },
  {
    id: "cr-charge-pack-heavy",
    name: "Charge Pack (Heavy)",
    source: SkillSource.CR,
    compatibleWith: "Laspistol, las carbine, lasgun, long las, MP lascannon",
    cost: "30 Thrones",
    purchaseAmount: "full clip",
    availability: "Rare",
    description:
      "Powerful batteries used almost exclusively by las weapons. Provides shots equal to the weapon's full clip value.",
  },

  // ── Core Rulebook — Fuel ─────────────────────────────────────────────────

  {
    id: "cr-fuel-pistol",
    name: "Fuel (pistol)",
    source: SkillSource.CR,
    compatibleWith: "Hand flamer and flamer",
    cost: "8 Thrones",
    purchaseAmount: "full clip",
    availability: "Scarce",
    description:
      "Liquid fuel for flame weapons, ranging from purest promethium to crude flammable alcohols. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-fuel-basic",
    name: "Fuel (basic)",
    source: SkillSource.CR,
    compatibleWith: "Hand flamer and flamer",
    cost: "10 Thrones",
    purchaseAmount: "full clip",
    availability: "Scarce",
    description:
      "Liquid fuel for flame weapons, ranging from purest promethium to crude flammable alcohols. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-flamer-backpack-fuel-hose",
    name: "Flamer Backpack & Fuel Hose",
    source: SkillSource.CR,
    compatibleWith: "Non-pistol flame weapons using Fuel (basic)",
    cost: "100 Thrones",
    purchaseAmount: "backpack",
    description:
      "Replaces an underslung canister with a backpack and fuel hose. Doubles Clip size, adds 6 kg, and increases the weapon’s cost by 100 Thrones.",
    isBackpackFeed: true,
    unitWeightKg: 0,
    loadedWeaponModifiers: { clipMultiplier: 2, weightKg: 6, valueThrones: 100 },
  },

  // ── Core Rulebook — Bolt ─────────────────────────────────────────────────

  {
    id: "cr-bolt-shells",
    name: "Bolt Shells",
    source: SkillSource.CR,
    compatibleWith: "Bolt pistols, bolters and heavy bolters",
    cost: "16 Thrones",
    purchaseAmount: "1",
    availability: "Rare",
    description:
      "The mass-reactive explosive bolt shell is among the deadliest rounds in the Imperial arsenal. The difficulty and cost of manufacture restricts its use to all but the most wealthy or well connected.",
  },

  // ── Core Rulebook — Melta ────────────────────────────────────────────────

  {
    id: "cr-melta-canister-pistol",
    name: "Melta Canister (pistol)",
    source: SkillSource.CR,
    compatibleWith: "Inferno pistols and meltaguns",
    cost: "20 Thrones",
    purchaseAmount: "full clip",
    availability: "Very Rare",
    description:
      "Specially refined chemicals injected into highly pressurised canisters for meltaguns. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-melta-canister-basic",
    name: "Melta Canister (basic)",
    source: SkillSource.CR,
    compatibleWith: "Inferno pistols and meltaguns",
    cost: "15 Thrones",
    purchaseAmount: "full clip",
    availability: "Rare",
    description:
      "Specially refined chemicals injected into highly pressurised canisters for meltaguns. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-melta-backpack-feed-line",
    name: "Melta Backpack & Feed Line",
    source: SkillSource.CR,
    compatibleWith: "Non-pistol melta weapons using Melta Canister (basic)",
    cost: "100 Thrones",
    purchaseAmount: "backpack",
    description:
      "Replaces attached canisters with a backpack and feed line. Doubles Clip size, adds 6 kg, and increases the weapon’s cost by 100 Thrones.",
    isBackpackFeed: true,
    unitWeightKg: 0,
    loadedWeaponModifiers: { clipMultiplier: 2, weightKg: 6, valueThrones: 100 },
  },

  // ── Core Rulebook — Plasma ───────────────────────────────────────────────

  {
    id: "cr-plasma-flask-pistol",
    name: "Plasma Flask (pistol)",
    source: SkillSource.CR,
    compatibleWith: "Plasma pistols and plasma guns",
    cost: "24 Thrones",
    purchaseAmount: "full clip",
    availability: "Rare",
    description:
      "Highly dangerous and volatile photonic hydrogen, compressed and contained within reinforced flasks. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-plasma-flask-basic",
    name: "Plasma Flask (basic)",
    source: SkillSource.CR,
    compatibleWith: "Plasma pistols and plasma guns",
    cost: "18 Thrones",
    purchaseAmount: "full clip",
    availability: "Rare",
    description:
      "Highly dangerous and volatile photonic hydrogen, compressed and contained within reinforced flasks. Provides shots equal to the weapon's full clip value.",
    capacityByWeaponId: {
      "ih-plasma-blaster": 12,
    },
  },
  {
    id: "cr-plasma-backpack-feed-line",
    name: "Plasma Backpack & Feed Line",
    source: SkillSource.CR,
    compatibleWith: "Non-pistol plasma weapons using Plasma Flask (basic)",
    cost: "100 Thrones",
    purchaseAmount: "backpack",
    description:
      "Replaces attached plasma flasks with a backpack and feed line. Doubles Clip size, adds 6 kg, and increases the weapon’s cost by 100 Thrones.",
    isBackpackFeed: true,
    unitWeightKg: 0,
    loadedWeaponModifiers: { clipMultiplier: 2, weightKg: 6, valueThrones: 100 },
  },

  // ── Core Rulebook — Special ──────────────────────────────────────────────

  {
    id: "cr-exotic",
    name: "Exotic",
    source: SkillSource.CR,
    compatibleWith: "Needle pistol, needle rifle, web pistol and webber",
    cost: "20 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "Many weapons use unusual ammunition, from the viscous gel of a webber to the finely crafted darts of a needle pistol. GMs may increase the cost of exotic ammunition depending on its availability.",
  },
  {
    id: "cr-dumdum-bullets",
    name: "Dumdum Bullets",
    source: SkillSource.CR,
    compatibleWith: "Stub revolvers, stub automatics and hand cannons",
    cost: "5 Thrones",
    purchaseAmount: "6",
    availability: "Scarce",
    description:
      "Heavy blunt bullets designed to cause maximum tissue damage. Add 2 to the weapon's Damage. Armour Points count double against them.",
  },
  {
    id: "cr-hot-shot-charge",
    name: "Hot-Shot Charge",
    source: SkillSource.CR,
    compatibleWith: "Laspistols, las carbines, lasguns and long las",
    cost: "15 Thrones",
    purchaseAmount: "1",
    availability: "Scarce",
    description:
      "A single powerful charge pack. Add 1 to Damage, roll two dice for Damage and pick the highest, and gain Penetration 4. The weapon loses its Reliable quality and its clip is reduced to 1 (one-use).",
  },
  {
    id: "cr-inferno-shells",
    name: "Inferno Shells",
    source: SkillSource.CR,
    compatibleWith: "Shotguns, pump-action shotguns, combat shotguns and all bolt weapons",
    cost: "18 Thrones",
    purchaseAmount: "1",
    availability: "Rare",
    description:
      "Shells containing a phosphorous gel that ignites on contact. A target hit must make an Agility Test or catch on fire, in addition to normal damage. May also be used to set objects ablaze.",
  },
  {
    id: "cr-man-stopper-bullets",
    name: "Man-Stopper Bullets",
    source: SkillSource.CR,
    compatibleWith: "Stub revolvers, stub automatics, hand cannons, autopistols and autoguns",
    cost: "5 Thrones",
    purchaseAmount: "6",
    availability: "Scarce",
    description:
      "Densely tipped bullets designed to punch through armour. Add 3 to the weapon's Penetration.",
  },

  // ── Dark Heresy ──────────────────────────────────────────────────────────

  {
    id: "dh-cryptus-shotgun-shells",
    name: "Cryptus Shotgun Shells",
    source: SkillSource.DH,
    compatibleWith: "Shotguns",
    cost: "50 Thrones",
    purchaseAmount: "5",
    availability: "Rare",
    description:
      "Shotgun shells made from the glass of the destroyed Templum of Cryptus, naturally resistant to the Warp. " +
      "Attacks count as Sanctified. Daemonic or Warp creatures struck at short range must pass a Challenging (+0) " +
      "Toughness Test or be blinded for 1d5 rounds.",
  },
  {
    id: "dh-psybolt-ammunition",
    name: "Psybolt Ammunition",
    source: SkillSource.DH,
    compatibleWith: "Bolt weapons",
    cost: "100 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "Psychically charged bolt shells tipped with truesilver. Ignores any protection granted by psychic powers " +
      "or Sorcery. Counts as Sanctified. Adds the user's Psy Rating to damage dealt.",
  },
  {
    id: "dh-psyflame-ammunition",
    name: "Psyflame Ammunition",
    source: SkillSource.DH,
    compatibleWith: "Flame weapons",
    cost: "100 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "Psychically charged promethium for flamer weapons. Ignores protection from psychic powers or Sorcery. " +
      "Counts as Sanctified. Targets in the area of effect suffer –5 to their Agility Test per point of the user's Psy Rating.",
  },

  {
    id: "dh-synapse-power-cell",
    name: "Synapse Disruptor Power Cell",
    source: SkillSource.DH,
    compatibleWith: "Synapse Disruptor",
    cost: "200 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "Specially crafted power cell for the Synapse Disruptor. " +
      "Cannot be substituted with standard charge packs.",
  },
  {
    id: "dh-sting-blunt-magazine",
    name: "Sting-Blunt Magazine",
    source: SkillSource.DH,
    compatibleWith: "Sting-Blunt",
    cost: "50 Thrones",
    purchaseAmount: "full clip",
    availability: "Scarce",
    description:
      "Proprietary circuitry-traced bullets specially created for the Sting-Blunt. " +
      "Imperial standard ammunition cannot be adapted for this weapon.",
  },

  // ── Inquisitor's Handbook ────────────────────────────────────────────────

  {
    id: "ih-spitfire-shells",
    name: "Spitfire Shells",
    source: SkillSource.IH,
    compatibleWith: "Spitfire bolt pistol",
    cost: "5 Thrones",
    purchaseAmount: "full clip",
    availability: "Scarce",
    description:
      "Modified rocket-propelled distress flares fitted with crude impact detonators. Spitfire shells are Scarce with a base cost of 5 Thrones per reload.",
  },
  {
    id: "ih-valentine-cell",
    name: "Valentine Cell",
    source: SkillSource.IH,
    compatibleWith: "Duelling Las",
    cost: "20 Thrones",
    purchaseAmount: "1",
    availability: "Rare",
    description:
      "A special single-shot cell used by the Valentine Duelling Las instead of a standard power pack. It cannot be combined with an overcharge pack or an additional hot-shot charge.",
  },
  {
    id: "ih-mariette-cylinder",
    name: "Mariette Cylinder",
    source: SkillSource.IH,
    compatibleWith: "Mariette Cylinder Pistol",
    cost: "100 Thrones",
    purchaseAmount: "1",
    availability: "Rare",
    description:
      "A self-contained ammunition-barrel cylinder for the Mariette. It is a Rare item with a base cost of 100 Thrones each.",
  },
  {
    id: "ih-hypo-darts",
    name: "Hypo Darts",
    source: SkillSource.IH,
    compatibleWith: "Hypo pistol",
    cost: "5 Thrones",
    purchaseAmount: "1",
    availability: "Scarce",
    description:
      "Injector darts designed not to unduly harm their targets. Hypo-pistol ammo is Scarce and each hypo-dart has a base cost of 5 Thrones each.",
  },
  {
    id: "ih-razor-darts",
    name: "Razor Darts",
    source: SkillSource.IH,
    compatibleWith: "Widower",
    cost: "15 Thrones",
    purchaseAmount: "1",
    availability: "Rare",
    description:
      "The Widower profile assumes a standard razor-dart, although poisoned or explosive darts are not unknown. Razor darts are also Rare items with a base cost of 15 Thrones each.",
  },
  {
    id: "ih-blazer-shotgun-shells",
    name: "Blazer Shotgun Shells",
    source: SkillSource.IH,
    compatibleWith: "Any shotgun",
    cost: "4 Thrones",
    purchaseAmount: "1",
    availability: "Common",
    description:
      "These shells are packed with pyrotechnic materials, so when fired a huge gout of flame is produced for several seconds. While not as lethal as regular rounds, a volley excels at frightening off most enemies. As they can also be used in standard shotguns, they offer excellent tactical flexibility without the need for specialised flamer weapons. The duration of the discharge means it can only be used in single-shot mode.\n\nBlazer shotgun shells may be used with any shotgun and, when fired, reduce the weapon’s Range to 15 metres unless that would be greater than its actual Range. In addition, they change the weapon’s Damage type to Energy (E) and give it the Flame and Primitive qualities.",
  },
  {
    id: "ih-irontalon-fragmenting-ammunition",
    name: "Irontalon Fragmenting Ammunition",
    source: SkillSource.IH,
    compatibleWith: "Cypra Mundi Irontalon Pistol",
    cost: "30 Thrones",
    purchaseAmount: "full clip",
    availability: "Rare",
    description:
      "Specialised fragmenting ammunition designed to violently stop a target without undue risk to a ship’s hull. It may only be used with the Cypra Mundi Irontalon Pistol.",
  },
  {
    id: "ih-void-rounds",
    name: "Void Rounds",
    source: SkillSource.IH,
    compatibleWith: "SP weapons (all)",
    cost: "8 Thrones",
    purchaseAmount: "1",
    availability: "Scarce",
    description:
      "Specialised void rounds can be created by using self-igniting chemicals such that the weapon can be used in void environments without the risk of misfiring or rapid overheating.\n\nWeapons using void rounds gain the Reliable quality in void conditions.",
  },
  {
    id: "ih-psycannon-bolts",
    name: "Psycannon Bolts",
    source: SkillSource.IH,
    compatibleWith: "Bolt weapons",
    cost: "250 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "A true psycannon is a highly advanced form of bolter weapon utilised by the legendary Grey Knights, and aside from their armouries and a few powerful members of the Ordo Malleus, it is extremely rare even among the ranks of the Inquisition. Psycannon bolts, however, utilise the same core of psy-antheaemic substance in their construction and are capable of ripping through warp-stuff and barriers of psychic force with ease. Shockingly fatal even to those without psychic powers, it is whispered by some that those slain by psycannon bolts have their souls snuffed out like guttering candles.\n\nPsycannon bolts add +5 to all Critical Damage inflicted. Psycannon bolts inflict double their rolled Damage against targets with a Psy Rating, Daemons and other warp entities after Armour and Toughness Bonuses are taken into account. Damage inflicted by psycannon bolts is classed as Holy and ignores any psychically or warp-generated armour or protective field (such as Daemonic Resilience, Telekinetic Shield, etc).\n\nPsycannon bolts are only ever obtainable from somebody with full Inquisitorial rank.",
  },
  {
    id: "ih-blessed-ammunition",
    name: "Blessed Ammunition",
    source: SkillSource.IH,
    compatibleWith: "Bolt Weapons, Flamers, and Solid Projectile Weapons",
    cost: "50 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "The prayers and blessing of those of true faith in the God-Emperor of Mankind, coupled with the ancient lore of Ecclesiastical alchemistry, is able to turn mere mundane bullets and blades into weapons that are capable of harming the foul denizens of the warp and other such unnatural horrors.\n\nThe sole effect of these upgrades is to make the Damage caused by the weapon in question counted as “Holy”, which has certain effects on some Daemonic and warp creatures (as will be noted in their description). Obtaining such items is only possible through the Holy Ordos or high-ranking members of the Ecclesiarchy, and the cost and rarity shown reflects this.",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────
  {
    id: "ih-catechist-stake-bolts",
    name: "Catechist Stake-Bolts",
    source: SkillSource.IH,
    compatibleWith: "Catechist Pattern Stake-Crossbow",
    cost: "50 Thrones",
    purchaseAmount: "1",
    availability: "Rare",
    description:
      "Specially constructed 15 centimetre adamantine-silver alloy stakes, diamantine-tipped and micro-etched with prayers of anathema against witches and Daemons. They count as Holy and gain Tearing against targets with a Psy Rating or Sorcery. If more than 5 Damage is dealt after Armour and Toughness Bonus, the bolt becomes embedded; removing it by force deals an additional 1d5 Damage ignoring Armour and Toughness Bonus. Stake-bolts are only obtainable through the Holy Ordos.",
  },
  {
    id: "lw-purity-round",
    name: "Purity Round",
    source: SkillSource.LW,
    compatibleWith: "Crossbow, Hand Bow (or Stub Revolver / Stub Automatic at double cost)",
    cost: "300 Thrones",
    purchaseAmount: "1",
    availability: "Very Rare",
    description:
      "Favoured by the Cult of the Pure Form, each round contains a small haywire generator that " +
      "activates on impact. Grants the Haywire (2) quality to the attack. " +
      "Purchased like regular crossbow and hand bow quarrels; can be adapted for stub revolvers " +
      "and stub automatics but the cost is doubled.",
  },

  // ── Creatures Anathema ───────────────────────────────────────────────────
  {
    id: "ca-shuriken-clip",
    name: "Shuriken Clip",
    source: SkillSource.CA,
    compatibleWith: "Shuriken Pistol, Avenger Shuriken Catapult",
    cost: "500 Thrones",
    purchaseAmount: "full clip",
    availability: "Very Rare",
    description:
      "Solid core monomolecular discs. Imperial technology cannot replicate this ammunition — " +
      "it is only available through xenos sources.",
  },
];
