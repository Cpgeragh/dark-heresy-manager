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
    id: "ld-stasis-grenade",
    name: "Belecane-Pattern Stasis Grenade",
    source: SkillSource.LD,
    type: "Grenade",
    specialRules: "Indirect",
    weight: "0.5 kg",
    value: "8,000 Thrones",
    rarity: "Very Rare",
    description:
      "Produced in very small quantities on the Calixian forge world of Belecane. Stasis grenades trap " +
      "or preserve those caught in the blast within a bubble of slowed time. They have a radius of 2 metres, " +
      "and anything within this radius is held in time, unable to take any Actions for 1d5 Rounds. Those " +
      "outside cannot attack or interact with anyone within the stasis field's radius. Stasis grenades are " +
      "considered Exotic Weapons, and a character must have the appropriate Talent before using them effectively.",
  },

  {
    id: "ld-stasis-mine",
    name: "Belecane-Pattern Stasis Mine",
    source: SkillSource.LD,
    type: "Mine",
    specialRules: "Blast (6)",
    weight: "20 kg",
    value: "19,000 Thrones",
    rarity: "Very Rare",
    description:
      "A larger Belecane stasis device with a variable detection radius of up to 5 metres, which can be " +
      "set to detect creatures of a specific Size. Once triggered, everything within its 6 metre radius is " +
      "trapped and unable to take any Actions for 3d10 minutes. Those outside cannot attack or interact with " +
      "anyone within the field. Good-Craftsmanship versions include a remote detonator. Once used, it can be " +
      "recharged with a Difficult (-10) Tech-Use Test; three or more Degrees of Failure burns out the field " +
      "generator and renders the mine useless. Stasis mines are considered Exotic Weapons and require the " +
      "appropriate Talent to use effectively.",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────

  {
    id: "lw-holo-clone",
    name: "Holo-Clone",
    source: SkillSource.LW,
    type: "Device",
    weight: "0.5 kg",
    value: "—",
    rarity: "—",
    description:
      "Creates a duplicate holographic image of the user, fooling attackers into thinking the user " +
      "is in two places at once. While active, grants +30 to all Dodge and Parry Tests. An attacker " +
      "who passes a Very Hard (–30) Perception Test as a Half Action can identify the hologram, " +
      "negating this bonus for that Round. Has enough power for 1d10+6 minutes; takes 1d5 hours to " +
      "recharge. Small enough to clip to a belt or wear around the neck.",
  },

  {
    id: "lw-vision-cowl",
    name: "Lucius-Pattern Vision Cowl",
    source: SkillSource.LW,
    type: "Device",
    weight: "3 kg",
    value: "—",
    rarity: "—",
    description:
      "A hyper-advanced auspex worn as a hood, with data-displays over each eye and an augmented " +
      "reality interface. Half Action to activate. Once active: see any living creature within 50m " +
      "even through walls; ascertain vital signs (Wounds, Critical Damage, Fatigue) with an " +
      "Ordinary (+10) Medicae Test; locate structural weak points with an Ordinary (+10) Evaluate " +
      "Test; track chemicals and radiation trails and isolate vox-transmissions within 5km with an " +
      "Ordinary (+10) Tech-Use Test. Imposes –10 to all WS and BS Tests; limits normal vision to " +
      "50m. Cannot be worn over or under a helmet.",
  },

  {
    id: "lw-midath-power-glove",
    name: "Midath-Pattern Power Glove",
    source: SkillSource.LW,
    type: "Weapon",
    weight: "1 kg",
    value: "—",
    rarity: "—",
    specialRules: "Special, Power Field",
    description:
      "Melee — 2d10 E, Pen 7, Power Field. A single sheath of unknown golden material extending " +
      "to the shoulder. Functions like a low-powered power fist and can parry effectively due to " +
      "the power field surrounding the full arm. Imposes –10 to WS Tests when attacking but grants " +
      "+10 to Parry Tests. Each Round the glove remains active, the user must pass an Ordinary " +
      "(+10) Toughness Test or suffer 1d10 Toxic damage that ignores Armour and Toughness Bonus. " +
      "Requires Exotic Weapon Training to use.",
  },

  {
    id: "lw-psybernetics",
    name: "Psybernetics",
    source: SkillSource.LW,
    type: "Implant",
    weight: "—",
    value: "—",
    rarity: "—",
    description:
      "Heretical cybernetic implants installed in the head following standard cybernetic implantation " +
      "rules. On implantation the user gains 2d10 Insanity and 1d10 Corruption Points. If they " +
      "survive, they gain a Psy Rating equal to half their Willpower Bonus (round up) and one " +
      "randomly generated Minor Psychic Power per point of Psy Rating. New Minor Powers are gained " +
      "as Psy Rating increases; Discipline Powers cannot be taken. Possession is extremely heretical " +
      "and unauthorised use is highly dangerous.",
  },

  {
    id: "lw-reclamator-rifle",
    name: "Reclamator Rifle",
    source: SkillSource.LW,
    type: "Weapon",
    weight: "8 kg",
    value: "—",
    rarity: "—",
    specialRules: "Special, Shocking, Toxic",
    description:
      "Basic — 35m, S/–/–, 3d10 R, Pen —, Clip 18. Completely ignores Armour and has no effect " +
      "on technological items. Targets killed by this weapon leave all non-living items (weapons, " +
      "armour, cybernetics) completely intact and undamaged. Requires 6 hours and a power source " +
      "to recharge. In areas of high or low gravity, also gains the Inaccurate, Overheats, and " +
      "Unreliable qualities. Requires Exotic Weapon Training to use.",
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
