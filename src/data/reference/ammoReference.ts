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
  cost: string;
  /**
   * How many rounds/charges per purchase.
   * Numeric string ("20", "6", "1") or "full clip" for weapons
   * where the amount equals the weapon's own clip size.
   */
  purchaseAmount: string;
  rarity: string;
  /** Game-mechanical effects for special ammunition */
  description?: string;
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
    rarity: "Common",
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
    rarity: "Common",
    description:
      "Solid lead or stone balls and a powder charge used in primitive blackpowder weapons.",
  },
  {
    id: "cr-bullets",
    name: "Bullets",
    source: SkillSource.CR,
    compatibleWith: "Autopistol, stub revolver, stub automatic, hand cannon, autogun, hunting rifle and heavy stubber",
    cost: "1 Throne",
    purchaseAmount: "20",
    rarity: "Plentiful",
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
    rarity: "Common",
    description:
      "Shells contain dozens of tiny balls and scatter over a wide area when fired, making them ideal for close-in work where accuracy is less important.",
  },

  // ── Core Rulebook — Charge Packs ────────────────────────────────────────

  {
    id: "cr-charge-pack-pistol",
    name: "Charge Pack (pistol)",
    source: SkillSource.CR,
    compatibleWith: "Laspistol, las carbine, lasgun, long las, MP lascannon",
    cost: "10 Thrones",
    purchaseAmount: "full clip",
    rarity: "Common",
    description:
      "Powerful batteries used almost exclusively by las weapons. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-charge-pack-basic",
    name: "Charge Pack (basic)",
    source: SkillSource.CR,
    compatibleWith: "Laspistol, las carbine, lasgun, long las, MP lascannon",
    cost: "15 Thrones",
    purchaseAmount: "full clip",
    rarity: "Common",
    description:
      "Powerful batteries used almost exclusively by las weapons. Provides shots equal to the weapon's full clip value.",
  },
  {
    id: "cr-charge-pack-heavy",
    name: "Charge Pack (heavy)",
    source: SkillSource.CR,
    compatibleWith: "Laspistol, las carbine, lasgun, long las, MP lascannon",
    cost: "30 Thrones",
    purchaseAmount: "full clip",
    rarity: "Rare",
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
    rarity: "Scarce",
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
    rarity: "Scarce",
    description:
      "Liquid fuel for flame weapons, ranging from purest promethium to crude flammable alcohols. Provides shots equal to the weapon's full clip value.",
  },

  // ── Core Rulebook — Bolt ─────────────────────────────────────────────────

  {
    id: "cr-bolt-shells",
    name: "Bolt Shells",
    source: SkillSource.CR,
    compatibleWith: "Bolt pistols, bolters and heavy bolters",
    cost: "16 Thrones",
    purchaseAmount: "1",
    rarity: "Rare",
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
    rarity: "Very Rare",
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
    rarity: "Rare",
    description:
      "Specially refined chemicals injected into highly pressurised canisters for meltaguns. Provides shots equal to the weapon's full clip value.",
  },

  // ── Core Rulebook — Plasma ───────────────────────────────────────────────

  {
    id: "cr-plasma-flask-pistol",
    name: "Plasma Flask (pistol)",
    source: SkillSource.CR,
    compatibleWith: "Plasma pistols and plasma guns",
    cost: "24 Thrones",
    purchaseAmount: "full clip",
    rarity: "Rare",
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
    rarity: "Rare",
    description:
      "Highly dangerous and volatile photonic hydrogen, compressed and contained within reinforced flasks. Provides shots equal to the weapon's full clip value.",
  },

  // ── Core Rulebook — Special ──────────────────────────────────────────────

  {
    id: "cr-exotic",
    name: "Exotic",
    source: SkillSource.CR,
    compatibleWith: "Needle pistol, needle rifle, web pistol and webber",
    cost: "20 Thrones",
    purchaseAmount: "1",
    rarity: "Very Rare",
    description:
      "Many weapons use unusual ammunition, from the viscous gel of a webber to the finely crafted darts of a needle pistol. GMs may increase the cost of exotic ammunition depending on its rarity.",
  },
  {
    id: "cr-dumdum-bullets",
    name: "Dumdum Bullets",
    source: SkillSource.CR,
    compatibleWith: "Stub revolvers, stub automatics and hand cannons",
    cost: "5 Thrones",
    purchaseAmount: "6",
    rarity: "Scarce",
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
    rarity: "Scarce",
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
    rarity: "Rare",
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
    rarity: "Scarce",
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
    rarity: "Rare",
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
    rarity: "Very Rare",
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
    rarity: "Very Rare",
    description:
      "Psychically charged promethium for flamer weapons. Ignores protection from psychic powers or Sorcery. " +
      "Counts as Sanctified. Targets in the area of effect suffer –5 to their Agility Test per point of the user's Psy Rating.",
  },

  // ── Creatures Anathema ───────────────────────────────────────────────────
  {
    id: "ca-shuriken-clip",
    name: "Shuriken Clip",
    source: SkillSource.CA,
    compatibleWith: "Shuriken Pistol, Avenger Shuriken Catapult",
    cost: "500 Thrones",
    purchaseAmount: "full clip",
    rarity: "Very Rare",
    description:
      "Solid core monomolecular discs. Imperial technology cannot replicate this ammunition — " +
      "it is only available through xenos sources.",
  },
];
