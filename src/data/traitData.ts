// src/data/traitData.ts

import { SkillSource } from "../types/SkillSource";

export interface TraitData {
  id: string;
  name: string;
  source: SkillSource;
  hasSpecialisation: boolean;
  specialisationLabel?: string;
  specialisationOptions?: readonly string[];
  /** Present on numeric specialisations — signals integer-only input and sets the lower bound. */
  specialisationMin?: number;
  /** Present on numeric specialisations with a defined upper bound. */
  specialisationMax?: number;
  prerequisites?: string;
  description?: string;
  repeatable?: boolean;
}

export const TRAIT_LIST: readonly TraitData[] = [

  // ─── Core Rulebook — Creature Traits ────────────────────────────────────────
  { id: "amorphous",                name: "Amorphous",                source: SkillSource.CR, hasSpecialisation: false },
  { id: "armour-plating",           name: "Armour Plating",           source: SkillSource.CR, hasSpecialisation: false },
  { id: "auto-stabilised",          name: "Auto-stabilised",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "bestial",                  name: "Bestial",                  source: SkillSource.CR, hasSpecialisation: false },
  { id: "blind",                    name: "Blind",                    source: SkillSource.CR, hasSpecialisation: false },
  { id: "brutal-charge",            name: "Brutal Charge",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "burrower",                 name: "Burrower",                 source: SkillSource.CR, hasSpecialisation: false },
  { id: "crawler",                  name: "Crawler",                  source: SkillSource.CR, hasSpecialisation: false },
  { id: "daemonic",                 name: "Daemonic",                 source: SkillSource.CR, hasSpecialisation: false },
  { id: "dark-sight",               name: "Dark Sight",               source: SkillSource.CR, hasSpecialisation: false },
  { id: "fear",                     name: "Fear",                     source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Rating (1–4)", specialisationMin: 1, specialisationMax: 4 },
  { id: "flyer",                    name: "Flyer",                    source: SkillSource.CR, hasSpecialisation: false },
  { id: "from-beyond",              name: "From Beyond",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "hoverer",                  name: "Hoverer",                  source: SkillSource.CR, hasSpecialisation: false },
  { id: "incorporeal",              name: "Incorporeal",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "machine",                  name: "Machine",                  source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Armour Value", specialisationMin: 1 },
  { id: "multiple-arms",            name: "Multiple Arms",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "natural-armour",           name: "Natural Armour",           source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Armour Value", specialisationMin: 1 },
  { id: "natural-weapons",          name: "Natural Weapons",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "phase",                    name: "Phase",                    source: SkillSource.CR, hasSpecialisation: false },
  { id: "possession",               name: "Possession",               source: SkillSource.CR, hasSpecialisation: false },
  { id: "quadruped",                name: "Quadruped",                source: SkillSource.CR, hasSpecialisation: false },
  { id: "regeneration",             name: "Regeneration",             source: SkillSource.CR, hasSpecialisation: false },
  { id: "size",                     name: "Size",                     source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Category" },
  { id: "sonar-sense",              name: "Sonar Sense",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "soul-bound",               name: "Soul-bound",               source: SkillSource.CR, hasSpecialisation: false },
  { id: "stampede",                 name: "Stampede",                 source: SkillSource.CR, hasSpecialisation: false },
  { id: "strange-physiology",       name: "Strange Physiology",       source: SkillSource.CR, hasSpecialisation: false },
  { id: "stuff-of-nightmares",      name: "Stuff of Nightmares",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "sturdy",                   name: "Sturdy",                   source: SkillSource.CR, hasSpecialisation: false },
  { id: "toxic",                    name: "Toxic",                    source: SkillSource.CR, hasSpecialisation: false },
  { id: "unnatural-characteristic", name: "Unnatural Characteristic", source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Characteristic", specialisationOptions: ["Weapon Skill", "Ballistic Skill", "Strength", "Toughness", "Agility", "Intelligence", "Perception", "Willpower", "Fellowship"], repeatable: true },
  { id: "unnatural-senses",         name: "Unnatural Senses",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "unnatural-speed",          name: "Unnatural Speed",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "warp-instability",         name: "Warp Instability",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "warp-weapon",              name: "Warp Weapon",              source: SkillSource.CR, hasSpecialisation: false },
  // ─── Creatures Anathema ──────────────────────────────────────────────────────
  { id: "improved-natural-weapons", name: "Improved Natural Weapons", source: SkillSource.CA, hasSpecialisation: false },

  // ─── Career Traits (purchasable) ────────────────────────────────────────────
  { id: "mechanicus-implants",      name: "Mechanicus Implants",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "sanctioned-psyker",        name: "Sanctioned Psyker",        source: SkillSource.CR, hasSpecialisation: false },

  // ─── Disciples of the Dark Gods ─────────────────────────────────────────────
  { id: "dotdg-untouchable",         name: "Untouchable",              source: SkillSource.DotDG, hasSpecialisation: false },
  { id: "dotdg-cryptos-possession",  name: "Cryptos Possession",       source: SkillSource.DotDG, hasSpecialisation: false },

  // ─── Haarlock's Legacy III ──────────────────────────────────────────────────
  { id: "shadow-shrouded",          name: "Shadow Shrouded",          source: SkillSource.H3,  hasSpecialisation: false },

  // ─── Lathe Worlds ────────────────────────────────────────────────────────────
  { id: "rigor-mentis",             name: "Rigor Mentis",             source: SkillSource.LW, hasSpecialisation: false },
  { id: "outside-looking-in",       name: "Outside Looking In",       source: SkillSource.LW, hasSpecialisation: false },
  { id: "heart-of-steel",           name: "Heart of Steel",           source: SkillSource.LW, hasSpecialisation: false },
  { id: "skin-of-iron",             name: "Skin of Iron",             source: SkillSource.LW, hasSpecialisation: false },
  { id: "excommunicate-mechanicum", name: "Excommunicate Mechanicum", source: SkillSource.LW, hasSpecialisation: false },
  { id: "fabricated-flesh",         name: "Fabricated Flesh",         source: SkillSource.LW, hasSpecialisation: false, prerequisites: "Tech-Priest" },
  { id: "genetic-pantropy",         name: "Genetic Pantropy",         source: SkillSource.LW, hasSpecialisation: false },
  { id: "labourer-build",           name: "Labourer Build",           source: SkillSource.LW, hasSpecialisation: false },

  // ─── Book of Judgement ─────────────────────────────────────────────────────
  { id: "blank-slate",              name: "Blank Slate",              source: SkillSource.BoJ, hasSpecialisation: false },
];

export type TraitId = (typeof TRAIT_LIST)[number]["id"];
