// src/data/reference/armourReference.ts
// Reference data for armour items, organised by source book.
// Feeds into the reference-lookup UI on the Armour tab.

import { SkillSource } from "../../types/SkillSource";
import type { ArmourLocationKey } from "../../types/Character";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArmourRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Locations this piece covers */
  locations: ArmourLocationKey[];
  /** Base AP applied to all covered locations */
  ap: number;
  /** Per-location AP override when a piece is asymmetric (e.g. 5 everywhere but 4 on head) */
  apOverrides?: Partial<Record<ArmourLocationKey, number>>;
  /** Any special rules, properties, or notes for the armour. */
  notes?: string;
  weight: string;
  value: string;
  rarity: string;
  /** true for force fields — they have a Protection Rating, not AP, and cover no fixed locations */
  isForceField?: boolean;
  /** Protection Rating for force fields */
  protectionRating?: number;
}

// Convenience shorthands for common location sets
const ALL: ArmourLocationKey[] = ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"];
const ARMS_BODY_LEGS: ArmourLocationKey[] = ["body", "rightArm", "leftArm", "rightLeg", "leftLeg"];
const ARMS: ArmourLocationKey[] = ["rightArm", "leftArm"];
const LEGS: ArmourLocationKey[] = ["rightLeg", "leftLeg"];

// ─── Armour Reference ────────────────────────────────────────────────────────

const PRIMITIVE_NOTE =
  "Primitive. Only provides full AP against weapons that also have the Primitive quality. " +
  "Against all other attacks, AP is halved (round up).";

const FLAK_NOTE =
  "Counts as AP 5 against any hit from a weapon with the Blast quality, " +
  "provided the wearer was not at the point where the blast originated.";

const MESH_NOTE =
  "Mesh. Formed from thousands of thermoplas cells linked together. " +
  "Becomes momentarily rigid to spread and dissipate impacts and heat energy.";

export const ARMOUR_REFERENCE: ArmourRef[] = [
  // ── Core Rulebook — Primitive Armour ─────────────────────────────────────
  {
    id: "cr-gang-leathers",
    name: "Gang Leathers",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 1,
    notes: PRIMITIVE_NOTE,
    weight: "5 kg",
    value: "25 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-heavy-leathers",
    name: "Heavy Leathers",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 2,
    notes: PRIMITIVE_NOTE,
    weight: "7 kg",
    value: "100 Thrones",
    rarity: "Common",
  },
  {
    id: "cr-quilted-vest",
    name: "Quilted Vest",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 2,
    notes: PRIMITIVE_NOTE,
    weight: "2 kg",
    value: "10 Thrones",
    rarity: "Common",
  },
  {
    id: "cr-beast-furs",
    name: "Beast Furs",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 2,
    notes: PRIMITIVE_NOTE,
    weight: "10 kg",
    value: "5 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-grox-hides",
    name: "Grox Hides",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 3,
    notes: PRIMITIVE_NOTE,
    weight: "14 kg",
    value: "60 Thrones",
    rarity: "Common",
  },
  {
    id: "cr-chain-coat",
    name: "Chain Coat",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 3,
    notes: PRIMITIVE_NOTE,
    weight: "18 kg",
    value: "50 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-feudal-plate",
    name: "Feudal Plate",
    source: SkillSource.CR,
    locations: ALL,
    ap: 5,
    notes: PRIMITIVE_NOTE,
    weight: "30 kg",
    value: "120 Thrones",
    rarity: "Scarce",
  },
  {
    id: "cr-xeno-hides",
    name: "Xeno Hides",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 6,
    notes: PRIMITIVE_NOTE,
    weight: "22 kg",
    value: "5,000 Thrones",
    rarity: "Very Rare",
  },

  // ── Core Rulebook — Flak Armour ───────────────────────────────────────────
  {
    id: "cr-flak-helmet",
    name: "Flak Helmet",
    source: SkillSource.CR,
    locations: ["head"],
    ap: 2,
    notes: FLAK_NOTE,
    weight: "2 kg",
    value: "25 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-flak-gauntlets",
    name: "Flak Gauntlets",
    source: SkillSource.CR,
    locations: ARMS,
    ap: 2,
    notes: FLAK_NOTE,
    weight: "1 kg",
    value: "50 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-light-flak-coat",
    name: "Light Flak Coat",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 2,
    notes: FLAK_NOTE,
    weight: "4 kg",
    value: "80 Thrones",
    rarity: "Scarce",
  },
  {
    id: "cr-flak-vest",
    name: "Flak Vest",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 3,
    notes: FLAK_NOTE,
    weight: "5 kg",
    value: "50 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-flak-jacket",
    name: "Flak Jacket",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 3,
    notes: FLAK_NOTE,
    weight: "6 kg",
    value: "100 Thrones",
    rarity: "Average",
  },
  {
    id: "cr-flak-cloak",
    name: "Flak Cloak",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 3,
    notes: FLAK_NOTE,
    weight: "8 kg",
    value: "80 Thrones",
    rarity: "Scarce",
  },
  {
    id: "cr-guard-flak-armour",
    name: "Guard Flak Armour",
    source: SkillSource.CR,
    locations: ALL,
    ap: 4,
    notes: FLAK_NOTE,
    weight: "11 kg",
    value: "300 Thrones",
    rarity: "Scarce",
  },

  // ── Core Rulebook — Mesh Armour ───────────────────────────────────────────
  {
    id: "cr-mesh-cowl",
    name: "Mesh Cowl",
    source: SkillSource.CR,
    locations: ["head"],
    ap: 3,
    notes: MESH_NOTE,
    weight: "0.5 kg",
    value: "100 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-mesh-gloves",
    name: "Mesh Gloves",
    source: SkillSource.CR,
    locations: ARMS,
    ap: 3,
    notes: MESH_NOTE,
    weight: "0.5 kg",
    value: "120 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-xeno-mesh",
    name: "Xeno Mesh",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 4,
    notes: MESH_NOTE,
    weight: "2 kg",
    value: "375 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-mesh-vest",
    name: "Mesh Vest",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 4,
    notes: MESH_NOTE,
    weight: "1 kg",
    value: "150 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-mesh-combat-cloak",
    name: "Mesh Combat Cloak",
    source: SkillSource.CR,
    locations: ["body", "rightArm", "leftArm"],
    ap: 4,
    notes: MESH_NOTE,
    weight: "1.5 kg",
    value: "350 Thrones",
    rarity: "Very Rare",
  },

  // ── Core Rulebook — Carapace Armour ──────────────────────────────────────
  {
    id: "cr-carapace-helm",
    name: "Carapace Helm",
    source: SkillSource.CR,
    locations: ["head"],
    ap: 4,
    notes: "Densely layered armaplas, ceramite, or other highly durable material.",
    weight: "2 kg",
    value: "250 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-carapace-vambraces",
    name: "Carapace Vambraces",
    source: SkillSource.CR,
    locations: ARMS,
    ap: 5,
    notes:
      "Densely layered plates of armaplas, ceramite, or another highly durable material. Heavy to wear and difficult to fit over flexible areas such as joints.",
    weight: "2 kg",
    value: "300 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-carapace-greaves",
    name: "Carapace Greaves",
    source: SkillSource.CR,
    locations: LEGS,
    ap: 5,
    notes:
      "Densely layered plates of armaplas, ceramite, or another highly durable material. Heavy to wear and difficult to fit over flexible areas such as joints.",
    weight: "3 kg",
    value: "375 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-enforcer-light-carapace",
    name: "Enforcer Light Carapace",
    source: SkillSource.CR,
    locations: ARMS_BODY_LEGS,
    ap: 5,
    notes:
      "Densely layered plates of armaplas, ceramite, or another highly durable material. Heavy to wear and difficult to fit over flexible areas such as joints.",
    weight: "15 kg",
    value: "575 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-carapace-chest-plate",
    name: "Carapace Chest Plate",
    source: SkillSource.CR,
    locations: ["body"],
    ap: 6,
    notes:
      "Densely layered plates of armaplas, ceramite, or another highly durable material. Heavy to wear and difficult to fit over flexible areas such as joints.",
    weight: "7 kg",
    value: "600 Thrones",
    rarity: "Rare",
  },
  {
    id: "cr-storm-trooper-carapace",
    name: "Storm Trooper Carapace",
    source: SkillSource.CR,
    locations: ALL,
    ap: 6,
    notes:
      "Densely layered plates of armaplas, ceramite, or another highly durable material. Heavy to wear and difficult to fit over flexible areas such as joints.",
    weight: "17 kg",
    value: "3,750 Thrones",
    rarity: "Very Rare",
  },

  // ── Core Rulebook — Power Armour ──────────────────────────────────────────
  {
    id: "cr-light-power-armour",
    name: "Light Power Armour",
    source: SkillSource.CR,
    locations: ALL,
    ap: 7,
    notes:
      "+20 Strength. Increases wearer's size by one step. " +
      "Requires a constant power supply; a standard non-military supply lasts 1d5 hours before needing replacement or recharging.",
    weight: "40 kg",
    value: "8,500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "cr-power-armour",
    name: "Power Armour",
    source: SkillSource.CR,
    locations: ALL,
    ap: 8,
    notes:
      "+20 Strength. Increases wearer's size by one step. " +
      "Requires a constant power supply; a standard non-military supply lasts 1d5 hours before needing replacement or recharging.",
    weight: "65 kg",
    value: "15,000 Thrones",
    rarity: "Very Rare",
  },

  // ── Book of Judgement ─────────────────────────────────────────────────────
  {
    id: "adeptus-arbites-carapace",
    name: "Adeptus Arbites Carapace Armour",
    source: SkillSource.BoJ,
    locations: ALL,
    ap: 6,
    notes:
      "Includes integrated micro-bead (vox-torc), polarising lenses (negates photon flash grenades), " +
      "rebreather mountings, and mag-strips for attaching weapons and equipment. " +
      "Lock gloves count as recoil gloves. Helmet can be hermetically sealed.",
    weight: "14 kg",
    value: "3,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "arbites-riot-armour",
    name: "Arbites Riot Armour",
    source: SkillSource.BoJ,
    locations: ALL,
    ap: 1,
    notes:
      "Worn over Carapace armour. The +1 AP only protects against Impact Damage — " +
      "all other damage types bypass it entirely. Reduces Agility by 10 while worn.",
    weight: "4 kg",
    value: "270 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "ballistic-cloth-surcoat",
    name: "Ballistic Cloth Surcoat",
    source: SkillSource.BoJ,
    locations: ["body", "rightArm", "leftArm"],
    ap: 1,
    notes:
      "Worn over Carapace armour. Must be tailor-made for the wearer and their equipment. " +
      "Adds +1 AP to Arms and Body.",
    weight: "1 kg",
    value: "275 Thrones",
    rarity: "Rare",
  },
  {
    id: "gutterforged-armour",
    name: "Gutterforged Armour",
    source: SkillSource.BoJ,
    locations: ["head", "body", "rightArm", "leftArm"],
    ap: 5,
    notes:
      "Crudely home-forged carapace of hammered pig iron. Extremely heavy — " +
      "wearer suffers –15 to Agility.",
    weight: "41.5 kg",
    value: "350 Thrones",
    rarity: "Scarce",
  },
  {
    id: "judge-armour",
    name: "Judge Armour",
    source: SkillSource.BoJ,
    locations: ALL,
    ap: 6,
    notes:
      "Finest artisan-crafted carapace with theatrical robes and headdress. " +
      "+5 bonus to Interrogation and Intimidate Tests against individuals " +
      "from the planet where the Judge is stationed.",
    weight: "16.5 kg",
    value: "5,500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "verispex-armour",
    name: "Verispex Armour",
    source: SkillSource.BoJ,
    locations: ["body", "rightArm", "leftArm"],
    ap: 2,
    notes:
      "Contains an auspex, chrono, combi-tool, and data-slate. " +
      "+10 to Awareness and Medicae Tests made to find information in the field.",
    weight: "5.5 kg",
    value: "500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "verispex-helm",
    name: "Verispex Helm",
    source: SkillSource.BoJ,
    locations: ["head"],
    ap: 4,
    notes:
      "Includes both infra-red goggles and a photo-visor. Adds +10 to Search and Tracking Tests.",
    weight: "2.5 kg",
    value: "750 Thrones",
    rarity: "Very Rare",
  },

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "blessed-sackcloth-tunic",
    name: "Blessed Sackcloth Tunic",
    source: SkillSource.BoM,
    locations: ["body"],
    ap: 2,
    notes:
      "+10 on Tests to resist any direct psychic attack or manipulation. " +
      "Provides full Armour Points against attacks of psychic force or warp energy that deal damage directly, " +
      "and against attacks made with the Warp Weapon quality. " +
      "Can be worn under other armour, but prolonged wear causes irritation: after more than Toughness Bonus " +
      "hours in such a combination, the wearer must pass a Toughness Test or gain 1 Level of Fatigue.",
    weight: "4 kg",
    value: "500 Thrones",
    rarity: "Rare",
  },
  {
    id: "ecclesiarchy-overlay",
    name: "Ecclesiarchy Overlay",
    source: SkillSource.BoM,
    locations: [],
    ap: 0,
    notes:
      "Applied over any normal suit of armour; adds no AP of its own. " +
      "+10 bonus to Command and Fellowship Tests when inspiring, leading, or rallying the faithful.",
    weight: "+2 kg",
    value: "1,000 Thrones",
    rarity: "Rare",
  },
  {
    id: "hospitaller-carapace",
    name: "Hospitaller Carapace",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 5,
    apOverrides: { head: 4 },
    notes:
      "AP 5 all locations (AP 4 on Head). " +
      "+20 to resist toxins or diseases that do not penetrate the armour. " +
      "+10 on Fear Tests with an olfactory component (e.g. rotting bodies). " +
      "Helmet incorporates a re-breather.",
    weight: "20 kg",
    value: "10,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "praesidium-protectiva",
    name: "Praesidium Protectiva",
    source: SkillSource.BoM,
    locations: ["rightArm"],
    ap: 8,
    notes:
      "Defensive quality. Requires Sororitas Power Armour to use. " +
      "Spend a Reaction to Parry attacks (including Ranged Weapon attacks) using Weapon Skill. " +
      "A successful Parry grants the wearer the Praesidium's AP as additional protection. " +
      "The wearer may also bash with a one-handed weapon for 1d5+2 I (plus Strength Bonus). " +
      "Can be worn on either arm — adjust the covered location accordingly.",
    weight: "14 kg",
    value: "7,500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "sanctified-carapace",
    name: "Sanctified Carapace",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 6,
    notes:
      "+10 on Tests to resist any direct psychic attack or manipulation. " +
      "Provides full Armour Points against attacks of psychic force or warp energy that deal damage directly, " +
      "and against attacks made with the Warp Weapon quality. " +
      "Gauntlet strikes count as Holy. " +
      "All supernatural creatures within 20 metres take a –10 penalty to Willpower Tests.",
    weight: "18 kg",
    value: "6,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "sanctified-chain-coat",
    name: "Sanctified Chain Coat",
    source: SkillSource.BoM,
    locations: ["body", "rightArm", "leftArm"],
    ap: 4,
    notes:
      "Sanctified. Provides full Armour Points against attacks of psychic force or warp energy " +
      "that deal damage directly, and against attacks made with the Warp Weapon quality.",
    weight: "15 kg",
    value: "750 Thrones",
    rarity: "Rare",
  },
  {
    id: "shield-robes",
    name: "Shield Robes",
    source: SkillSource.BoM,
    locations: ["body", "rightArm", "leftArm", "rightLeg", "leftLeg"],
    ap: 3,
    notes:
      "Consecrated mesh robes worn by Orders Non-militant and noviciates; also used by Clerics in combat. " +
      "Can be worn as secondary clothing while Power Armour is under maintenance.",
    weight: "2 kg",
    value: "5,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "sororitas-power-armour",
    name: "Sororitas Powered Armour",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 7,
    apOverrides: { body: 8 },
    notes:
      "AP 7 all locations (AP 8 on Body). +10 Strength. " +
      "Integrated targeter (+5 BS), re-breather, and comm-link. " +
      "Users with a Heavy weapon count as Braced. " +
      "Critical Damage to the Body from behind triggers the Power Unit table: " +
      "1–3 unaffected; 4–5 all armour bonuses (except inherent AP) lost, –10 to all physical actions, Base Movement –2; " +
      "6+ suit shuts down — all benefits (except inherent AP) lost, wearer must pass a Hard (–20) Strength Test to move at all; " +
      "on success, Base Movement is reduced to 1 and all physical actions suffer –20. " +
      "Problems continue until repaired with a Challenging (+0) Tech-Use Test.",
    weight: "35 kg",
    value: "20,000 Thrones",
    rarity: "Very Rare",
  },

  // ── Daemon Hunter ─────────────────────────────────────────────────────────
  {
    id: "dh-iron-collar",
    name: "Iron Collar",
    source: SkillSource.DH,
    locations: ["head"],
    ap: 3,
    notes:
      "Rigid metal gorget. –10 penalty to Dodge Tests. " +
      "Critical damage to the Head location is reduced by 2.",
    weight: "3 kg",
    value: "20 Thrones",
    rarity: "Common",
  },
  {
    id: "dh-malleus-power-armour",
    name: "Malleus Power Armour",
    source: SkillSource.DH,
    locations: ALL,
    ap: 9,
    notes:
      "Best Craftsmanship. Inscribed with pentagrammatic wards — any Daemon striking the wearer " +
      "with its natural weapons takes 1d5 damage ignoring Armour and Toughness Bonus. " +
      "Power pack lasts one week without recharging. Otherwise identical to standard Power Armour.",
    weight: "180 kg",
    value: "25,000 Thrones",
    rarity: "Near Unique",
  },
  {
    id: "dh-malleus-terminator-armour",
    name: "Malleus Terminator Armour",
    source: SkillSource.DH,
    locations: ALL,
    ap: 12,
    notes:
      "Auto-Stabilised; Heavy and Mounted weapons may be fired one-handed. +30 Strength (not +20). " +
      "Integrated sensorium (as auspex). Built-in Refraction Field (PR 35, does not overload normally). " +
      "Cannot run; –20 Agility; cannot Dodge (may still Parry). " +
      "Weapon configuration requires senior Tech-Priests with ceremonial facilities to change. " +
      "Daemons striking the wearer with natural weapons take 1d5 damage ignoring Armour and Toughness Bonus.",
    weight: "400 kg",
    value: "—",
    rarity: "Unique",
  },

  // ── Daemon Hunter — Force Fields ─────────────────────────────────────────
  {
    id: "dh-refraction-bracer",
    name: "Refraction Bracer",
    source: SkillSource.DH,
    isForceField: true,
    protectionRating: 30,
    locations: [],
    ap: 0,
    notes:
      "Protection Rating 30. Protects body and arms only — head and legs are unprotected. " +
      "Does not function against area attacks, although it may help against some Flame weapons if the GM wishes. " +
      "A character may only benefit from one field at a time. When attacked, roll d100; if the result is less than " +
      "or equal to the field's Protection Rating, the attack is nullified. Fields may overload: Poor overloads on " +
      "01-15, Common on 01-10, Good on 01-05, and Best on 1. An overloaded field ceases to function until recharged " +
      "or repaired with the Luminen Charge Talent or a Very Hard (-30) Tech-Use Test.",
    weight: "0.3 kg",
    value: "5,000 Thrones",
    rarity: "Rare",
  },
  {
    id: "dh-refraction-field-brontian",
    name: "Refraction Field (Brontian Pattern)",
    source: SkillSource.DH,
    isForceField: true,
    protectionRating: 30,
    locations: [],
    ap: 0,
    notes:
      "Protection Rating 30. Common refractor field often found among Officers of the Brontian Longknives. " +
      "Acolytes and Throne Agents in service of the Calixis Ordo Malleus treat availability as Rare instead of Very Rare " +
      "and reduce the purchase cost by 25%. A character may only benefit from one field at a time. When attacked, roll d100; " +
      "if the result is less than or equal to the field's Protection Rating, the attack is nullified. Fields may overload: " +
      "Poor overloads on 01-15, Common on 01-10, Good on 01-05, and Best on 1. An overloaded field ceases to function until " +
      "recharged or repaired with the Luminen Charge Talent or a Very Hard (-30) Tech-Use Test.",
    weight: "0.4 kg",
    value: "15,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "dh-jokaerian-field",
    name: "Jokaerian Field",
    source: SkillSource.DH,
    isForceField: true,
    protectionRating: 70,
    locations: [],
    ap: 0,
    notes:
      "Protection Rating 70. Functions only against psychic attacks, including friendly psychic powers originating more than 5m away. " +
      "Any creature with the Daemonic trait that passes or remains within 5m suffers 1d10 damage ignoring Armour and Toughness Bonus. " +
      "A character may only benefit from one field at a time. When attacked, roll d100; if the result is less than or equal to the field's " +
      "Protection Rating, the attack is nullified. Fields may overload: Poor overloads on 01-15, Common on 01-10, Good on 01-05, and Best on 1. " +
      "An overloaded field ceases to function until recharged or repaired with the Luminen Charge Talent or a Very Hard (-30) Tech-Use Test.",
    weight: "0.5 kg",
    value: "50,000 Thrones",
    rarity: "Near Unique",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────
  {
    id: "lw-crimson-armour",
    name: "Crimson Armour",
    source: SkillSource.LW,
    locations: ALL,
    ap: 6,
    notes:
      "Issued exclusively to the Crimson Guard. Based on Storm Trooper carapace but significantly " +
      "lighter thanks to the extraordinary manufacturing techniques of the Lathes. Equipped with a " +
      "Good-Quality photo-visor, granting the Dark Sight trait and immunity to flash grenades. " +
      "The intimidating skull-shaped mask also grants +10 to Intimidate Tests.",
    weight: "6 kg",
    value: "12,500 Thrones",
    rarity: "Extremely Rare",
  },

  // ── Creatures Anathema ───────────────────────────────────────────────────
  {
    id: "ca-ork-mega-armour",
    name: "Ork Mega Armour",
    source: SkillSource.CA,
    locations: ALL,
    ap: 10,
    apOverrides: { head: 6, body: 14 },
    notes:
      "AP 6 Head, AP 10 Arms and Legs, AP 14 Body. Adds +30 Strength and increases size by one step. " +
      "Requires a constant power supply from onboard generators and engines, usually solid fuel, and must be refuelled every 1d5 hours. " +
      "Without power, the armour cannot move. Far too bulky to be worn by a human.",
    weight: "60 kg",
    value: "—",
    rarity: "Unavailable",
  },
];
