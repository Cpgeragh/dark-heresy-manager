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
  { id: "fear",                     name: "Fear",                     source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Rating (1–4)" },
  { id: "flyer",                    name: "Flyer",                    source: SkillSource.CR, hasSpecialisation: false },
  { id: "from-beyond",              name: "From Beyond",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "hoverer",                  name: "Hoverer",                  source: SkillSource.CR, hasSpecialisation: false },
  { id: "incorporeal",              name: "Incorporeal",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "machine",                  name: "Machine",                  source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Armour Value" },
  { id: "multiple-arms",            name: "Multiple Arms",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "natural-armour",           name: "Natural Armour",           source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Armour Value" },
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
  { id: "unnatural-characteristic", name: "Unnatural Characteristic", source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Characteristic", repeatable: true },
  { id: "unnatural-senses",         name: "Unnatural Senses",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "unnatural-speed",          name: "Unnatural Speed",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "warp-instability",         name: "Warp Instability",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "warp-weapon",              name: "Warp Weapon",              source: SkillSource.CR, hasSpecialisation: false },

  // ─── Radical's Handbook ─────────────────────────────────────────────────────
  { id: "touched-by-the-fates",     name: "Touched by the Fates",     source: SkillSource.RH, hasSpecialisation: false },

  // ─── Creatures Anathema ──────────────────────────────────────────────────────
  { id: "improved-natural-weapons", name: "Improved Natural Weapons", source: SkillSource.CA, hasSpecialisation: false },

  // ─── Career Traits (purchasable) ────────────────────────────────────────────
  { id: "encarta-maleficarum",      name: "Encarta Maleficarum",      source: SkillSource.IH, hasSpecialisation: false },
  { id: "feared-and-loathed",       name: "Feared and Loathed",       source: SkillSource.IH, hasSpecialisation: false },
  { id: "knave-of-pistols",         name: "Knave of Pistols",         source: SkillSource.IH, hasSpecialisation: false },
  { id: "mechanus-implants",        name: "Mechanus Implants",        source: SkillSource.CR, hasSpecialisation: false },
  { id: "power-of-the-daemon",      name: "Power of the Daemon",      source: SkillSource.IH, hasSpecialisation: false },
  { id: "psychic-blank",            name: "Psychic Blank",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "psychic-disruption",       name: "Psychic Disruption",       source: SkillSource.CR, hasSpecialisation: false },
  { id: "psychic-invulnerability",  name: "Psychic Invulnerability",  source: SkillSource.CR, hasSpecialisation: false },
  { id: "sanctioned-psyker",        name: "Sanctioned Psyker",        source: SkillSource.IH, hasSpecialisation: false },
  { id: "sin-scarred",              name: "Sin Scarred",              source: SkillSource.IH, hasSpecialisation: false },
  { id: "the-bloody-edge",          name: "The Bloody Edge",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "unnatural-intelligence",   name: "Unnatural Intelligence",   source: SkillSource.IH, hasSpecialisation: false },
  { id: "unreadable-mind",          name: "Unreadable Mind",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "unsettling-presence",      name: "Unsettling Presence",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "witch-sight",              name: "Witch Sight",              source: SkillSource.BoM, hasSpecialisation: false },
  { id: "wyrd-power",               name: "Wyrd Power",               source: SkillSource.CR, hasSpecialisation: false },

  // ─── Starting / Background Traits ───────────────────────────────────────────
  { id: "accustomed-to-crowds",     name: "Accustomed to Crowds",     source: SkillSource.IH, hasSpecialisation: false },
  { id: "bad-blood",                name: "Bad Blood",                source: SkillSource.IH, hasSpecialisation: false },
  { id: "barren-world",             name: "Barren World",             source: SkillSource.IH, hasSpecialisation: false },
  { id: "beloved-of-the-god-emperor", name: "Beloved of the God-Emperor", source: SkillSource.IH, hasSpecialisation: false },
  { id: "blessed-ignorance",        name: "Blessed Ignorance",        source: SkillSource.IH, hasSpecialisation: false },
  { id: "blighted-origins",         name: "Blighted Origins",         source: SkillSource.IH, hasSpecialisation: false },
  { id: "born-survivor",            name: "Born Survivor",            source: SkillSource.IH, hasSpecialisation: false },
  { id: "caves-of-steel",           name: "Caves of Steel",           source: SkillSource.IH, hasSpecialisation: false },
  { id: "charmed",                  name: "Charmed",                  source: SkillSource.IH, hasSpecialisation: false },
  { id: "close-quarter-fighter",    name: "Close-Quarter Fighter",    source: SkillSource.IH, hasSpecialisation: false },
  { id: "cold-souled-and-hungry",   name: "Cold-Souled and Hungry",   source: SkillSource.IH, hasSpecialisation: false },
  { id: "conditioned-mind",         name: "Conditioned Mind",         source: SkillSource.IH, hasSpecialisation: false },
  { id: "credo-omnissiah",          name: "Credo Omnissiah",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "dark-tales",               name: "Dark Tales",               source: SkillSource.IH, hasSpecialisation: false },
  { id: "darkholder-skills",        name: "Darkholder Skills",        source: SkillSource.IH, hasSpecialisation: false },
  { id: "decayed-society",          name: "Decayed Society",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "engram-implant",           name: "Engram Implant",           source: SkillSource.IH, hasSpecialisation: false },
  { id: "etiquette",                name: "Etiquette",                source: SkillSource.IH, hasSpecialisation: false },
  { id: "failsafe-control",         name: "Failsafe Control",         source: SkillSource.IH, hasSpecialisation: false },
  { id: "fiendish-mind",            name: "Fiendish Mind",            source: SkillSource.IH, hasSpecialisation: false },
  { id: "fit-for-purpose",          name: "Fit For Purpose",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "ghillam-blood",            name: "Ghillam Blood",            source: SkillSource.IH, hasSpecialisation: false },
  { id: "grim",                     name: "Grim",                     source: SkillSource.IH, hasSpecialisation: false },
  { id: "hagiography",              name: "Hagiography",              source: SkillSource.IH, hasSpecialisation: false },
  { id: "hivebound",                name: "Hivebound",                source: SkillSource.IH, hasSpecialisation: false },
  { id: "ill-omened",               name: "Ill-Omened",               source: SkillSource.IH, hasSpecialisation: false },
  { id: "imperial-conditioning",    name: "Imperial Conditioning",    source: SkillSource.IH, hasSpecialisation: false },
  { id: "iron-stomach",             name: "Iron Stomach",             source: SkillSource.IH, hasSpecialisation: false },
  { id: "little-left-to-fear",      name: "Little Left to Fear",      source: SkillSource.IH, hasSpecialisation: false },
  { id: "liturgical-familiarity",   name: "Liturgical Familiarity",   source: SkillSource.IH, hasSpecialisation: false },
  { id: "monstrous-lineage",        name: "Monstrous Lineage",        source: SkillSource.IH, hasSpecialisation: false },
  { id: "naval-lineage-skills",     name: "Naval Lineage Skills",     source: SkillSource.IH, hasSpecialisation: false },
  { id: "officer-on-deck",          name: "Officer on Deck",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "packing-iron",             name: "Packing Iron",             source: SkillSource.IH, hasSpecialisation: false },
  { id: "primitive",                name: "Primitive",                source: SkillSource.IH, hasSpecialisation: false },
  { id: "rite-of-passage",          name: "Rite of Passage",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "schola-education",         name: "Schola Education",         source: SkillSource.IH, hasSpecialisation: false },
  { id: "sheltered-upbringing",     name: "Sheltered Upbringing",     source: SkillSource.IH, hasSpecialisation: false },
  { id: "shipwise",                 name: "Shipwise",                 source: SkillSource.IH, hasSpecialisation: false },
  { id: "skill-at-arms",            name: "Skill at Arms",            source: SkillSource.IH, hasSpecialisation: false },
  { id: "stranger-to-the-cult",     name: "Stranger to the Cult",     source: SkillSource.IH, hasSpecialisation: false },
  { id: "strength-through-adversity", name: "Strength through Adversity", source: SkillSource.IH, hasSpecialisation: false },
  { id: "superior-origins",         name: "Superior Origins",         source: SkillSource.IH, hasSpecialisation: false },
  { id: "supremely-connected",      name: "Supremely Connected",      source: SkillSource.IH, hasSpecialisation: false },
  { id: "tempered-will",            name: "Tempered Will",            source: SkillSource.IH, hasSpecialisation: false },
  { id: "through-a-mirror-darkly",  name: "Through a Mirror Darkly",  source: SkillSource.IH, hasSpecialisation: false },
  { id: "tutored-in-the-profane",   name: "Tutored in the Profane",   source: SkillSource.IH, hasSpecialisation: false },
  { id: "twist",                    name: "Twist",                    source: SkillSource.IH, hasSpecialisation: false },
  { id: "vendetta",                 name: "Vendetta",                 source: SkillSource.IH, hasSpecialisation: false },
  { id: "void-accustomed",          name: "Void Accustomed",          source: SkillSource.IH, hasSpecialisation: false },
  { id: "wary",                     name: "Wary",                     source: SkillSource.IH, hasSpecialisation: false },
  { id: "way-of-the-gun",           name: "Way of the Gun",           source: SkillSource.IH, hasSpecialisation: false },
  { id: "wealth",                   name: "Wealth",                   source: SkillSource.IH, hasSpecialisation: false },
  { id: "wilderness-savvy",         name: "Wilderness Savvy",         source: SkillSource.IH, hasSpecialisation: false },
];

export type TraitId = (typeof TRAIT_LIST)[number]["id"];
