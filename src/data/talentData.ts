// src/data/talentData.ts

import { SkillSource } from "../types/SkillSource";

export interface TalentData {
  id: string;
  name: string;
  source: SkillSource;
  hasSpecialisation: boolean;
  specialisationLabel?: string; // e.g. "Group", "Sense", "Skill"
  prerequisites?: string;
  repeatable?: boolean;         // true = can be taken more than once (e.g. Sound Constitution)
  description?: string;
}

export const TALENT_LIST: readonly TalentData[] = [

  // ─── Core Rulebook ──────────────────────────────────────────────────────────
  { id: "air-of-authority",      name: "Air of Authority",      source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Fel 30" },
  { id: "ambidextrous",          name: "Ambidextrous",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 30" },
  { id: "armour-of-contempt",    name: "Armour of Contempt",    source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 40" },
  { id: "arms-master",           name: "Arms Master",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 30, BS 30" },
  { id: "assassin-strike",       name: "Assassin Strike",       source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 40, Acrobatics" },
  { id: "autosanguine",          name: "Autosanguine",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Tech-Use" },
  { id: "battle-rage",           name: "Battle Rage",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Frenzy" },
  { id: "berserk-charge",        name: "Berserk Charge",        source: SkillSource.CR, hasSpecialisation: false },
  { id: "binary-chatter",        name: "Binary Chatter",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Tech-Use" },
  { id: "blademaster",           name: "Blademaster",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 30" },
  { id: "blind-fighting",        name: "Blind Fighting",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Per 30" },
  { id: "bulging-biceps",        name: "Bulging Biceps",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "S 45" },
  { id: "catfall",               name: "Catfall",               source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 30" },
  { id: "chem-geld",             name: "Chem Geld",             source: SkillSource.CR, hasSpecialisation: false },
  { id: "cleanse-and-purify",    name: "Cleanse and Purify",    source: SkillSource.CR, hasSpecialisation: false },
  { id: "combat-master",         name: "Combat Master",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 30" },
  { id: "concealed-cavity",      name: "Concealed Cavity",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "corpus-conversion",     name: "Corpus Conversion",     source: SkillSource.CR, hasSpecialisation: false },
  { id: "counter-attack",        name: "Counter-attack",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 40" },
  { id: "crack-shot",            name: "Crack Shot",            source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 40" },
  { id: "crippling-strike",      name: "Crippling Strike",      source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 50" },
  { id: "crushing-blow",         name: "Crushing Blow",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 40" },
  { id: "dark-soul",             name: "Dark Soul",             source: SkillSource.CR, hasSpecialisation: false },
  { id: "deadeye-shot",          name: "Deadeye Shot",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 30" },
  { id: "decadence",             name: "Decadence",             source: SkillSource.CR, hasSpecialisation: false, prerequisites: "T 30" },
  { id: "deflect-shot",          name: "Deflect Shot",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 50" },
  { id: "die-hard",              name: "Die Hard",              source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 40" },
  { id: "disarm",                name: "Disarm",                source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 30" },
  { id: "discipline-focus",      name: "Discipline Focus",      source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 30" },
  { id: "disturbing-voice",      name: "Disturbing Voice",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "double-team",           name: "Double Team",           source: SkillSource.CR, hasSpecialisation: false },
  { id: "dual-shot",             name: "Dual Shot",             source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 40, Two-Weapon Wielder (Ballistic)" },
  { id: "dual-strike",           name: "Dual Strike",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 40, Two-Weapon Wielder (Melee)" },
  { id: "electrical-succour",    name: "Electrical Succour",    source: SkillSource.CR, hasSpecialisation: false },
  { id: "electro-graft-use",     name: "Electro Graft Use",     source: SkillSource.CR, hasSpecialisation: false },
  { id: "energy-cache",          name: "Energy Cache",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "exotic-weapon-training",name: "Exotic Weapon Training",source: SkillSource.CR, hasSpecialisation: true, specialisationLabel: "Weapon", repeatable: true },
  { id: "favoured-by-the-warp",  name: "Favoured by the Warp",  source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 35" },
  { id: "fearless",              name: "Fearless",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "feedback-screech",      name: "Feedback Screech",      source: SkillSource.CR, hasSpecialisation: false },
  { id: "ferric-lure",           name: "Ferric Lure",           source: SkillSource.CR, hasSpecialisation: false },
  { id: "ferric-summons",        name: "Ferric Summons",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ferric Lure" },
  { id: "flagellant",            name: "Flagellant",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "foresight",             name: "Foresight",             source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Int 30" },
  { id: "frenzy",                name: "Frenzy",                source: SkillSource.CR, hasSpecialisation: false },
  { id: "furious-assault",       name: "Furious Assault",       source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 35" },
  { id: "good-reputation",       name: "Good Reputation",       source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Group", prerequisites: "Fel 50, Peer (same group)", repeatable: true },
  { id: "gun-blessing",          name: "Gun Blessing",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Tech-Use" },
  { id: "gunslinger",            name: "Gunslinger",            source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 40, Pistol Training (Any)" },
  { id: "hard-target",           name: "Hard Target",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 40" },
  { id: "hardy",                 name: "Hardy",                 source: SkillSource.CR, hasSpecialisation: false, prerequisites: "T 40" },
  { id: "hatred",                name: "Hatred",                source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Group", repeatable: true },
  { id: "heavy-weapon-training", name: "Heavy Weapon Training", source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Group", repeatable: true },
  { id: "heightened-senses",     name: "Heightened Senses",     source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Sense", repeatable: true },
  { id: "hip-shooting",          name: "Hip Shooting",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 40, Ag 40" },
  { id: "independent-targeting", name: "Independent Targeting", source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 40" },
  { id: "insanely-faithful",     name: "Insanely Faithful",     source: SkillSource.CR, hasSpecialisation: false },
  { id: "into-the-jaws-of-hell", name: "Into the Jaws of Hell", source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 40" },
  { id: "iron-discipline",       name: "Iron Discipline",       source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 30, Command" },
  { id: "iron-jaw",              name: "Iron Jaw",              source: SkillSource.CR, hasSpecialisation: false, prerequisites: "T 40" },
  { id: "jaded",                 name: "Jaded",                 source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 30" },
  { id: "leap-up",               name: "Leap Up",               source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 30" },
  { id: "light-sleeper",         name: "Light Sleeper",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Per 30" },
  { id: "lightning-attack",      name: "Lightning Attack",      source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Swift Attack" },
  { id: "lightning-reflexes",    name: "Lightning Reflexes",    source: SkillSource.CR, hasSpecialisation: false },
  { id: "litany-of-hate",        name: "Litany of Hate",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Hatred (Any)" },
  { id: "logis-implant",         name: "Logis Implant",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "luminen-blast",         name: "Luminen Blast",         source: SkillSource.CR, hasSpecialisation: false },
  { id: "luminen-charge",        name: "Luminen Charge",        source: SkillSource.CR, hasSpecialisation: false },
  { id: "luminen-shock",         name: "Luminen Shock",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Luminen Charge" },
  { id: "maglev-grace",          name: "Maglev Grace",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "maglev-transcendence",  name: "Maglev Transcendence",  source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Maglev Grace" },
  { id: "marksman",              name: "Marksman",              source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 35" },
  { id: "master-chirurgeon",     name: "Master Chirurgeon",     source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Medicae +10" },
  { id: "master-orator",         name: "Master Orator",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Fel 30" },
  { id: "mechadendrite-use",     name: "Mechadendrite Use",     source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Type", repeatable: true },
  { id: "meditation",            name: "Meditation",            source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 30" },
  { id: "mental-fortress",       name: "Mental Fortress",       source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 50, Strong Minded" },
  { id: "mental-rage",           name: "Mental Rage",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Frenzy" },
  { id: "mighty-shot",           name: "Mighty Shot",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 40" },
  { id: "mimic",                 name: "Mimic",                 source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Per 30" },
  { id: "minor-psychic-power",   name: "Minor Psychic Power",   source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Psy Rating 1", repeatable: true },
  { id: "nerves-of-steel",       name: "Nerves of Steel",       source: SkillSource.CR, hasSpecialisation: false },
  { id: "orthoproxy",            name: "Orthoproxy",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "paranoia",              name: "Paranoia",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "peer",                  name: "Peer",                  source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Group", prerequisites: "Fel 30", repeatable: true },
  { id: "power-well",            name: "Power Well",            source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 50, Psy Rating" },
  { id: "precise-blow",          name: "Precise Blow",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 40, Sure Strike" },
  { id: "prosanguine",           name: "Prosanguine",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Autosanguine" },
  { id: "psy-rating",            name: "Psy Rating",            source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Rating (1–6)" },
  { id: "psychic-power",         name: "Psychic Power",         source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Power Name", prerequisites: "Psy Rating 1", repeatable: true },
  { id: "quick-draw",            name: "Quick Draw",            source: SkillSource.CR, hasSpecialisation: false },
  { id: "rapid-reaction",        name: "Rapid Reaction",        source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 40" },
  { id: "rapid-reload",          name: "Rapid Reload",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "resistance",            name: "Resistance",            source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Type", repeatable: true },
  { id: "rite-of-awe",           name: "Rite of Awe",           source: SkillSource.CR, hasSpecialisation: false },
  { id: "rite-of-fear",          name: "Rite of Fear",          source: SkillSource.CR, hasSpecialisation: false },
  { id: "rite-of-pure-thought",  name: "Rite of Pure Thought",  source: SkillSource.CR, hasSpecialisation: false },
  { id: "sharpshooter",          name: "Sharpshooter",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "BS 40, Deadeye Shot" },
  { id: "sound-constitution",    name: "Sound Constitution",    source: SkillSource.CR, hasSpecialisation: false, repeatable: true },
  { id: "sprint",                name: "Sprint",                source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 30" },
  { id: "step-aside",            name: "Step Aside",            source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 40, Dodge" },
  { id: "street-fighting",       name: "Street Fighting",       source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 35" },
  { id: "strong-minded",         name: "Strong Minded",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 30, Resistance (Psychic Powers)" },
  { id: "sure-strike",           name: "Sure Strike",           source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 30" },
  { id: "swift-attack",          name: "Swift Attack",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WS 35" },
  { id: "takedown",              name: "Takedown",              source: SkillSource.CR, hasSpecialisation: false },
  { id: "talented",              name: "Talented",              source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Skill", repeatable: true },
  { id: "technical-knock",       name: "Technical Knock",       source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Int 30" },
  { id: "thrown-weapon-training",name: "Thrown Weapon Training",source: SkillSource.CR, hasSpecialisation: false },
  { id: "total-recall",          name: "Total Recall",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Int 30" },
  { id: "true-grit",             name: "True Grit",             source: SkillSource.CR, hasSpecialisation: false, prerequisites: "T 40" },
  { id: "two-weapon-wielder",    name: "Two-Weapon Wielder",    source: SkillSource.CR, hasSpecialisation: true,  specialisationLabel: "Type", prerequisites: "Ag 35", repeatable: true },
  { id: "unremarkable",          name: "Unremarkable",          source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Fel 30" },
  { id: "unshakeable-faith",     name: "Unshakeable Faith",     source: SkillSource.CR, hasSpecialisation: false, prerequisites: "WP 30" },
  { id: "wall-of-steel",         name: "Wall of Steel",         source: SkillSource.CR, hasSpecialisation: false, prerequisites: "Ag 35" },

  // ─── Inquisitor's Handbook ──────────────────────────────────────────────────
  { id: "blessed-ignorance",     name: "Blessed Ignorance",     source: SkillSource.IH, hasSpecialisation: false },
  { id: "fearful-gaze",          name: "Fearful Gaze",          source: SkillSource.IH, hasSpecialisation: false, prerequisites: "WP 35" },
  { id: "nerves-of-brass",       name: "Nerves of Brass",       source: SkillSource.IH, hasSpecialisation: false, prerequisites: "WP 30" },
  { id: "pity-the-weak",         name: "Pity the Weak",         source: SkillSource.IH, hasSpecialisation: false, prerequisites: "Fel 30" },

  // ─── Blood of Martyrs ───────────────────────────────────────────────────────
  { id: "shield-of-faith",       name: "Shield of Faith",       source: SkillSource.BoM, hasSpecialisation: false, prerequisites: "WP 30" },
  { id: "fervent-belief",        name: "Fervent Belief",        source: SkillSource.BoM, hasSpecialisation: false, prerequisites: "WP 30, Shield of Faith" },
  { id: "pure-faith",            name: "Pure Faith",            source: SkillSource.BoM, hasSpecialisation: false, prerequisites: "WP 35, Fervent Belief" },
  { id: "act-of-faith",          name: "Act of Faith",          source: SkillSource.BoM, hasSpecialisation: true,  specialisationLabel: "Act", prerequisites: "Pure Faith", repeatable: true },
  { id: "blessed-weapon",        name: "Blessed Weapon",        source: SkillSource.BoM, hasSpecialisation: false, prerequisites: "WP 35" },
  { id: "body-of-stone",         name: "Body of Stone",         source: SkillSource.BoM, hasSpecialisation: false, prerequisites: "T 50, Hardy" },

  // ─── Radical's Handbook ─────────────────────────────────────────────────────
  { id: "daemonic-resilience",   name: "Daemonic Resilience",   source: SkillSource.RH, hasSpecialisation: false },
  { id: "tainted-will",          name: "Tainted Will",          source: SkillSource.RH, hasSpecialisation: false },
  { id: "warded",                name: "Warded",                source: SkillSource.RH, hasSpecialisation: false, prerequisites: "WP 40" },
  { id: "chaos-gift",            name: "Chaos Gift",            source: SkillSource.RH, hasSpecialisation: true,  specialisationLabel: "Gift", repeatable: true },

  // ─── Daemon Hunter ──────────────────────────────────────────────────────────
  { id: "hammer-of-witches",     name: "Hammer of Witches",     source: SkillSource.DH, hasSpecialisation: false, prerequisites: "WP 40" },
  { id: "purgation",             name: "Purgation",             source: SkillSource.DH, hasSpecialisation: false, prerequisites: "WP 35" },
  { id: "rite-of-sanctioning",   name: "Rite of Sanctioning",   source: SkillSource.DH, hasSpecialisation: false, prerequisites: "Psy Rating 3" },
  { id: "the-flesh-is-weak",     name: "The Flesh Is Weak",     source: SkillSource.DH, hasSpecialisation: false },

  // ─── Lathe Worlds ───────────────────────────────────────────────────────────
  { id: "superior-chirurgeon",   name: "Superior Chirurgeon",   source: SkillSource.LW, hasSpecialisation: false, prerequisites: "Medicae +20, Master Chirurgeon" },
  { id: "mechadendrite-mastery", name: "Mechadendrite Mastery", source: SkillSource.LW, hasSpecialisation: true,  specialisationLabel: "Type", prerequisites: "Mechadendrite Use (same type)", repeatable: true },

  // ─── Ascension ──────────────────────────────────────────────────────────────
  { id: "adamantine-will",       name: "Adamantine Will",       source: SkillSource.Asc, hasSpecialisation: false, prerequisites: "WP 55, Strong Minded, Mental Fortress" },
  { id: "warp-conduit",          name: "Warp Conduit",          source: SkillSource.Asc, hasSpecialisation: false, prerequisites: "Psy Rating 5, Power Well" },
  { id: "ray-of-insight",        name: "Ray of Insight",        source: SkillSource.Asc, hasSpecialisation: false, prerequisites: "Int 50, Psy Rating 3" },

  // ─── Disciples of the Dark Gods ─────────────────────────────────────────────
  { id: "unspeakable-ritual",    name: "Unspeakable Ritual",    source: SkillSource.DotDG, hasSpecialisation: true,  specialisationLabel: "Ritual" },

  // ─── Book of Judgement ──────────────────────────────────────────────────────
  { id: "lex-talionis",          name: "Lex Talionis",          source: SkillSource.BoJ, hasSpecialisation: false },
  { id: "shock-and-awe",         name: "Shock and Awe",         source: SkillSource.BoJ, hasSpecialisation: false, prerequisites: "WP 35" },
  { id: "street-knowledge",      name: "Street Knowledge",      source: SkillSource.BoJ, hasSpecialisation: false, prerequisites: "Per 35" },
];

export type TalentId = (typeof TALENT_LIST)[number]["id"];
