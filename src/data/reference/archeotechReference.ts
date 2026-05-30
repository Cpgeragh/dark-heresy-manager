// src/data/reference/archeotechReference.ts
// Reference stat-blocks for archeotech items, organised by source book.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArcheotechRef {
  id: string;
  name: string;
  source: string;
  /** Broad category: "Grenade", "Mine", "Weapon", "Device", "Tool", etc. */
  type: string;
  /** Full rules text shown in the info panel / picker */
  description: string;
  specialRules?: string;
  weight?: string;
  value?: string;
  rarity?: string;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export const ARCHEOTECH_REFERENCE: ArcheotechRef[] = [

  // ── Lost Dataslate ──────────────────────────────────────────────────────────
  {
    id: "ld-stasis-grenade",
    name: "Belecane-Pattern Stasis Grenade",
    source: SkillSource.LD,
    type: "Grenade",
    specialRules: "Exotic, Indirect, Stasis (2 m radius, 1d5 Rounds)",
    weight: "0.5 kg",
    value: "8,000 Thrones",
    rarity: "Very Rare",
    description:
      "Produced in very small quantities on the Calixian forge world of Belecane, " +
      "this grenade traps everything within 2 metres in a bubble of slowed time for 1d5 Rounds. " +
      "Targets cannot take any Actions; those outside cannot attack or interact with anyone inside the field. " +
      "Counts as an Exotic Weapon — the appropriate Exotic Weapon Training Talent is required to use it effectively.",
  },
  {
    id: "ld-stasis-mine",
    name: "Belecane-Pattern Stasis Mine",
    source: SkillSource.LD,
    type: "Mine",
    specialRules: "Exotic, Blast (6), Stasis (6 m radius, 3d10 minutes)",
    weight: "20 kg",
    value: "19,000 Thrones",
    rarity: "Very Rare",
    description:
      "A large rechargeable stasis device. Can be set to detect creatures of a specified Size category " +
      "within 5 metres, activating automatically when triggered. Everything within 6 metres is trapped in stasis " +
      "for 3d10 minutes; those outside cannot attack or interact with anyone within the field. " +
      "Good-Craftsmanship versions include a remote detonator to activate/deactivate the field at will. " +
      "Once used, recharge with a Difficult (–10) Tech-Use Test; 3+ Degrees of Failure burns out the generator permanently. " +
      "Counts as an Exotic Weapon — the appropriate Exotic Weapon Training Talent is required to use it effectively.",
  },

];
