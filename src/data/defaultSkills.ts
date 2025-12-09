// src/data/defaultSkills.ts
// Complete Dark Heresy 1e skill list (Core + IH + RH + BoM + DW + Daemon Hunter + Lathe Worlds)

import type { SkillEntry } from "../types/Character";

export const DEFAULT_SKILLS: SkillEntry[] = [

  // ===== CORE GENERAL SKILLS =====
  { id: "awareness", name: "Awareness", characteristic: "per", level: "untrained", category: "General", advanced: false },
  { id: "barter", name: "Barter", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "blather", name: "Blather", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "carouse", name: "Carouse", characteristic: "t", level: "untrained", category: "General", advanced: false },
  { id: "charm", name: "Charm", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "chem-use", name: "Chem-Use", characteristic: "int", level: "untrained", category: "General", advanced: true },
  { id: "climb", name: "Climb", characteristic: "s", level: "untrained", category: "General", advanced: false },
  { id: "command", name: "Command", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "concealment", name: "Concealment", characteristic: "ag", level: "untrained", category: "General", advanced: false },
  { id: "contortionist", name: "Contortionist", characteristic: "ag", level: "untrained", category: "General", advanced: true },
  { id: "deceive", name: "Deceive", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "demolition", name: "Demolition", characteristic: "int", level: "untrained", category: "General", advanced: true },
  { id: "disguise", name: "Disguise", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "dodge", name: "Dodge", characteristic: "ag", level: "untrained", category: "General", advanced: false },
  { id: "evaluate", name: "Evaluate", characteristic: "int", level: "untrained", category: "General", advanced: false },
  { id: "gamble", name: "Gamble", characteristic: "int", level: "untrained", category: "General", advanced: false },
  { id: "inquiry", name: "Inquiry", characteristic: "fel", level: "untrained", category: "General", advanced: false },
  { id: "interrogation", name: "Interrogation", characteristic: "wp", level: "untrained", category: "General", advanced: true },
  { id: "intimidate", name: "Intimidate", characteristic: "s", level: "untrained", category: "General", advanced: false },
  { id: "literacy", name: "Literacy", characteristic: "int", level: "untrained", category: "General", advanced: true },
  { id: "logic", name: "Logic", characteristic: "int", level: "untrained", category: "General", advanced: true },
  { id: "medicae", name: "Medicae", characteristic: "int", level: "untrained", category: "General", advanced: true },
  { id: "psyniscience", name: "Psyniscience", characteristic: "per", level: "untrained", category: "General", advanced: true },
  { id: "scrutiny", name: "Scrutiny", characteristic: "per", level: "untrained", category: "General", advanced: false },
  { id: "search", name: "Search", characteristic: "per", level: "untrained", category: "General", advanced: false },
  { id: "security", name: "Security", characteristic: "ag", level: "untrained", category: "General", advanced: true },
  { id: "shadowing", name: "Shadowing", characteristic: "ag", level: "untrained", category: "General", advanced: true },
  { id: "silent-move", name: "Silent Move", characteristic: "ag", level: "untrained", category: "General", advanced: false },
  { id: "sleight-of-hand", name: "Sleight of Hand", characteristic: "ag", level: "untrained", category: "General", advanced: true },
  { id: "survival", name: "Survival", characteristic: "int", level: "untrained", category: "General", advanced: false },
  { id: "swim", name: "Swim", characteristic: "s", level: "untrained", category: "General", advanced: false },
  { id: "tech-use", name: "Tech-Use", characteristic: "int", level: "untrained", category: "General", advanced: true },

  // ===== DRIVE =====
  { id: "drive-ground", name: "Drive (Ground Vehicle)", characteristic: "ag", level: "untrained", category: "Drive", advanced: false },
  { id: "drive-hover", name: "Drive (Hover Vehicle)", characteristic: "ag", level: "untrained", category: "Drive", advanced: false },
  { id: "drive-walker", name: "Drive (Walker)", characteristic: "ag", level: "untrained", category: "Drive", advanced: false },

  // ===== NAVIGATION =====
  { id: "navigation-surface", name: "Navigation (Surface)", characteristic: "int", level: "untrained", category: "Navigation", advanced: true },
  { id: "navigation-stellar", name: "Navigation (Stellar)", characteristic: "int", level: "untrained", category: "Navigation", advanced: true },
  { id: "navigation-warp", name: "Navigation (Warp)", characteristic: "int", level: "untrained", category: "Navigation", advanced: true },

  // ===== SPEAK LANGUAGE =====
  { id: "speak-low-gothic", name: "Speak Language (Low Gothic)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: false },
  { id: "speak-high-gothic", name: "Speak Language (High Gothic)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: true },
  { id: "speak-techna", name: "Speak Language (Techna-Lingua)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: true },
  { id: "speak-traders-cant", name: "Speak Language (Trader’s Cant)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: true },
  { id: "speak-feral", name: "Speak Language (Feral Dialect)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: false },
  { id: "speak-hive", name: "Speak Language (Hive Dialect)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: false },
  { id: "speak-ship-cant", name: "Speak Language (Voidship Cant)", characteristic: "int", level: "untrained", category: "Speak Language", advanced: false },

  // ===== COMMON LORE =====
  { id: "common-administratum", name: "Common Lore (Administratum)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-arbites", name: "Common Lore (Adeptus Arbites)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-astronomica", name: "Common Lore (Adeptus Astronomica)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-astartes", name: "Common Lore (Astartes)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-mechanicus", name: "Common Lore (Adeptus Mechanicus)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-ecclesiarchy", name: "Common Lore (Ecclesiarchy)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-guard", name: "Common Lore (Imperial Guard)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-imperium", name: "Common Lore (Imperium)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-machine-cult", name: "Common Lore (Machine Cult)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-mutants", name: "Common Lore (Mutants)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-psyker", name: "Common Lore (Psykers)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },
  { id: "common-warp", name: "Common Lore (The Warp)", characteristic: "int", level: "untrained", category: "Common Lore", advanced: true },

  // ===== SCHOLASTIC LORE =====
  { id: "scholastic-astromancy", name: "Scholastic Lore (Astromancy)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-bureaucracy", name: "Scholastic Lore (Bureaucracy)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-cryptology", name: "Scholastic Lore (Cryptology)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-cult", name: "Scholastic Lore (Cult)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-heraldry", name: "Scholastic Lore (Heraldry)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-imperial-creed", name: "Scholastic Lore (Imperial Creed)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-judgement", name: "Scholastic Lore (Judgement)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-tactica", name: "Scholastic Lore (Tactica Imperialis)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-legends", name: "Scholastic Lore (Legend)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },
  { id: "scholastic-philosophy", name: "Scholastic Lore (Philosophy)", characteristic: "int", level: "untrained", category: "Scholastic Lore", advanced: true },

  // ===== FORBIDDEN LORE =====
  { id: "forbidden-mechanicus", name: "Forbidden Lore (Adeptus Mechanicus)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-aliens", name: "Forbidden Lore (Aliens)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-astartes", name: "Forbidden Lore (Astartes)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-heresy", name: "Forbidden Lore (Heresy)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-heresy-extremis", name: "Forbidden Lore (Heresy Extremis)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-inquisition", name: "Forbidden Lore (Inquisition)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-immaterium", name: "Forbidden Lore (Immaterium)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-daemonology", name: "Forbidden Lore (Daemonology)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-psyker", name: "Forbidden Lore (Psykers)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-warp", name: "Forbidden Lore (The Warp)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-legion", name: "Forbidden Lore (Traitor Legions)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-xenos", name: "Forbidden Lore (Xenos)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },
  { id: "forbidden-necros", name: "Forbidden Lore (Necros)", characteristic: "int", level: "untrained", category: "Forbidden Lore", advanced: true },

  // ===== PERFORM SKILLS =====
  { id: "perform-acting", name: "Perform (Acting)", characteristic: "fel", level: "untrained", category: "Perform", advanced: false },
  { id: "perform-dancing", name: "Perform (Dancing)", characteristic: "ag", level: "untrained", category: "Perform", advanced: false },
  { id: "perform-singing", name: "Perform (Singing)", characteristic: "fel", level: "untrained", category: "Perform", advanced: false },
  { id: "perform-comedy", name: "Perform (Comedy)", characteristic: "fel", level: "untrained", category: "Perform", advanced: false },
  { id: "perform-instrument", name: "Perform (Instrument)", characteristic: "fel", level: "untrained", category: "Perform", advanced: false },
  { id: "perform-oratory", name: "Perform (Oratory)", characteristic: "fel", level: "untrained", category: "Perform", advanced: false },
  { id: "perform-storytelling", name: "Perform (Storytelling)", characteristic: "fel", level: "untrained", category: "Perform", advanced: false },

  // ===== TRADE SKILLS =====
  { id: "trade-armourer", name: "Trade (Armourer)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-archaeologist", name: "Trade (Archaeologist)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-choirmaster", name: "Trade (Choirmaster)", characteristic: "wp", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-cartographer", name: "Trade (Cartographer)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-chemistry", name: "Trade (Chemistry)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-cook", name: "Trade (Cook)", characteristic: "int", level: "untrained", category: "Trade", advanced: false },
  { id: "trade-engraver", name: "Trade (Engraver)", characteristic: "ag", level: "untrained", category: "Trade", advanced: false },
  { id: "trade-merchant", name: "Trade (Merchant)", characteristic: "fel", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-metallurgist", name: "Trade (Metallurgist)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-shipwright", name: "Trade (Shipwright)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-smith", name: "Trade (Smith)", characteristic: "s", level: "untrained", category: "Trade", advanced: false },
  { id: "trade-technomat", name: "Trade (Technomat)", characteristic: "int", level: "untrained", category: "Trade", advanced: true },
  { id: "trade-scribe", name: "Trade (Scribe)", characteristic: "int", level: "untrained", category: "Trade", advanced: false },

  // ===== EXTRA LORE (SUPPLEMENTS) =====
  { id: "lore-hive-cities", name: "Lore (Hive Cities)", characteristic: "int", level: "untrained", category: "Lore", advanced: true },
  { id: "lore-death-worlds", name: "Lore (Death Worlds)", characteristic: "int", level: "untrained", category: "Lore", advanced: true },
  { id: "lore-cults", name: "Lore (Cults)", characteristic: "int", level: "untrained", category: "Lore", advanced: true },
  { id: "lore-pdfs", name: "Lore (Planetary Defence Forces)", characteristic: "int", level: "untrained", category: "Lore", advanced: true },
];
