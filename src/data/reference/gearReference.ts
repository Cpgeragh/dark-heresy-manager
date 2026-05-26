// src/data/reference/gearReference.ts
// Reference data for gear and equipment items, organised by source book.
// Feeds into the reference-lookup UI on the Gear tab.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GearRef {
  id: string;
  name: string;
  source: SkillSource;
  description: string;
  weight: string;
  value: string;
  rarity: string;
}

// ─── Gear Reference ──────────────────────────────────────────────────────────

export const GEAR_REFERENCE: GearRef[] = [

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "chaplet-ecclesiasticus",
    name: "Chaplet Ecclesiasticus",
    source: SkillSource.BoM,
    description:
      "When openly displayed, the bearer may re-roll any failed Charm Tests " +
      "made against members of the Ecclesiarchy of equal or lower status (GM's discretion).",
    weight: "1 kg",
    value: "1,000 Thrones",
    rarity: "Issued Only",
  },
  {
    id: "cilice",
    name: "Cilice",
    source: SkillSource.BoM,
    description:
      "+10 on Tests to resist Intimidation and other kinds of social manipulation. " +
      "Characters who wear a cilice for longer than twice their Toughness Bonus in hours " +
      "must make a Toughness Test or suffer 1 Level of Fatigue.",
    weight: "Varies",
    value: "Varies",
    rarity: "Rare",
  },
  {
    id: "dialogous-staff",
    name: "Dialogous Staff",
    source: SkillSource.BoM,
    description:
      "Fitted with a Laud Hailer and an audio recording device. " +
      "Sturdy enough to use in combat as a Staff. Grants +10 to understand sounds at a distance.",
    weight: "4 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "eikon",
    name: "Eikon",
    source: SkillSource.BoM,
    description:
      "No specific game effect.",
    weight: "—",
    value: "Varies",
    rarity: "Common",
  },
  {
    id: "hospitaller-medicae-tools",
    name: "Hospitaller Medicae Tools",
    source: SkillSource.BoM,
    description:
      "Contains sacred oils, unguents, surgical tools, sterilisers, 2 doses of De-tox, " +
      "and 2 doses of Stimm. The Sister Hospitaller may amputate a damaged limb with a " +
      "Hard (–10) Medicae Test. If successful, the patient loses the limb but all other " +
      "Critical Effects caused by damage to that limb are removed (including Fatigue and Blood Loss).",
    weight: "10 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "liber-heresius",
    name: "Liber Heresius",
    source: SkillSource.BoM,
    description:
      "+20 on Research Tests involving Forbidden Lore (Cults, Heresy). " +
      "Issued only to proven Witch Hunters.",
    weight: "10 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "litanies-of-faith",
    name: "Litanies of Faith",
    source: SkillSource.BoM,
    description:
      "A complete copy provides +20 on Research Tests involving Common Lore (Ecclesiarchy) " +
      "and Scholastic Lore (Imperial Creed). " +
      "Abridged versions (concentrating primarily on prayers) provide only +10.",
    weight: "10 kg",
    value: "500 Thrones",
    rarity: "Uncommon",
  },
  {
    id: "pilgrims-travel-staff",
    name: "Pilgrim's Travel Staff",
    source: SkillSource.BoM,
    description:
      "Can be used as a Staff in combat.",
    weight: "3 kg",
    value: "15 Thrones",
    rarity: "Common",
  },
  {
    id: "psyocculum",
    name: "Psyocculum",
    source: SkillSource.BoM,
    description:
      "Grants the Psyniscience Skill with a +20 bonus. " +
      "Can only detect psykers. Using the psyocculum requires a Full Action.",
    weight: "2 kg",
    value: "3,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "questing-pilgrim-badge",
    name: "Questing Pilgrim Badge",
    source: SkillSource.BoM,
    description:
      "No specific game effect.",
    weight: "—",
    value: "Varies",
    rarity: "Common",
  },
  {
    id: "reliquary",
    name: "Reliquary",
    source: SkillSource.BoM,
    description:
      "No specific game effect. Used to contain relics, charms, or holographic images of actual relics.",
    weight: "1 kg",
    value: "Varies",
    rarity: "Common",
  },
  {
    id: "ring-of-suffrage",
    name: "Ring of Suffrage",
    source: SkillSource.BoM,
    description:
      "Treated as a charm.",
    weight: "0 kg",
    value: "10 Thrones",
    rarity: "Rare",
  },
  {
    id: "rule-of-sororitas",
    name: "Rule of Sororitas",
    source: SkillSource.BoM,
    description:
      "+10 bonus to all Common Lore Tests on the subject of Ecclesiarchy, Heretics, " +
      "Mutants, or the Adepta Sororitas.",
    weight: "5 kg",
    value: "100 Thrones",
    rarity: "Rare",
  },
  {
    id: "sarissa",
    name: "Sarissa (Bolter Attachment)",
    source: SkillSource.BoM,
    description:
      "When mounted on a bolter, a sarissa counts as an axe in close combat.",
    weight: "+2 kg",
    value: "50 Thrones",
    rarity: "Rare",
  },
  {
    id: "sarissa-standalone",
    name: "Sarissa",
    source: SkillSource.BoM,
    description:
      "A long-bladed spear used by Ecclesiarchy warriors.",
    weight: "2 kg",
    value: "200 Thrones",
    rarity: "Rare",
  },
  {
    id: "seraphim-jump-pack",
    name: "Seraphim Jump Pack",
    source: SkillSource.BoM,
    description:
      "Requires Pilot (Jump Pack) skill and Sororitas Power Armour. " +
      "Allows a safe, guided fall from any height and any number of short jumps (Move Action; " +
      "must end by end of Turn). At maximal thrust, duplicates the Flyer (12) trait for a " +
      "number of Turns up to the character's Agility Bonus.",
    weight: "15 kg",
    value: "5,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "simulacrum-imperialis",
    name: "Simulacrum Imperialis",
    source: SkillSource.BoM,
    description:
      "Whenever a character within 20 metres spends a Fate Point, they immediately recover it " +
      "on a dice roll of 8, 9, or 10. Characters with more than 20 Corruption Points cannot " +
      "benefit from this effect.",
    weight: "10 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "witch-cage",
    name: "Witch Cage",
    source: SkillSource.BoM,
    description:
      "A psyker wearing a Witch Cage deducts 4 from their effective Psy Rating, " +
      "takes –40 to all Invocation Tests, and is considered Blind and Deaf.",
    weight: "15 kg",
    value: "4,000 Thrones",
    rarity: "Very Rare",
  },

];
