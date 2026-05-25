// src/data/reference/armourReference.ts
// Reference data for armour items, organised by source book.
// Feeds into the future reference-lookup UI on the Armour tab.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArmourRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Body locations covered, e.g. "All", "Body", "Arms, Body" */
  locations: string;
  /** Armour Points granted. Use a string when AP varies by location (e.g. "5 (4 on Head)"). */
  ap: number | string;
  /** Any special rules, properties, or notes for the armour. */
  notes?: string;
}

// ─── Armour Reference ────────────────────────────────────────────────────────

export const ARMOUR_REFERENCE: ArmourRef[] = [

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "blessed-sackcloth-tunic",
    name: "Blessed Sackcloth Tunic",
    source: SkillSource.BoM,
    locations: "Body",
    ap: 2,
    notes:
      "Sanctified. +10 to Tests to resist any direct psychic attack or manipulation. " +
      "Wearing next to skin causes intense irritation — characters who must suppress " +
      "their Toughness Bonus in hours must make a Toughness Test or gain 1 Fatigue.",
  },
  {
    id: "ecclesiarchy-overlay",
    name: "Ecclesiarchy Overlay",
    source: SkillSource.BoM,
    locations: "Over any existing armour",
    ap: 0,
    notes:
      "Adds no AP of its own. Applied over normal armour, it carries Ministrorum mottos, " +
      "prayers, and purity seals. +10 to Command and Fellowship Tests when seeking to " +
      "inspire, lead, or rally the faithful.",
  },
  {
    id: "hospitaller-carapace",
    name: "Hospitaller Carapace",
    source: SkillSource.BoM,
    locations: "All",
    ap: "5 (4 on Head)",
    notes:
      "Sanctified and sealed with sacred oils. +20 to resist toxins or diseases that do " +
      "not directly penetrate the armour (e.g. poison gas, rotting bodies). " +
      "Helmet incorporates a re-breather.",
  },
  {
    id: "praesidium-protectiva",
    name: "Praesidium Protectiva",
    source: SkillSource.BoM,
    locations: "One arm (see notes)",
    ap: 8,
    notes:
      "Defensive quality. Spend a Reaction to add the Praesidium's AP to attacks from " +
      "either side. Ranged attacks from outside melee range have a –10 penalty to hit the " +
      "protected arm. An attacking Party in melee gains an extra AP from the parry. " +
      "Allows the Sister to bash with a one-handed weapon for 1d10+1 I (plus SB) damage.",
  },
  {
    id: "sanctified-carapace",
    name: "Sanctified Carapace",
    source: SkillSource.BoM,
    locations: "All",
    ap: 6,
    notes:
      "Sanctified. Provides full AP against psychic force or warp energy attacks. " +
      "Blessed with sacred oils — all warp-sourced damage that does not penetrate the " +
      "armour is entirely negated.",
  },
  {
    id: "sanctified-chain-coat",
    name: "Sanctified Chain Coat",
    source: SkillSource.BoM,
    locations: "Arms, Body",
    ap: 4,
    notes:
      "Sanctified. Prayers engraved into individual rings. Provides full AP against " +
      "attacks of psychic force or warp energy that deal damage directly as well as " +
      "attacks made with the Warp Weapon effect.",
  },
  {
    id: "shield-robes",
    name: "Shield Robes",
    source: SkillSource.BoM,
    locations: "Arms, Legs, Body",
    ap: 2,
    notes:
      "Worn by non-militant Sisters and novices of the Adepta Sororitas. Exchanging " +
      "armour for shield robes typically occurs when the armour is being maintained. " +
      "Iconography dedicated to a single cult.",
  },
  {
    id: "sororitas-power-armour",
    name: "Sororitas Power Armour",
    source: SkillSource.BoM,
    locations: "All",
    ap: "7 (8 on Body)",
    notes:
      "Power armour using a standard power supply as a backpack. Helmet includes an " +
      "integrated targeting system (+20 Sight), rebreather, and comm-link. " +
      "Users with a Heavy weapon count as Braced. Typically not issued until the Sister " +
      "proves herself. Cannot be used without a helmet.",
  },

];
