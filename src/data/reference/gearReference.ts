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
      "A string of adamantium beads worn around the neck or waist as a reminder of acts " +
      "of penitence. When openly displayed, the bearer may re-roll any failed Charm Tests " +
      "made against members of the Ecclesiarchy of equal or lower status (GM's discretion).",
    weight: "—",
    value: "10 Thrones",
    rarity: "Average",
  },
  {
    id: "cilice",
    name: "Cilice",
    source: SkillSource.BoM,
    description:
      "Garments designed to cause discomfort as a form of corporal mortification — rough " +
      "shirts, chains of heavy links, or garters of metal links with small hooks. Worn as " +
      "an act of penance, not pride. Characters who wear a cilice for an extended period " +
      "(usually twice their Toughness Bonus in hours) must make a Toughness Test or suffer " +
      "1 level of Fatigue.",
    weight: "—",
    value: "5 Thrones",
    rarity: "Common",
  },
  {
    id: "dialogous-staff",
    name: "Dialogous Staff",
    source: SkillSource.BoM,
    description:
      "Carried by Sisters of the Ordo Dialogous. Fitted with a Laud Hailer and an audio " +
      "recording device. Sturdy enough to use in combat as a Staff. Grants +10 to " +
      "understand sounds at a distance.",
    weight: "3kg",
    value: "200 Thrones",
    rarity: "Rare",
  },
  {
    id: "eikon",
    name: "Eikon",
    source: SkillSource.BoM,
    description:
      "A portrait of the Emperor or a Saint, ranging from small cameos with locking " +
      "covers to large triptychs meant to be displayed on tabletops or altars. Sold in " +
      "great numbers throughout the Sector; common among native militia who often attach " +
      "them to their weapons and vehicles.",
    weight: "0.5kg",
    value: "10 Thrones",
    rarity: "Common",
  },
  {
    id: "hospitaller-medicae-tools",
    name: "Hospitaller Medicae Tools",
    source: SkillSource.BoM,
    description:
      "Superior battlefield medical tools found outside the Apothecaries of the Adeptus " +
      "Astartes. Contains sacred oils, unguents, surgical tools, sterilisers, 2 doses of " +
      "De-tox, and 2 doses of Stimm. A Hospitaller may also amputate a damaged limb (Hard " +
      "(–10) Medicae Test); if successful, the patient is missing the limb but all other " +
      "critical effects caused by damage to that limb are removed.",
    weight: "3kg",
    value: "250 Thrones",
    rarity: "Rare",
  },
  {
    id: "liber-heresius",
    name: "Liber Heresius",
    source: SkillSource.BoM,
    description:
      "The definitive guide to heresy for Witch Hunters. Details the structure, activities, " +
      "and natures of many infernal heretical cults, as well as how they were detected and " +
      "destroyed. Provides +20 to Research Tests involving Forbidden Lore (Cults, Heresy). " +
      "Issued only to proven Witch Hunters.",
    weight: "1kg",
    value: "150 Thrones",
    rarity: "Rare",
  },
  {
    id: "litanies-of-faith",
    name: "Litanies of Faith",
    source: SkillSource.BoM,
    description:
      "Books of the Ecclesiarchy's teachings, chants, and hymnals. A complete copy " +
      "provides +20 on Research Tests involving Common Lore (Ecclesiarchy) and Scholastic " +
      "Lore (Imperial Creed). Abridged versions (concentrating primarily on prayers) " +
      "provide only a +10 bonus.",
    weight: "0.5kg",
    value: "10 Thrones",
    rarity: "Common",
  },
  {
    id: "pilgrims-travel-staff",
    name: "Pilgrim's Travel Staff",
    source: SkillSource.BoM,
    description:
      "A walking staff formed from polymers on Forge Worlds or wood on Feral Worlds, " +
      "adorned with a small vox-caster containing chants, prayers, and songs dedicated to " +
      "the God-Emperor. The staff head typically carries a badge of the pilgrim's intended " +
      "shrine. Can be used as a weapon (treat as a Staff).",
    weight: "2kg",
    value: "15 Thrones",
    rarity: "Common",
  },
  {
    id: "psyocculum",
    name: "Psyocculum",
    source: SkillSource.BoM,
    description:
      "A form of photo-visor designed to enhance the wearer's ability to detect psykers. " +
      "The user gains the Psyniscience Skill with a +20 bonus. Using the psyocculum " +
      "requires a Full Action.",
    weight: "0.5kg",
    value: "300 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "questing-pilgrim-badge",
    name: "Questing Pilgrim Badge",
    source: SkillSource.BoM,
    description:
      "Visual representations of a person or event, manufactured in great numbers on Shrine " +
      "Worlds. Common badges are simple mass-produced emblems; elaborate versions can be " +
      "ordered by the wealthy. The best badges have small glass vials built in containing " +
      "blessed water, sacred oils, planetary dust, or similar materials.",
    weight: "—",
    value: "5 Thrones",
    rarity: "Common",
  },
  {
    id: "reliquary",
    name: "Reliquary",
    source: SkillSource.BoM,
    description:
      "Boxes, caskets, and cases used to contain relics (authentic or not), charms, or " +
      "holographic images of actual relics. The most common are cheaply made containing " +
      "only a holo, model, or painting. A reliquary designed to hold an authenticated holy " +
      "relic can easily cost thousands of Thrones.",
    weight: "1kg",
    value: "30 Thrones",
    rarity: "Average",
  },
  {
    id: "ring-of-suffrage",
    name: "Ring of Suffrage",
    source: SkillSource.BoM,
    description:
      "Designed to cause minor discomfort when twisted. Treated as a charm.",
    weight: "—",
    value: "5 Thrones",
    rarity: "Common",
  },
  {
    id: "rule-of-sororitas",
    name: "Rule of Sororitas",
    source: SkillSource.BoM,
    description:
      "A collection of treatises, litanies, and assorted holy directives. Provides +10 " +
      "bonus to all Common Lore Tests on the subject of Ecclesiarchy, Heretics, Mutants, " +
      "or the Adepta Sororitas.",
    weight: "0.5kg",
    value: "50 Thrones",
    rarity: "Rare",
  },
  {
    id: "sarissa",
    name: "Sarissa",
    source: SkillSource.BoM,
    description:
      "Heavy spiked blades attached to bolters to allow close-combat engagement without " +
      "switching weapons. When mounted on a bolter, a sarissa counts as an axe in close " +
      "combat.",
    weight: "2kg",
    value: "30 Thrones",
    rarity: "Scarce",
  },
  {
    id: "seraphim-jump-pack",
    name: "Seraphim Jump Pack",
    source: SkillSource.BoM,
    description:
      "Requires Pilot (Jump Pack) skill and Sororitas Power Armour. Uses the same " +
      "technology as Space Marine jump packs and gives the Adepta Sororitas the appearance " +
      "of avenging angels. The bearer can jump from any height without injury and make any " +
      "number of short jumps. At maximal thrust, duplicates the Flyer (12) trait for a " +
      "number of turns up to the character's Agility Bonus.",
    weight: "20kg",
    value: "3,000 Thrones",
    rarity: "Extremely Rare",
  },
  {
    id: "simulacrum-imperialis",
    name: "Simulacrum Imperialis",
    source: SkillSource.BoM,
    description:
      "Holy symbols of the Ecclesiarchy once borne by a Saint or fashioned from a Saint's " +
      "bones. Carried at the forefront of Adepta Sororitas battle groups. Whenever a " +
      "character within 20 metres spends a Fate Point, they immediately recover it on a " +
      "dice roll of 8, 9, or 10. Characters with more than 20 Corruption Points cannot " +
      "benefit from this effect.",
    weight: "3kg",
    value: "5,000 Thrones",
    rarity: "Extremely Rare",
  },
  {
    id: "witch-cage",
    name: "Witch Cage",
    source: SkillSource.BoM,
    description:
      "An ancient iron box placed over a psyker's head, restricting both vision and " +
      "hearing. Runes inscribed within prevent effective psychic use. A psyker wearing a " +
      "Witch Cage deducts 4 from their effective Psy Rating, takes –40 to all Invocation " +
      "Tests, and is considered Blind and Deaf.",
    weight: "2kg",
    value: "100 Thrones",
    rarity: "Rare",
  },

];
