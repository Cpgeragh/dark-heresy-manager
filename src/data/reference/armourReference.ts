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
}

// Convenience shorthand for "all locations"
const ALL: ArmourLocationKey[] = ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"];

// ─── Armour Reference ────────────────────────────────────────────────────────

export const ARMOUR_REFERENCE: ArmourRef[] = [

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "blessed-sackcloth-tunic",
    name: "Blessed Sackcloth Tunic",
    source: SkillSource.BoM,
    locations: ["body"],
    ap: 2,
    notes:
      "Sanctified. +10 to Tests to resist any direct psychic attack or manipulation. " +
      "Wearing next to skin causes intense irritation — characters who must suppress " +
      "their Toughness Bonus in hours must make a Toughness Test or gain 1 Fatigue.",
    weight: "1kg",
    value: "50 Thrones",
    rarity: "Scarce",
  },
  {
    id: "ecclesiarchy-overlay",
    name: "Ecclesiarchy Overlay",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 0,
    notes:
      "Adds no AP of its own. Applied over normal armour, it carries Ministrorum mottos, " +
      "prayers, and purity seals. +10 to Command and Fellowship Tests when seeking to " +
      "inspire, lead, or rally the faithful.",
    weight: "1kg",
    value: "40 Thrones",
    rarity: "Scarce",
  },
  {
    id: "hospitaller-carapace",
    name: "Hospitaller Carapace",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 5,
    apOverrides: { head: 4 },
    notes:
      "Sanctified and sealed with sacred oils. +20 to resist toxins or diseases that do " +
      "not directly penetrate the armour (e.g. poison gas, rotting bodies). " +
      "Helmet incorporates a re-breather.",
    weight: "12kg",
    value: "1,200 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "praesidium-protectiva",
    name: "Praesidium Protectiva",
    source: SkillSource.BoM,
    locations: ["rightArm"],
    ap: 8,
    notes:
      "Defensive quality. Spend a Reaction to add the Praesidium's AP to attacks from " +
      "either side. Ranged attacks from outside melee range have a –10 penalty to hit the " +
      "protected arm. An attacking Party in melee gains an extra AP from the parry. " +
      "Allows the Sister to bash with a one-handed weapon for 1d10+1 I (plus SB) damage. " +
      "Can be worn on either arm — adjust the covered location accordingly.",
    weight: "5kg",
    value: "300 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "sanctified-carapace",
    name: "Sanctified Carapace",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 6,
    notes:
      "Sanctified. Provides full AP against psychic force or warp energy attacks. " +
      "Blessed with sacred oils — all warp-sourced damage that does not penetrate the " +
      "armour is entirely negated.",
    weight: "14kg",
    value: "1,500 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "sanctified-chain-coat",
    name: "Sanctified Chain Coat",
    source: SkillSource.BoM,
    locations: ["body", "rightArm", "leftArm"],
    ap: 4,
    notes:
      "Sanctified. Prayers engraved into individual rings. Provides full AP against " +
      "attacks of psychic force or warp energy that deal damage directly as well as " +
      "attacks made with the Warp Weapon effect.",
    weight: "8kg",
    value: "400 Thrones",
    rarity: "Rare",
  },
  {
    id: "shield-robes",
    name: "Shield Robes",
    source: SkillSource.BoM,
    locations: ["body", "rightArm", "leftArm", "rightLeg", "leftLeg"],
    ap: 2,
    notes:
      "Worn by non-militant Sisters and novices of the Adepta Sororitas. Exchanging " +
      "armour for shield robes typically occurs when the armour is being maintained. " +
      "Iconography dedicated to a single cult.",
    weight: "4kg",
    value: "30 Thrones",
    rarity: "Scarce",
  },
  {
    id: "sororitas-power-armour",
    name: "Sororitas Power Armour",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 7,
    apOverrides: { body: 8 },
    notes:
      "Power armour using a standard power supply as a backpack. Helmet includes an " +
      "integrated targeting system (+20 Sight), rebreather, and comm-link. " +
      "Users with a Heavy weapon count as Braced. Typically not issued until the Sister " +
      "proves herself. Cannot be used without a helmet.",
    weight: "35kg",
    value: "10,000 Thrones",
    rarity: "Extremely Rare",
  },

];
