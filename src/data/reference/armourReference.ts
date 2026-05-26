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
      "+10 on Tests to resist any direct psychic attack or manipulation. " +
      "When worn for longer than the wearer's Toughness Bonus in hours, they must make a " +
      "Toughness Test or gain 1 Level of Fatigue.",
    weight: "4 kg",
    value: "500 Thrones",
    rarity: "Rare",
  },
  {
    id: "ecclesiarchy-overlay",
    name: "Ecclesiarchy Overlay",
    source: SkillSource.BoM,
    locations: ALL,
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
      "+20 to resist toxins or diseases that do not penetrate the armour (e.g. poison gas, rotting bodies). " +
      "Helmet incorporates a re-breather.",
    weight: "20 kg",
    value: "7,500 Thrones",
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
      "The wearer may also bash with a one-handed weapon for 1d10+2 I (plus Strength Bonus). " +
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
      "Sanctified. Provides full Armour Points against attacks of psychic force or warp energy. " +
      "Warp-sourced damage that does not penetrate the armour is entirely negated. " +
      "Also effective against attacks with the Warp Weapon quality.",
    weight: "18 kg",
    value: "20,000 Thrones",
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
    ap: 2,
    weight: "6 kg",
    value: "250 Thrones",
    rarity: "Rare",
  },
  {
    id: "sororitas-power-armour",
    name: "Sororitas Power Armour",
    source: SkillSource.BoM,
    locations: ALL,
    ap: 7,
    apOverrides: { body: 8 },
    notes:
      "AP 7 all locations (AP 8 on Body). " +
      "Integrated targeter (+5 BS), re-breather, and comm-link. " +
      "Users with a Heavy weapon count as Braced. " +
      "Critical Damage to the Body location triggers the Damaging Power Armour table: " +
      "1–3 unaffected; 4–5 all armour bonuses (except inherent AP) lost, –10 penalty, Base Movement –2; " +
      "6+ suit shuts down entirely — all benefits including AP lost, wearer must pass a Strength Test " +
      "(+20, –10 per failure) to move, Base Movement reduced to 1, –20 to all physical actions. " +
      "Problems continue until repaired with a Challenging (+0) Tech-Use Test.",
    weight: "35 kg",
    value: "20,000 Thrones",
    rarity: "Very Rare",
  },

];
