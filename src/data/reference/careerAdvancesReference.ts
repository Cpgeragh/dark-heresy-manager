// src/data/reference/careerAdvancesReference.ts
// Per-career XP costs: Characteristic Advances and per-rank Skill/Talent advance
// tables, transcribed from each career's own chapter. rankId values match the
// CareerRankData ids already in careerData.ts.

export type CharacteristicKey = "ws" | "bs" | "s" | "t" | "ag" | "int" | "per" | "wp" | "fel";

export interface CareerCharacteristicAdvanceCosts {
  simple: number;
  intermediate: number;
  trained: number;
  expert: number;
}

export interface CareerAdvanceRef {
  kind: "skill" | "talent";
  skillId?: string;
  talentId?: string;
  specialisation?: string;
  level?: "trained" | "+10" | "+20";
  cost: number;
  prerequisites?: string;
  repeatableAtThisRank?: number;
}

export interface CareerRankAdvanceTable {
  rankId: string;
  quote: string;
  description: string;
  advances: CareerAdvanceRef[];
}

export interface CareerAdvancesData {
  careerId: string;
  characteristicAdvances: Record<CharacteristicKey, CareerCharacteristicAdvanceCosts>;
  rankTables: CareerRankAdvanceTable[];
}

export const CAREER_ADVANCES: CareerAdvancesData[] = [
  {
    careerId: "guardsman",
    characteristicAdvances: {
      ws:  { simple: 100, intermediate: 250, trained: 500, expert: 750 },
      bs:  { simple: 100, intermediate: 250, trained: 500, expert: 750 },
      s:   { simple: 100, intermediate: 250, trained: 500, expert: 500 },
      t:   { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      ag:  { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      int: { simple: 500, intermediate: 750, trained: 1000, expert: 2500 },
      per: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      wp:  { simple: 500, intermediate: 750, trained: 1000, expert: 2500 },
      fel: { simple: 500, intermediate: 750, trained: 1000, expert: 2500 },
    },
    rankTables: [
      {
        rankId: "conscript",
        quote: "If they can bleed and run, they can hold a gun.",
        description: "Conscripts learn the raw basics of combat: the charge, the way of the gun and the blade. They may be fresh from an Imperial Guard founding, pressed into service or serving a penal sentence.",
        advances: [
          { kind: "skill", skillId: "awareness", cost: 100 },
          { kind: "skill", skillId: "drive-ground", cost: 100 },
          { kind: "skill", skillId: "swim", cost: 100 },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Las", cost: 100 },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Primitive", cost: 100 },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "SP", cost: 100 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Las", cost: 100 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Primitive", cost: 100 },
          { kind: "talent", talentId: "pistol-training", specialisation: "SP", cost: 100 },
          { kind: "talent", talentId: "sound-constitution", cost: 100, repeatableAtThisRank: 3 },
          { kind: "talent", talentId: "thrown-weapon-training", cost: 100 },
        ],
      },
      {
        rankId: "guard",
        quote: "They left the drop pods as mere conscripts… they returned as men.",
        description: "Guard have survived in battle long enough to learn that survival is often a case of speed and superior tactical knowledge.",
        advances: [
          { kind: "skill", skillId: "dodge", cost: 100 },
          { kind: "skill", skillId: "drive-ground", level: "+10", cost: 100, prerequisites: "Drive (Ground Vehicle)" },
          { kind: "skill", skillId: "ciphers-war-cant", cost: 100 },
          { kind: "skill", skillId: "common-guard", cost: 100 },
          { kind: "skill", skillId: "survival", cost: 100 },
          { kind: "skill", skillId: "swim", level: "+10", cost: 100, prerequisites: "Swim" },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Launcher", cost: 100 },
          { kind: "talent", talentId: "quick-draw", cost: 100 },
          { kind: "talent", talentId: "sound-constitution", cost: 100 },
          { kind: "skill", skillId: "common-war", cost: 200 },
          { kind: "skill", skillId: "inquiry", cost: 200 },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "SP", cost: 200 },
          { kind: "talent", talentId: "two-weapon-wielder", specialisation: "Ballistic", cost: 200, prerequisites: "BS 35, Ag 35" },
        ],
      },
      {
        rankId: "armsman",
        quote: "Without death, there are no heroes.",
        description: "Armsmen increase their knowledge of the weapons they might wield against enemies of the Emperor. They are stout of heart, and strong in the arm—men to trust when the las bolts are flying.",
        advances: [
          { kind: "skill", skillId: "drive-ground", level: "+20", cost: 100, prerequisites: "Drive (Ground Vehicle) +10" },
          { kind: "skill", skillId: "intimidate", cost: 100 },
          { kind: "skill", skillId: "navigation-surface", cost: 100 },
          { kind: "skill", skillId: "pilot-military", cost: 100 },
          { kind: "skill", skillId: "swim", level: "+20", cost: 100, prerequisites: "Swim +10" },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Flame", cost: 100 },
          { kind: "talent", talentId: "crippling-strike", cost: 100, prerequisites: "WS 50" },
          { kind: "talent", talentId: "pistol-training", specialisation: "Flame", cost: 100 },
          { kind: "talent", talentId: "rapid-reload", cost: 100 },
          { kind: "talent", talentId: "sound-constitution", cost: 100 },
          { kind: "skill", skillId: "common-imperium", cost: 200 },
          { kind: "skill", skillId: "gamble", cost: 200 },
          { kind: "skill", skillId: "inquiry", level: "+10", cost: 200, prerequisites: "Inquiry" },
          { kind: "talent", talentId: "ambidextrous", cost: 200, prerequisites: "Ag 30" },
          { kind: "talent", talentId: "melee-weapon-training", specialisation: "Shock", cost: 200 },
          { kind: "talent", talentId: "swift-attack", cost: 200, prerequisites: "WS 35" },
          { kind: "skill", skillId: "literacy", cost: 300 },
        ],
      },
      {
        rankId: "sergeant",
        quote: "Get up and out of that trench before I come over there and make you!",
        description: "As proven warriors, Sergeants learn to finesse their attacks and widen their skills to encompass all manner of eventualities.",
        advances: [
          { kind: "skill", skillId: "ciphers-war-cant", level: "+10", cost: 100, prerequisites: "Ciphers (War Cant)" },
          { kind: "skill", skillId: "common-imperial-creed", cost: 100 },
          { kind: "skill", skillId: "demolition", cost: 100 },
          { kind: "skill", skillId: "intimidate", level: "+10", cost: 100, prerequisites: "Intimidate" },
          { kind: "skill", skillId: "navigation-surface", level: "+10", cost: 100, prerequisites: "Navigation (Surface)" },
          { kind: "skill", skillId: "pilot-military", level: "+10", cost: 100, prerequisites: "Pilot (Military Craft)" },
          { kind: "skill", skillId: "secret-tongue-military", cost: 100 },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Bolt", cost: 100, prerequisites: "S 30" },
          { kind: "talent", talentId: "dual-strike", cost: 100, prerequisites: "Ag 40, Two-Weapon Wielder (Melee)" },
          { kind: "talent", talentId: "melee-weapon-training", specialisation: "Chain", cost: 100 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Bolt", cost: 100 },
          { kind: "talent", talentId: "sound-constitution", cost: 100 },
          { kind: "talent", talentId: "takedown", cost: 100 },
          { kind: "skill", skillId: "carouse", cost: 200 },
          { kind: "skill", skillId: "interrogation", cost: 200 },
          { kind: "skill", skillId: "tech-use", cost: 200 },
          { kind: "talent", talentId: "crushing-blow", cost: 200, prerequisites: "S 40" },
          { kind: "talent", talentId: "dual-shot", cost: 200, prerequisites: "Ag 40, Two-Weapon Wielder (Ballistic)" },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Flame", cost: 200 },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Primitive", cost: 200 },
          { kind: "talent", talentId: "hip-shooting", cost: 200, prerequisites: "BS 40, Ag 40" },
          { kind: "talent", talentId: "two-weapon-wielder", specialisation: "Melee", cost: 200, prerequisites: "WS 35, Ag 35" },
          { kind: "skill", skillId: "barter", cost: 300 },
        ],
      },
      {
        rankId: "veteran",
        quote: "You think this is bad, kid? Just wait till the big guns start!",
        description: "Veterans hold their own upon the battlefield, inspiring others with their prowess, fearlessness and sheer killing power. Their battle wisdom is indispensable, and their luck proven by their continuing vitality.",
        advances: [
          { kind: "skill", skillId: "command", cost: 100 },
          { kind: "skill", skillId: "demolition", level: "+10", cost: 100, prerequisites: "Demolition" },
          { kind: "skill", skillId: "dodge", level: "+10", cost: 100, prerequisites: "Dodge" },
          { kind: "skill", skillId: "pilot-military", level: "+20", cost: 100, prerequisites: "Pilot (Military Craft) +10" },
          { kind: "skill", skillId: "secret-tongue-military", level: "+10", cost: 100, prerequisites: "Secret Tongue (Military)" },
          { kind: "skill", skillId: "survival", level: "+10", cost: 100, prerequisites: "Survival" },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Melta", cost: 100 },
          { kind: "talent", talentId: "basic-weapon-training", specialisation: "Plasma", cost: 100 },
          { kind: "talent", talentId: "bulging-biceps", cost: 100, prerequisites: "S 45" },
          { kind: "talent", talentId: "die-hard", cost: 100, prerequisites: "WP 40" },
          { kind: "talent", talentId: "hard-target", cost: 100, prerequisites: "Ag 40" },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Bolt", cost: 100 },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Las", cost: 100 },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Launcher", cost: 100 },
          { kind: "talent", talentId: "true-grit", cost: 100, prerequisites: "T 40" },
          { kind: "skill", skillId: "climb", cost: 200 },
          { kind: "skill", skillId: "gamble", level: "+10", cost: 200, prerequisites: "Gamble" },
          { kind: "skill", skillId: "medicae", cost: 200 },
          { kind: "skill", skillId: "search", cost: 200 },
          { kind: "talent", talentId: "hatred", specialisation: "Xeno", cost: 200 },
          { kind: "talent", talentId: "iron-jaw", cost: 200, prerequisites: "T 40" },
          { kind: "talent", talentId: "sound-constitution", cost: 200, repeatableAtThisRank: 2 },
        ],
      },
      {
        rankId: "assault-veteran",
        quote: "It's going to get close and messy lads, stay close to me and don't be afraid to get it on ya…",
        description: "Freedom is bought at the point of a blade, and Assault Veterans know this all too well. In the close press of fighting, they wield their chainblades with deadly efficiency.",
        advances: [
          { kind: "skill", skillId: "common-imperial-creed", level: "+10", cost: 100, prerequisites: "Common Lore (Imperial Creed)" },
          { kind: "skill", skillId: "demolition", level: "+20", cost: 100, prerequisites: "Demolition +10" },
          { kind: "skill", skillId: "survival", level: "+20", cost: 100, prerequisites: "Survival +10" },
          { kind: "talent", talentId: "blademaster", cost: 100, prerequisites: "WS 30, Melee Weapon Training (any)" },
          { kind: "talent", talentId: "combat-master", cost: 100, prerequisites: "WS 30" },
          { kind: "talent", talentId: "frenzy", cost: 100 },
          { kind: "talent", talentId: "furious-assault", cost: 100, prerequisites: "WS 35" },
          { kind: "talent", talentId: "leap-up", cost: 100, prerequisites: "Ag 30" },
          { kind: "talent", talentId: "melee-weapon-training", specialisation: "Power", cost: 100 },
          { kind: "skill", skillId: "chem-use", cost: 200 },
          { kind: "skill", skillId: "dodge", level: "+20", cost: 200, prerequisites: "Dodge +10" },
          { kind: "talent", talentId: "sound-constitution", cost: 200 },
          { kind: "talent", talentId: "lightning-attack", cost: 300, prerequisites: "Swift Attack" },
        ],
      },
      {
        rankId: "lieutenant",
        quote: "Watch your formation and stay sharp!",
        description: "Lieutenants lead their men into glorious battle. It falls to an officer to accept the weight of command and responsibilities for success of failure on the battlefield.",
        advances: [
          { kind: "skill", skillId: "command", level: "+10", cost: 100, prerequisites: "Command" },
          { kind: "skill", skillId: "common-ecclesiarchy", cost: 100 },
          { kind: "skill", skillId: "common-imperial-creed", level: "+10", cost: 100, prerequisites: "Common Lore (Imperial Creed)" },
          { kind: "skill", skillId: "interrogation", cost: 100 },
          { kind: "skill", skillId: "navigation-surface", level: "+20", cost: 100, prerequisites: "Navigation (Surface) +10" },
          { kind: "skill", skillId: "scholastic-tactica-imperialis", cost: 100 },
          { kind: "skill", skillId: "trade-copyist", cost: 100 },
          { kind: "talent", talentId: "hatred", specialisation: "Mutants", cost: 100 },
          { kind: "talent", talentId: "melee-weapon-training", specialisation: "Power", cost: 100 },
          { kind: "skill", skillId: "chem-use", cost: 200 },
          { kind: "skill", skillId: "literacy", level: "+10", cost: 200, prerequisites: "Literacy" },
          { kind: "skill", skillId: "medicae", level: "+10", cost: 200, prerequisites: "Medicae" },
          { kind: "skill", skillId: "scrutiny", cost: 200 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Plasma", cost: 200 },
          { kind: "talent", talentId: "sound-constitution", cost: 200 },
          { kind: "skill", skillId: "blather", cost: 300 },
          { kind: "skill", skillId: "charm", cost: 300 },
          { kind: "skill", skillId: "deceive", cost: 300 },
          { kind: "skill", skillId: "evaluate", cost: 300 },
        ],
      },
      {
        rankId: "scout",
        quote: "I swear dead men make more noise than that bastard.",
        description: "Scouts are adept at locating the enemy in all terrain. They are keen observers, and skilled in the art of stealth.",
        advances: [
          { kind: "skill", skillId: "awareness", level: "+10", cost: 100, prerequisites: "Awareness" },
          { kind: "skill", skillId: "navigation-surface", level: "+20", cost: 100, prerequisites: "Navigation (Surface) +10" },
          { kind: "talent", talentId: "deadeye-shot", cost: 100, prerequisites: "BS 30" },
          { kind: "skill", skillId: "climb", level: "+10", cost: 200, prerequisites: "Climb" },
          { kind: "skill", skillId: "concealment", cost: 200 },
          { kind: "skill", skillId: "security", cost: 200 },
          { kind: "skill", skillId: "silent-move", cost: 200 },
          { kind: "talent", talentId: "heightened-senses", specialisation: "Hearing", cost: 200 },
          { kind: "talent", talentId: "heightened-senses", specialisation: "Sight", cost: 200 },
          { kind: "talent", talentId: "heightened-senses", specialisation: "Smell", cost: 200 },
          { kind: "talent", talentId: "leap-up", cost: 200, prerequisites: "Ag 30" },
          { kind: "talent", talentId: "melee-weapon-training", specialisation: "Power", cost: 200 },
          { kind: "talent", talentId: "sound-constitution", cost: 200 },
        ],
      },
      {
        rankId: "shock-trooper",
        quote: "The heretics were still reeling from the door charges when the shock troopers hit them.",
        description: "Shock Troopers know how to storm bunkers and lay down their life for the Emperor. They are well armed, well trained, and well feared.",
        advances: [
          { kind: "skill", skillId: "carouse", level: "+10", cost: 200, prerequisites: "Carouse" },
          { kind: "skill", skillId: "chem-use", level: "+10", cost: 200, prerequisites: "Chem-Use" },
          { kind: "skill", skillId: "concealment", cost: 200 },
          { kind: "talent", talentId: "cleanse-and-purify", cost: 200, prerequisites: "Basic Weapon Training (Flame)" },
          { kind: "talent", talentId: "hardy", cost: 200, prerequisites: "T 40" },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Melta", cost: 200 },
          { kind: "talent", talentId: "heavy-weapon-training", specialisation: "Plasma", cost: 200 },
          { kind: "talent", talentId: "sound-constitution", cost: 200, repeatableAtThisRank: 2 },
          { kind: "talent", talentId: "talented", specialisation: "Chem-Use", cost: 200, prerequisites: "Chem-Use" },
        ],
      },
      {
        rankId: "captain",
        quote: "Squad Five! I want suppressing fire on that blockhouse! Squad Seven, move into flanking positions!",
        description: "Captains command large formations and battle groups. The skill of a bold Captain is vital to any successful attack or defence.",
        advances: [
          { kind: "skill", skillId: "interrogation", level: "+10", cost: 100, prerequisites: "Interrogation" },
          { kind: "skill", skillId: "scholastic-imperial-creed", cost: 100, prerequisites: "Common Lore (Imperial Creed) +10" },
          { kind: "skill", skillId: "scholastic-tactica-imperialis", level: "+10", cost: 100, prerequisites: "Scholastic Lore (Tactica Imperialis)" },
          { kind: "skill", skillId: "secret-tongue-military", level: "+20", cost: 100, prerequisites: "Secret Tongue (Military) +10" },
          { kind: "talent", talentId: "air-of-authority", cost: 100, prerequisites: "Fel 30" },
          { kind: "talent", talentId: "hatred", specialisation: "Psykers", cost: 100 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Melta", cost: 100 },
          { kind: "talent", talentId: "strong-minded", cost: 100, prerequisites: "WP 30, Resistance (Psychic Powers)" },
          { kind: "talent", talentId: "exotic-weapon-training", specialisation: "Web Pistol", cost: 200 },
          { kind: "talent", talentId: "iron-discipline", cost: 200, prerequisites: "WP 30, Command" },
          { kind: "talent", talentId: "nerves-of-steel", cost: 200 },
          { kind: "talent", talentId: "sound-constitution", cost: 200, repeatableAtThisRank: 2 },
          { kind: "talent", talentId: "talented", specialisation: "Blather", cost: 200, prerequisites: "Blather" },
          { kind: "talent", talentId: "talented", specialisation: "Charm", cost: 200, prerequisites: "Charm" },
          { kind: "skill", skillId: "logic", cost: 300 },
          { kind: "talent", talentId: "lightning-attack", cost: 300, prerequisites: "Swift Attack" },
          { kind: "talent", talentId: "resistance", specialisation: "Psychic Powers", cost: 300 },
        ],
      },
      {
        rankId: "marksman",
        quote: "I may not look much but I can take out your left eye with this baby from a thousand yards.",
        description: "Most Imperial forces include a Marksman to support the rest of its members with accurate long-range fire support. They are adept at digging in and picking off the enemy.",
        advances: [
          { kind: "skill", skillId: "survival", level: "+20", cost: 100, prerequisites: "Survival +10" },
          { kind: "talent", talentId: "mighty-shot", cost: 100, prerequisites: "BS 40" },
          { kind: "skill", skillId: "chem-use", cost: 200 },
          { kind: "skill", skillId: "concealment", level: "+10", cost: 200, prerequisites: "Concealment" },
          { kind: "skill", skillId: "security", level: "+10", cost: 200, prerequisites: "Security" },
          { kind: "talent", talentId: "lightning-reflexes", cost: 200 },
          { kind: "talent", talentId: "sharpshooter", cost: 200, prerequisites: "BS 40, Deadeye Shot" },
          { kind: "talent", talentId: "sound-constitution", cost: 200, repeatableAtThisRank: 2 },
          { kind: "talent", talentId: "talented", specialisation: "Shadowing", cost: 200, prerequisites: "Shadowing" },
          { kind: "skill", skillId: "disguise", cost: 300 },
          { kind: "skill", skillId: "shadowing", cost: 300 },
        ],
      },
      {
        rankId: "storm-trooper",
        quote: "Storm troopers? Them throne-groaning glory boys get all the prime action—and all the credit, too. Don't listen to the propaganda—it's us regular Guard that does all the grit-work.",
        description: "Storm Troopers create utter destruction. Often regarded by the regular Guard as vain parade apes, they nonetheless have a well-deserved reputation for being the best of the best.",
        advances: [
          { kind: "skill", skillId: "intimidate", level: "+20", cost: 100, prerequisites: "Intimidate +10" },
          { kind: "talent", talentId: "berserk-charge", cost: 100 },
          { kind: "talent", talentId: "exotic-weapon-training", specialisation: "Web Pistol", cost: 200 },
          { kind: "talent", talentId: "exotic-weapon-training", specialisation: "Webber", cost: 200 },
          { kind: "talent", talentId: "fearless", cost: 200 },
          { kind: "talent", talentId: "insanely-faithful", cost: 200 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Launcher", cost: 200 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Melta", cost: 200 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Plasma", cost: 200 },
          { kind: "talent", talentId: "sound-constitution", cost: 300, repeatableAtThisRank: 2 },
        ],
      },
      {
        rankId: "commander",
        quote: "Men of the Imperium stand tall, for you are the favoured of the Emperor!",
        description: "Commanders control the entire flow of battle, from planning to execution. Imperial Commanders have at their disposal the greatest armies in the known galaxy, and the cold, hard determination to use them.",
        advances: [
          { kind: "skill", skillId: "command", level: "+20", cost: 100, prerequisites: "Command +10" },
          { kind: "skill", skillId: "scholastic-tactica-imperialis", level: "+20", cost: 100, prerequisites: "Scholastic Lore (Tactica Imperialis) +10" },
          { kind: "talent", talentId: "frenzy", cost: 100 },
          { kind: "talent", talentId: "hatred", specialisation: "Cult", cost: 100 },
          { kind: "talent", talentId: "talented", specialisation: "Deceive", cost: 100, prerequisites: "Deceive" },
          { kind: "talent", talentId: "total-recall", cost: 100, prerequisites: "Int 30" },
          { kind: "talent", talentId: "unshakable-faith", cost: 100 },
          { kind: "skill", skillId: "carouse", level: "+10", cost: 200, prerequisites: "Carouse" },
          { kind: "skill", skillId: "concealment", cost: 200 },
          { kind: "talent", talentId: "into-the-jaws-of-hell", cost: 200, prerequisites: "Iron Discipline" },
          { kind: "talent", talentId: "leap-up", cost: 200, prerequisites: "Ag 30" },
          { kind: "talent", talentId: "litany-of-hate", cost: 200, prerequisites: "Hatred (any)" },
          { kind: "talent", talentId: "master-orator", cost: 200, prerequisites: "Fel 30" },
          { kind: "talent", talentId: "sound-constitution", cost: 300, repeatableAtThisRank: 2 },
        ],
      },
      {
        rankId: "sniper",
        quote: "There's something really satisfying about making a man's head explode like a blood melon. All in the name of the Emperor of course.",
        description: "Snipers are masters of their art, able to kill at a distance, then melt away from view. They are silent, skilled and often have a grim sense of humour. Many find them hard to understand.",
        advances: [
          { kind: "skill", skillId: "awareness", level: "+20", cost: 100, prerequisites: "Awareness +10" },
          { kind: "talent", talentId: "talented", specialisation: "Disguise", cost: 100, prerequisites: "Disguise" },
          { kind: "talent", talentId: "talented", specialisation: "Tracking", cost: 100, prerequisites: "Tracking" },
          { kind: "skill", skillId: "chem-use", level: "+10", cost: 200, prerequisites: "Chem-Use" },
          { kind: "skill", skillId: "silent-move", level: "+10", cost: 200, prerequisites: "Silent Move" },
          { kind: "talent", talentId: "pistol-training", specialisation: "Melta", cost: 200 },
          { kind: "talent", talentId: "pistol-training", specialisation: "Plasma", cost: 200 },
          { kind: "skill", skillId: "tracking", cost: 300 },
          { kind: "talent", talentId: "crack-shot", cost: 300, prerequisites: "BS 40" },
          { kind: "talent", talentId: "exotic-weapon-training", specialisation: "Needle Rifle", cost: 300 },
          { kind: "talent", talentId: "lightning-attack", cost: 300, prerequisites: "Swift Attack" },
          { kind: "talent", talentId: "sound-constitution", cost: 300, repeatableAtThisRank: 2 },
        ],
      },
    ],
  },
];
