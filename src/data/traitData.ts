// src/data/traitData.ts

import { SkillSource } from "../types/SkillSource";

export interface TraitData {
  id: string;
  name: string;
  source: SkillSource;
  hasSpecialisation: boolean;
  specialisationLabel?: string;
  specialisationOptions?: readonly (string | { value: string; label: string })[];
  /** Allows the same fixed specialisation to be acquired more than once. */
  repeatableSpecialisation?: boolean;
  specialisationPlaceholder?: string;
  hideSpecialisationHelp?: boolean;
  positiveIntegerInput?: boolean;
  /** Present on numeric specialisations — signals integer-only input and sets the lower bound. */
  specialisationMin?: number;
  /** Present on numeric specialisations with a defined upper bound. */
  specialisationMax?: number;
  prerequisites?: string;
  description?: string;
  repeatable?: boolean;
  maxPurchases?: number;
  acquisition?: "soul-bound" | "blank-slate" | "sanctioned-psyker" | "skin-of-iron";
}

export const TRAIT_LIST: readonly TraitData[] = [
  // ─── Core Rulebook — Creature Traits ────────────────────────────────────────
  { id: "amorphous", name: "Amorphous", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "armour-plating",
    name: "Armour Plating",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  {
    id: "auto-stabilised",
    name: "Auto-stabilised",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  { id: "bestial", name: "Bestial", source: SkillSource.CR, hasSpecialisation: false },
  { id: "blind", name: "Blind", source: SkillSource.CR, hasSpecialisation: false },
  { id: "brutal-charge", name: "Brutal Charge", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "burrower", name: "Burrower", source: SkillSource.CR, hasSpecialisation: true,
    specialisationLabel: "Speed", specialisationPlaceholder: "1+",
    hideSpecialisationHelp: true, positiveIntegerInput: true, specialisationMin: 1,
  },
  { id: "crawler", name: "Crawler", source: SkillSource.CR, hasSpecialisation: false },
  { id: "daemonic", name: "Daemonic", source: SkillSource.CR, hasSpecialisation: false },
  { id: "dark-sight", name: "Dark Sight", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "fear",
    name: "Fear",
    source: SkillSource.CR,
    hasSpecialisation: true,
    specialisationLabel: "Fear Rating",
    specialisationOptions: [
      { value: "1", label: "1 — Disturbing (0)" },
      { value: "2", label: "2 — Frightening (−10)" },
      { value: "3", label: "3 — Horrifying (−20)" },
      { value: "4", label: "4 — Terrifying (−30)" },
    ],
  },
  {
    id: "flyer", name: "Flyer", source: SkillSource.CR, hasSpecialisation: true,
    specialisationLabel: "Speed", specialisationPlaceholder: "1+",
    hideSpecialisationHelp: true, positiveIntegerInput: true, specialisationMin: 1,
  },
  { id: "from-beyond", name: "From Beyond", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "hoverer", name: "Hoverer", source: SkillSource.CR, hasSpecialisation: true,
    specialisationLabel: "Speed", specialisationPlaceholder: "1+",
    hideSpecialisationHelp: true, positiveIntegerInput: true, specialisationMin: 1,
  },
  { id: "incorporeal", name: "Incorporeal", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "machine",
    name: "Machine",
    source: SkillSource.CR,
    hasSpecialisation: true,
    specialisationLabel: "Armour Points",
    specialisationPlaceholder: "1–5",
    positiveIntegerInput: true,
    specialisationMin: 1,
    specialisationMax: 5,
  },
  { id: "multiple-arms", name: "Multiple Arms", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "natural-armour",
    name: "Natural Armour",
    source: SkillSource.CR,
    hasSpecialisation: true,
    specialisationLabel: "Armour Points",
    specialisationPlaceholder: "1+",
    hideSpecialisationHelp: true,
    positiveIntegerInput: true,
    specialisationMin: 1,
  },
  {
    id: "natural-weapons",
    name: "Natural Weapons",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  { id: "phase", name: "Phase", source: SkillSource.CR, hasSpecialisation: false },
  { id: "possession", name: "Possession", source: SkillSource.CR, hasSpecialisation: false },
  { id: "quadruped", name: "Quadruped", source: SkillSource.CR, hasSpecialisation: false },
  { id: "regeneration", name: "Regeneration", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "size",
    name: "Size",
    source: SkillSource.CR,
    hasSpecialisation: true,
    specialisationLabel: "Size Category",
    specialisationOptions: [
      "Minuscule",
      "Puny",
      "Scrawny",
      "Average",
      "Hulking",
      "Enormous",
      "Massive",
    ],
  },
  { id: "sonar-sense", name: "Sonar Sense", source: SkillSource.CR, hasSpecialisation: false },
  { id: "soul-bound", name: "Soul-bound", source: SkillSource.CR, hasSpecialisation: false, acquisition: "soul-bound" },
  { id: "stampede", name: "Stampede", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "strange-physiology",
    name: "Strange Physiology",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  {
    id: "stuff-of-nightmares",
    name: "Stuff of Nightmares",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  { id: "sturdy", name: "Sturdy", source: SkillSource.CR, hasSpecialisation: false },
  { id: "toxic", name: "Toxic", source: SkillSource.CR, hasSpecialisation: false },
  {
    id: "unnatural-characteristic",
    name: "Unnatural Characteristic",
    source: SkillSource.CR,
    hasSpecialisation: true,
    specialisationLabel: "Characteristic",
    specialisationOptions: [
      "Weapon Skill",
      "Ballistic Skill",
      "Strength",
      "Toughness",
      "Agility",
      "Intelligence",
      "Perception",
      "Willpower",
      "Fellowship",
    ],
    repeatable: true,
    repeatableSpecialisation: true,
  },
  {
    id: "unnatural-senses",
    name: "Unnatural Senses",
    source: SkillSource.CR,
    hasSpecialisation: true,
    specialisationLabel: "Range (metres)",
    specialisationPlaceholder: "15+",
    hideSpecialisationHelp: true,
    positiveIntegerInput: true,
    specialisationMin: 1,
  },
  {
    id: "unnatural-speed",
    name: "Unnatural Speed",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  {
    id: "warp-instability",
    name: "Warp Instability",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  { id: "warp-weapon", name: "Warp Weapon", source: SkillSource.CR, hasSpecialisation: false },
  // ─── Creatures Anathema ──────────────────────────────────────────────────────
  {
    id: "improved-natural-weapons",
    name: "Improved Natural Weapons",
    source: SkillSource.CA,
    hasSpecialisation: false,
  },

  // ─── Career Traits (purchasable) ────────────────────────────────────────────
  {
    id: "mechanicus-implants",
    name: "Mechanicus Implants",
    source: SkillSource.CR,
    hasSpecialisation: false,
  },
  {
    id: "sanctioned-psyker",
    name: "Sanctioned Psyker",
    source: SkillSource.CR,
    hasSpecialisation: false,
    acquisition: "sanctioned-psyker",
  },

  // ─── Disciples of the Dark Gods ─────────────────────────────────────────────
  {
    id: "dotdg-untouchable",
    name: "Untouchable",
    source: SkillSource.DotDG,
    hasSpecialisation: false,
  },
  {
    id: "dotdg-cryptos-possession",
    name: "Cryptos Possession",
    source: SkillSource.DotDG,
    hasSpecialisation: false,
  },

  // ─── Haarlock's Legacy III ──────────────────────────────────────────────────
  {
    id: "shadow-shrouded",
    name: "Shadow Shrouded",
    source: SkillSource.H3,
    hasSpecialisation: false,
  },

  // ─── Lathe Worlds ────────────────────────────────────────────────────────────
  { id: "rigor-mentis", name: "Rigor Mentis", source: SkillSource.LW, hasSpecialisation: false },
  {
    id: "outside-looking-in",
    name: "Outside Looking In",
    source: SkillSource.LW,
    hasSpecialisation: false,
  },
  {
    id: "heart-of-steel",
    name: "Heart of Steel",
    source: SkillSource.LW,
    hasSpecialisation: false,
  },
  {
    id: "skin-of-iron",
    name: "Skin of Iron",
    source: SkillSource.LW,
    hasSpecialisation: false,
    repeatable: true,
    maxPurchases: 4,
    acquisition: "skin-of-iron",
  },
  {
    id: "excommunicate-mechanicum",
    name: "Excommunicate Mechanicum",
    source: SkillSource.LW,
    hasSpecialisation: false,
  },
  {
    id: "fabricated-flesh",
    name: "Fabricated Flesh",
    source: SkillSource.LW,
    hasSpecialisation: false,
    prerequisites: "Tech-Priest",
  },
  {
    id: "genetic-pantropy",
    name: "Genetic Pantropy",
    source: SkillSource.LW,
    hasSpecialisation: false,
  },
  {
    id: "labourer-build",
    name: "Labourer Build",
    source: SkillSource.LW,
    hasSpecialisation: false,
  },

  // ─── Core Rulebook — Homeworld Traits ──────────────────────────────────────
  { id: "homeworld-iron-stomach", name: "Iron Stomach", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-primitive", name: "Primitive", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-rite-of-passage", name: "Rite of Passage", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-wilderness-savvy", name: "Wilderness Savvy", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-accustomed-to-crowds", name: "Accustomed to Crowds", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-caves-of-steel", name: "Caves of Steel", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-hivebound", name: "Hivebound", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-wary", name: "Wary", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-blessed-ignorance", name: "Blessed Ignorance", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-hagiography", name: "Hagiography", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-liturgical-familiarity", name: "Liturgical Familiarity", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-superior-origins", name: "Superior Origins", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-charmed", name: "Charmed", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-ill-omened", name: "Ill-Omened", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-shipwise", name: "Shipwise", source: SkillSource.CR, hasSpecialisation: false },
  { id: "homeworld-void-accustomed", name: "Void Accustomed", source: SkillSource.CR, hasSpecialisation: false },

  // ─── Inquisitor's Handbook — Homeworld Traits ──────────────────────────────
  { id: "homeworld-fit-for-purpose", name: "Fit For Purpose", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-stranger-to-the-cult", name: "Stranger to the Cult", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-credo-omnissiah", name: "Credo Omnissiah", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-schola-education", name: "Schola Education", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-skill-at-arms", name: "Skill at Arms", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-sheltered-upbringing", name: "Sheltered Upbringing", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-tempered-will", name: "Tempered Will", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-etiquette", name: "Etiquette", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-supremely-connected", name: "Supremely Connected", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-vendetta", name: "Vendetta", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-engram-implantation", name: "Engram Implantation", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-failsafe-control", name: "Failsafe Control", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-imperial-conditioning", name: "Imperial Conditioning", source: SkillSource.IH, hasSpecialisation: false },
  { id: "homeworld-through-a-mirror-darkly", name: "Through a Mirror Darkly", source: SkillSource.IH, hasSpecialisation: false },

  // ─── Book of Judgement ─────────────────────────────────────────────────────
  { id: "blank-slate", name: "Blank Slate", source: SkillSource.BoJ, hasSpecialisation: false, acquisition: "blank-slate" },
];

export type TraitId = (typeof TRAIT_LIST)[number]["id"];
