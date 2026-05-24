// src/data/traitData.ts

import { SkillSource } from "../types/SkillSource";

export interface TraitData {
  id: string;
  name: string;
  source: SkillSource;
  hasSpecialisation: boolean;
  specialisationLabel?: string;
  description?: string;
}

export const TRAIT_LIST: readonly TraitData[] = [

  // ─── Core Rulebook ──────────────────────────────────────────────────────────
  { id: "amorphous",               name: "Amorphous",               source: SkillSource.CR, hasSpecialisation: false },
  { id: "armour-plating",          name: "Armour Plating",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "auto-stabilised",         name: "Auto-stabilised",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "bestial",                 name: "Bestial",                 source: SkillSource.CR, hasSpecialisation: false },
  { id: "blind",                   name: "Blind",                   source: SkillSource.CR, hasSpecialisation: false },
  { id: "brutal-charge",           name: "Brutal Charge",           source: SkillSource.CR, hasSpecialisation: false },
  { id: "burrower",                name: "Burrower",                source: SkillSource.CR, hasSpecialisation: false },
  { id: "crawler",                 name: "Crawler",                 source: SkillSource.CR, hasSpecialisation: false },
  { id: "daemonic",                name: "Daemonic",                source: SkillSource.CR, hasSpecialisation: false },
  { id: "dark-sight",              name: "Dark Sight",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "fear",                    name: "Fear",                    source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Rating (1–4)" },
  { id: "flyer",                   name: "Flyer",                   source: SkillSource.CR, hasSpecialisation: false },
  { id: "from-beyond",             name: "From Beyond",             source: SkillSource.CR, hasSpecialisation: false },
  { id: "hoverer",                 name: "Hoverer",                 source: SkillSource.CR, hasSpecialisation: false },
  { id: "incorporeal",             name: "Incorporeal",             source: SkillSource.CR, hasSpecialisation: false },
  { id: "machine",                 name: "Machine",                 source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Armour Value" },
  { id: "multiple-arms",           name: "Multiple Arms",           source: SkillSource.CR, hasSpecialisation: false },
  { id: "natural-armour",          name: "Natural Armour",          source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Armour Value" },
  { id: "natural-weapons",         name: "Natural Weapons",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "phase",                   name: "Phase",                   source: SkillSource.CR, hasSpecialisation: false },
  { id: "possession",              name: "Possession",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "quadruped",               name: "Quadruped",               source: SkillSource.CR, hasSpecialisation: false },
  { id: "regeneration",            name: "Regeneration",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "size",                    name: "Size",                    source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Category" },
  { id: "sonar-sense",             name: "Sonar Sense",             source: SkillSource.CR, hasSpecialisation: false },
  { id: "soul-bound",              name: "Soul-bound",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "stampede",                name: "Stampede",                source: SkillSource.CR, hasSpecialisation: false },
  { id: "strange-physiology",      name: "Strange Physiology",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "stuff-of-nightmares",     name: "Stuff of Nightmares",     source: SkillSource.CR, hasSpecialisation: false },
  { id: "sturdy",                  name: "Sturdy",                  source: SkillSource.CR, hasSpecialisation: false },
  { id: "toxic",                   name: "Toxic",                   source: SkillSource.CR, hasSpecialisation: false },
  { id: "unnatural-characteristic",name: "Unnatural Characteristic",source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Characteristic" },
  { id: "unnatural-senses",        name: "Unnatural Senses",        source: SkillSource.CR, hasSpecialisation: false },
  { id: "unnatural-speed",         name: "Unnatural Speed",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "warp-instability",        name: "Warp Instability",        source: SkillSource.CR, hasSpecialisation: false },
  { id: "warp-weapon",             name: "Warp Weapon",             source: SkillSource.CR, hasSpecialisation: false },

  // ─── Radical's Handbook ─────────────────────────────────────────────────────
  { id: "daemonic-presence",       name: "Daemonic Presence",       source: SkillSource.RH, hasSpecialisation: false },
  { id: "touched-by-the-fates",    name: "Touched by the Fates",    source: SkillSource.RH, hasSpecialisation: false },

  // ─── Inquisitor's Handbook ──────────────────────────────────────────────────
  { id: "sanctioned-psyker",       name: "Sanctioned Psyker",       source: SkillSource.IH, hasSpecialisation: false },
  { id: "unnaturally-resistant",   name: "Unnaturally Resistant",   source: SkillSource.IH, hasSpecialisation: false },
];

export type TraitId = (typeof TRAIT_LIST)[number]["id"];
