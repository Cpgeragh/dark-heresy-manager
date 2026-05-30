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
    id: "ld-cameleoline-grid",
    name: "Cameleoline Grid",
    source: SkillSource.LD,
    type: "Device",
    weight: "Varies",
    value: "—",
    rarity: "—",
    description:
      "A series of flexible interlocking screens held up by tungsten rods up to six metres high. " +
      "No two grids are alike, varying in size from several metres to several hundred metres across. " +
      "When an electrical current is run across the screens they almost instantaneously change colour " +
      "to match their surroundings, hiding everything underneath. Any power source supplying a steady " +
      "electrical current will activate the grid. Those beneath it gain +50 to Concealment Tests. " +
      "The grid itself provides no cover and individual panels (usually ~2m across) cannot be repaired if damaged.",
  },

  {
    id: "ld-voidbane-generator",
    name: "Voidbane Generator",
    source: SkillSource.LD,
    type: "Device",
    weight: "20 kg",
    value: "—",
    rarity: "—",
    description:
      "Officially: the Hades-Pattern Rotating Gravimetric Harmonic Disruption Device. Uses gravimetric and " +
      "soundwave transmissions to disrupt and eventually overload a voidship's Gellar Field, spilling raw Warp " +
      "into the craft. Can be activated to trigger the moment a voidship enters the Warp; takes roughly an hour " +
      "to reach full power. Larger ships are more likely to detect the disruption in time. Once active, the " +
      "generator must be physically destroyed before the Gellar Field collapses entirely. Tracking it down " +
      "requires an auspex and a Very Hard (–30) Tech-Use Test every five minutes as it constantly switches " +
      "frequencies. Only the Inquisition may authorise its use.",
  },

];
