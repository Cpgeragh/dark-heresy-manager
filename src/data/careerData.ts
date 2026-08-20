import { SkillSource } from "../types/SkillSource";

export interface CareerRankData {
  id: string;
  name: string;
  tier: number;
  xpLevel: string;
  paths?: readonly string[];
}

export interface CareerRuleSection {
  title: string;
  content: string;
}

export interface CareerTraitData {
  name: string;
  description: string;
  sections?: readonly CareerRuleSection[];
}

export interface CareerTableRow {
  result: string;
  effect: string;
}

export interface CareerStartingSkillOption {
  skillId: string;
}

export interface CareerStartingSkillGrant {
  /** One option = a fixed grant. Two or more = a real "or" choice. */
  options: readonly CareerStartingSkillOption[];
}

export interface CareerStartingTalentOption {
  talentId: string;
  specialisation?: string;
}

export interface CareerStartingTalentGrant {
  options: readonly CareerStartingTalentOption[];
}

export interface CareerData {
  id: string;
  name: string;
  source: SkillSource;
  quote: string;
  attribution: string;
  description: string;
  startingSkills: string;
  startingTalents: string;
  startingSkillGrants?: readonly CareerStartingSkillGrant[];
  startingTalentGrants?: readonly CareerStartingTalentGrant[];
  startingGear: string;
  startingRank: string;
  startingPsychicPowers?: string;
  homeworldRolls: {
    feralWorld?: string;
    hiveWorld?: string;
    imperialWorld?: string;
    voidBorn?: string;
  };
  traits?: readonly CareerTraitData[];
  specialTable?: {
    title: string;
    rows: readonly CareerTableRow[];
  };
  ranks: readonly CareerRankData[];
}

const rank = (
  id: string,
  name: string,
  tier: number,
  xpLevel: string,
  paths?: readonly string[]
): CareerRankData => ({ id, name, tier, xpLevel, paths });

export const CAREER_LIST: readonly CareerData[] = [
  {
    id: "adept",
    name: "Adept",
    source: SkillSource.CR,
    quote: "Knowledge is power. Do not waste it on the masses.",
    attribution: "Sector Governor Marius Hax.",
    description:
      "Adepts are wise and learned scholars, at least they hope to be one day. They are skilled with languages, knowledge and often act as the brains of the group. They are not very good at fighting, and some are very poor at talking to people. When it comes to the realm of the mind however, they leave everyone else for dust.",
    startingSkills:
      "Speak Language (Low Gothic) (Int), Literacy (Int), Trade (Copyist) (Int) or Trade (Valet) (Fel), Common Lore (Imperium) (Int), Scholastic Lore (Legend) (Int) or Common Lore (Tech) (Int).",
    startingTalents:
      "Melee Weapon Training (Primitive) or Pistol Training (SP), Light Sleeper or Resistance (Cold), Sprint or Unremarkable.",
    startingSkillGrants: [
      { options: [{ skillId: "speak-low-gothic" }] },
      { options: [{ skillId: "literacy" }] },
      { options: [{ skillId: "trade-copyist" }, { skillId: "trade-valet" }] },
      { options: [{ skillId: "common-imperium" }] },
      { options: [{ skillId: "scholastic-legend" }, { skillId: "common-tech" }] },
    ],
    startingTalentGrants: [
      {
        options: [
          { talentId: "melee-weapon-training", specialisation: "Primitive" },
          { talentId: "pistol-training", specialisation: "SP" },
        ],
      },
      { options: [{ talentId: "light-sleeper" }, { talentId: "resistance", specialisation: "Cold" }] },
      { options: [{ talentId: "sprint" }, { talentId: "unremarkable" }] },
    ],
    startingGear:
      "Stub revolver and 6 bullets or staff, Administratum robes (Common Quality Clothing), auto-quill or writing kit, chrono or hour glass, data-slate or illuminated tome, backpack.",
    startingRank: "Archivist",
    homeworldRolls: { imperialWorld: "01–12", voidBorn: "01–10" },
    ranks: [
      rank("archivist", "Archivist", 1, "0–499"),
      rank("scrivener", "Scrivener", 2, "500–999"),
      rank("scribe", "Scribe", 3, "1,000–1,999"),
      rank("inditor", "Inditor", 4, "2,000–2,999", ["Inditor"]),
      rank("chirurgeon", "Chirurgeon", 4, "2,000–2,999", ["Chirurgeon"]),
      rank("scholar", "Scholar", 5, "3,000–5,999", ["Inditor", "Chirurgeon"]),
      rank("lexographer", "Lexographer", 6, "6,000–7,999", ["Inditor"]),
      rank("comptroller", "Comptroller", 6, "6,000–7,999", ["Chirurgeon"]),
      rank("loremaster-lexographer", "Loremaster Lexographer", 7, "8,000–9,999", ["Inditor"]),
      rank("logister-comptroller", "Logister Comptroller", 7, "8,000–9,999", ["Chirurgeon"]),
      rank("loremaster-magister", "Loremaster Magister", 8, "10,000–14,999", ["Inditor"]),
      rank("sage-logister", "Sage Logister", 8, "10,000–14,999", ["Chirurgeon"]),
    ],
  },
  {
    id: "arbitrator",
    name: "Arbitrator",
    source: SkillSource.CR,
    quote: "No shield may stay the blade of justice.",
    attribution: "Meditations of the Adeptus Arbites.",
    description:
      "Arbitrators are tough law-keepers and judges. They ensure that the Imperium’s laws are maintained, whilst also acting as executioners for rebels, seditionists and trouble-makers. Arbitrators do not serve on any local planetary police force, rather they are members of a higher organisation: the Adeptus Arbites. Arbitrators are not very strong, and they sometimes lack social graces. When it comes to sheer ability to soak up damage and to track down their prey, however, they are certainly the ones you want on your side.",
    startingSkills:
      "Speak Language (Low Gothic) (Int), Literacy (Int), Common Lore (Adeptus Arbites) (Int), Common Lore (Imperium) (Int), Inquiry (Fel).",
    startingTalents:
      "Basic Weapons Training (SP), Melee Weapon Training (Primitive), Quick Draw or Rapid Reload.",
    startingGear:
      "Shotgun and 12 shells, club, brass knuckles, knife, chain coat or flak vest or mesh vest, uniform (Good Quality Clothing), 3 doses of stimm, injector, Arbitrator ID, chrono, pack of lho-sticks or ask of amasec.",
    startingRank: "Trooper",
    homeworldRolls: { hiveWorld: "01–17", imperialWorld: "13–25", voidBorn: "11–20" },
    ranks: [
      rank("trooper", "Trooper", 1, "0–499"),
      rank("enforcer", "Enforcer", 2, "500–999"),
      rank("regulator", "Regulator", 3, "1,000–1,999"),
      rank("investigator", "Investigator", 4, "2,000–2,999"),
      rank("arbitrator", "Arbitrator", 5, "3,000–5,999"),
      rank("proctor", "Proctor", 6, "6,000–7,999", ["Proctor"]),
      rank("intelligencer", "Intelligencer", 6, "6,000–7,999", ["Intelligencer"]),
      rank("marshal", "Marshal", 7, "8,000–9,999", ["Proctor"]),
      rank("magistrate", "Magistrate", 7, "8,000–9,999", ["Intelligencer"]),
      rank("lord-marshal", "Lord Marshal", 8, "10,000–14,999", ["Proctor"]),
      rank("justicar", "Justicar", 8, "10,000–14,999", ["Intelligencer"]),
    ],
  },
  {
    id: "assassin",
    name: "Assassin",
    source: SkillSource.CR,
    quote: "The Emperor wills all things, even death. Some deaths He wills swifter than others…",
    attribution: "Asthrid, Assassinorum Priestess.",
    description:
      "Assassins are skilled killers, adept at getting close to a target and ending their days. Some are cold-blooded executioners that revel in bloodshed, while others are consummate professionals who take great pride in their art. Whatever their motivations, they represent some of the most dangerous men and women of the Inquisition, each one a finely honed tool of murder.",
    startingSkills: "Speak Language (Low Gothic) (Int), Awareness (Per), Dodge (Ag).",
    startingTalents:
      "Melee Weapon Training (Primitive), Ambidextrous or Unremarkable, Thrown Weapon Training or Pistol Training (Las), Basic Weapon Training (SP), Pistol Training (SP).",
    startingGear:
      "Shotgun and 12 shells or hunting rifle and 16 rounds or autogun and 1 clip, sword, knife, compact las pistol and 1 charge pack or 10 throwing knives, 3 doses of stimm, charm (corpse hair), black bodyglove (Common Quality Clothing).",
    startingRank: "Sell-Steel",
    homeworldRolls: {
      feralWorld: "01–30",
      hiveWorld: "18–20",
      imperialWorld: "26–38",
      voidBorn: "21–25",
    },
    ranks: [
      rank("sell-steel", "Sell-Steel", 1, "0–499"),
      rank("shadesman", "Shadesman", 2, "500–999"),
      rank("nighthawk", "Nighthawk", 3, "1,000–1,999"),
      rank("secluse", "Secluse", 4, "2,000–2,999"),
      rank("assassin", "Assassin", 5, "3,000–5,999"),
      rank("death-adept", "Death Adept", 6, "6,000–7,999", ["Death Adept"]),
      rank("freeblade", "Freeblade", 6, "6,000–7,999", ["Freeblade"]),
      rank("nihilator", "Nihilator", 7, "8,000–9,999", ["Death Adept"]),
      rank("assassin-at-marque", "Assassin at Marque", 7, "8,000–9,999", ["Freeblade"]),
      rank("imperator-mortis", "Imperator-Mortis", 8, "10,000–14,999", ["Death Adept"]),
      rank("assassin-palatine", "Assassin Palatine", 8, "10,000–14,999", ["Freeblade"]),
    ],
  },
  {
    id: "cleric",
    name: "Cleric",
    source: SkillSource.CR,
    quote:
      "A man without faith is a man without a soul. Suffer not the soulless in thy ministry, for they make doors for dangerous forces.",
    attribution: "Commandments to the Ecclesiarchy.",
    description:
      "Clerics are the priests of the Emperor, members of the vast organisation known as the Ecclesiarchy. They are charismatic and capable leaders, as well as respected figures of authority. Clerics are trained in a wide variety of abilities, and can turn their hand to pretty much anything. Most notably they know how to lead and inspire, preaching from the front line as they charge into battle.",
    startingSkills:
      "Speak Language (Low Gothic) (Int), Common Lore (Imperial Creed) (Int), Literacy (Int), Performer (Singer) (Fel) or Trade (Copyist) (Int), Trade (Cook) (Int) or Trade (Valet) (Fel).",
    startingTalents:
      "Melee Weapon Training (Primitive), Pistol Training (SP), Basic Weapon Training (Primitive) or Thrown Weapon Training (Primitive).",
    startingGear:
      "Hammer or sword, stub revolver and 6 bullets or autopistol and 1 clip, crossbow and 10 bolts or 5 throwing knives, chain coat or flak vest, aquila necklace, Ecclesiarchy robes (Good Quality Clothing), 4 candles, charm (skull), backpack.",
    startingRank: "Novice",
    homeworldRolls: { hiveWorld: "21–25", imperialWorld: "39–52", voidBorn: "26–35" },
    ranks: [
      rank("novice", "Novice", 1, "0–499"),
      rank("initiate", "Initiate", 2, "500–999"),
      rank("priest", "Priest", 3, "1,000–1,999"),
      rank("preacher", "Preacher", 4, "2,000–2,999"),
      rank("cleric", "Cleric", 5, "3,000–5,999"),
      rank("confessor", "Confessor", 6, "6,000–7,999", ["Confessor"]),
      rank("exorcist", "Exorcist", 6, "6,000–7,999", ["Exorcist"]),
      rank("bishop", "Bishop", 7, "8,000–9,999", ["Confessor"]),
      rank("zealot", "Zealot", 7, "8,000–9,999", ["Exorcist"]),
      rank("hierophant", "Hierophant", 8, "10,000–14,999", ["Confessor"]),
      rank("redemptionist", "Redemptionist", 8, "10,000–14,999", ["Exorcist"]),
    ],
  },
  {
    id: "guardsman",
    name: "Guardsman",
    source: SkillSource.CR,
    quote: "Life is war. And I’m gonna win!",
    attribution: "“Trench Head” Jones.",
    description:
      "Guardsmen are the fighters, killers and warriors of the 41st Millennium. Some may be members of a formal army, or even part of the Imperial Guard. Others may be nothing more than mercenaries and thugs. Some may even be convicted criminals, fitted with explosive collars and sentenced to serve in penal legions to pay for their terrible crimes. Needless to say, Guardsmen are neither particularly smart nor sociable. They more than make up for this with their ability to make things die in loud and unpleasant ways.",
    startingSkills: "Speak Language (Low Gothic) (Int), Drive (Ground Vehicle) (Ag) or Swim (S).",
    startingTalents:
      "Melee Weapon Training (Primitive), Pistol Training (Primitive) or Pistol Training (Las), Basic Weapons Training (Las), Basic Weapon Training (Primitive) or Basic Weapons Training (SP).",
    startingSkillGrants: [
      { options: [{ skillId: "speak-low-gothic" }] },
      { options: [{ skillId: "drive-ground" }, { skillId: "swim" }] },
    ],
    startingTalentGrants: [
      { options: [{ talentId: "melee-weapon-training", specialisation: "Primitive" }] },
      {
        options: [
          { talentId: "pistol-training", specialisation: "Primitive" },
          { talentId: "pistol-training", specialisation: "Las" },
        ],
      },
      { options: [{ talentId: "basic-weapon-training", specialisation: "Las" }] },
      {
        options: [
          { talentId: "basic-weapon-training", specialisation: "Primitive" },
          { talentId: "basic-weapon-training", specialisation: "SP" },
        ],
      },
    ],
    startingGear:
      "Sword or axe or hammer, intlock pistol and 12 shots or las pistol and 1 charge pack, lasgun and 1 charge pack, bow and 10 arrows or musket and 12 shots or shotgun and 12 shells, knife, guard flak armour, uniform or stealth gear or street clothes (Common Quality Clothing), 1 week corpse starch rations, mercenary licence or explosive collar (still attached) or Imperial Infantryman’s Uplifting Primer.",
    startingRank: "Conscript",
    homeworldRolls: { feralWorld: "31–80", hiveWorld: "26–35", imperialWorld: "53–65" },
    ranks: [
      rank("conscript", "Conscript", 1, "0–499"),
      rank("guard", "Guard", 2, "500–999"),
      rank("armsman", "Armsman", 3, "1,000–1,999"),
      rank("sergeant", "Sergeant", 4, "2,000–2,999"),
      rank("veteran", "Veteran", 5, "3,000–5,999"),
      rank("assault-veteran", "Assault Veteran", 6, "6,000–7,999", ["Assault Veteran"]),
      rank("lieutenant", "Lieutenant", 6, "6,000–7,999", ["Lieutenant"]),
      rank("scout", "Scout", 6, "6,000–7,999", ["Scout"]),
      rank("shock-trooper", "Shock Trooper", 7, "8,000–9,999", ["Assault Veteran"]),
      rank("captain", "Captain", 7, "8,000–9,999", ["Lieutenant"]),
      rank("marksman", "Marksman", 7, "8,000–9,999", ["Scout"]),
      rank("storm-trooper", "Storm Trooper", 8, "10,000–14,999", ["Assault Veteran"]),
      rank("commander", "Commander", 8, "10,000–14,999", ["Lieutenant"]),
      rank("sniper", "Sniper", 8, "10,000–14,999", ["Scout"]),
    ],
  },
  {
    id: "imperial-psyker",
    name: "Imperial Psyker",
    source: SkillSource.CR,
    quote:
      "I have stood within the palace of the Throne on Holy Terra itself. There my soul was shattered and re-formed, a living weapon forged on the Emperor’s will.",
    attribution: "Primary Psyker Thassail Kain.",
    description:
      "Psykers are otherworldly individuals with supernatural powers, they have many and varied abilities, from reading minds to throwing bolts of bio-electrical energy. These strange powers come with a terrible price however, for each psyker is a doorway to the hellish dimension of the immaterium, the abode of Daemons, psychic predators and worse. Each Imperial psyker risks his very soul every time he uses his abilities, knowing that the cold edge of a mercy blade is the kindest fate the Daemon-possessed can expect to meet.",
    startingPsychicPowers:
      "All starting Psykers begin with Psy Rating 1, providing a number of Minor Psychic Powers equal to one-half your Willpower Bonus (round up) from those described in Chapter VI: Psychic Powers.",
    startingSkills:
      "Speak Language (Low Gothic) (Int), Psyniscience (Per), Invocation (WP), Trade (Merchant) (Fel) or Trade (Soothsayer) (Fel), Literacy (Int).",
    startingTalents:
      "Melee Weapon Training (Primitive), Pistol Weapon Training (SP) or Pistol Weapon Training (Las), Psy Rating 1.",
    startingGear:
      "Axe or sword, staff, compact stub revolver and 3 bullets or compact las pistol and 1 charge pack, knife (psykana mercy blade), quilted vest, tatty robe (Poor Quality Clothing), book of Imperial saints or deck of cards or dice, Psy-Focus, sanctioning brand.",
    startingRank: "Sanctionite",
    homeworldRolls: {
      feralWorld: "81–90",
      hiveWorld: "36–40",
      imperialWorld: "66–79",
      voidBorn: "36–75",
    },
    traits: [
      {
        name: "Sanctioned Psyker",
        description:
          "You have been taken aboard the Black Ships to Holy Terra. There you have been sanctioned by agents of the Golden Throne through a variety of solemn, profound and very painful rituals designed to test the strength of your soul against the psychic predators of the warp. Roll on the Sanctioning Side Effects table to discover what mark this has left upon you. Your starting age is increased by 3d10 years; see page 30.",
      },
    ],
    specialTable: {
      title: "Sanctioning Side Effects",
      rows: [
        {
          result: "01–08",
          effect:
            "Reconstructed Skull: Some part of your sanctioning fractured your skull. Perhaps it was a form of psycho-surgery, instructive beating or blast of untrammelled power that split your head like a Malfian pus-grape. You have large metal plates in your head, some of which are clearly visible. Reduce your Intelligence by 3, but gain 5d10 Throne Gelt in compensation.",
        },
        {
          result: "09–14",
          effect:
            "Hunted: Your sanction-visions have induced a mild paranoia. You believe certain parts of your psyche, those amputated by the sanctioners, have gained sentience and are tracking you down. Whilst part of you realises that this is foolish, you still refuse to sit with your back to the door, just in case. Gain 1d10 Insanity Points.",
        },
        {
          result: "15–25",
          effect:
            "Unlovely Memories: Such was your sanctioning, that you visibly twitch and grimace whenever Holy Terra is mentioned. Gain 1d5 Insanity Points.",
        },
        {
          result: "26–35",
          effect:
            "The Horror, the Horror: Your hair is pure white, you occasionally gibber quietly to yourself and you endure terrible nightmares every night. Gain 1d5 Insanity Points.",
        },
        {
          result: "36–42",
          effect:
            "Pain through Nerve Induction: The skin on the back of your right hand is horribly scarred. You are uncomfortable around bald, robed women.",
        },
        {
          result: "43–49",
          effect:
            "Dental Probes: You no longer have any teeth in your head. Perhaps they were shattered, or removed, or simply fled your skull in protest at the psychic agony within. You have a set of carven dentures, formed from the teeth of dead pilgrims. They are of Good quality and, whilst they have inestimable sentimental value to you, on the open market they are worth approximately 50 Thrones.",
        },
        {
          result: "50–57",
          effect:
            "Optical Rupture: Your sanctioning rituals have done great violence to your eyes. They have been removed and replaced with Common quality cybernetic senses. See Chapter V: Armoury for more details on these.",
        },
        {
          result: "58–63",
          effect:
            "Screaming Devotions: Your ruined vocal cords have been replaced with a vox inducer. This thumb-sized implant gleams in the flesh of your neck. Other than granting you a rather mechanical timbre to your voice, this has no game effect.",
        },
        {
          result: "64–70",
          effect:
            "Irradiance: You have seen the true power of the Golden Throne. You have no hair anywhere upon your body, face or head.",
        },
        {
          result: "71–75",
          effect:
            "Tongue Bound: Your lips, gums and soft palate are tattooed with hexagrammatic wards. You must make a Hard (–20) Will Power Test to speak the names of the Ruinous Ones (Khorne, Tzeentch, Slaanesh and Nurgle). Additionally, you stutter terribly when speaking of daemons.",
        },
        {
          result: "76–88",
          effect:
            "Throne Wed: You cleave only unto the Emperor. You gain the Chem Geld talent, (see page 113) and a chattallium ring, worth 100 Thrones.",
        },
        {
          result: "89–94",
          effect:
            "Witch Prickling: Your body is covered in thousands of tiny scars. You have a thorough dislike of needles. Increase your Toughness by 3.",
        },
        {
          result: "95–00",
          effect:
            "Hypno-doctrination: Powerful conditioning causes you to chant the Litany of Protection in a whispered voice whenever you are asleep or unconscious. Increase your Willpower by 3.",
        },
      ],
    },
    ranks: [
      rank("sanctionite", "Sanctionite", 1, "0–499"),
      rank("neonate", "Neonate", 2, "500–999"),
      rank("aspirant", "Aspirant", 3, "1,000–1,999"),
      rank("savant-militant", "Savant Militant", 4, "2,000–2,999", ["Savant Militant"]),
      rank("scholar-materium", "Scholar Materium", 4, "2,000–2,999", ["Scholar Materium"]),
      rank("savant-warrant", "Savant Warrant", 5, "3,000–5,999", ["Savant Militant"]),
      rank("scholar-medicae", "Scholar Medicae", 5, "3,000–5,999", ["Scholar Materium"]),
      rank("lieutenant-savant", "Lieutenant-Savant", 6, "6,000–7,999", ["Savant Militant"]),
      rank("scholar-arcanum", "Scholar Arcanum", 6, "6,000–7,999", ["Scholar Materium"]),
      rank("savant-adjunct", "Savant Adjunct", 7, "8,000–9,999", ["Savant Militant"]),
      rank("scholar-obscurus", "Scholar Obscurus", 7, "8,000–9,999", ["Scholar Materium"]),
      rank("preceptor-savant", "Preceptor-Savant", 8, "10,000–14,999", ["Savant Militant"]),
      rank("scholar-empyrean", "Scholar Empyrean", 8, "10,000–14,999", ["Scholar Materium"]),
    ],
  },
  {
    id: "scum",
    name: "Scum",
    source: SkillSource.CR,
    quote: "Yeah, crime pays. Why else do you think I do it?",
    attribution: "“Verbal” Boze, Fenksworld Hive Ganger.",
    description:
      "Scum are the criminals, outcasts, conmen, gangers, thieves and desperados of the Imperium. They are the flotsam and jetsam of society. For all their dubious origins, they do have numerous skills that are highly useful for secretive, quasi-legal tasks. From picking locks to street stabbings, forgery and fencing illegal goods, Scum have what it takes to get dodgy things done. Whilst neither strong nor particularly tough, Scum are good at social skills, as well as being rather agile. Perfect for getting in and out of trouble.",
    startingSkills:
      "Speak Language (Low Gothic) (Int), Blather (Fel), Charm (Fel) or Dodge (Ag), Deceive (Fel), Awareness (Per), Common Lore (Imperium) (Int).",
    startingTalents:
      "Ambidextrous or Unremarkable, Melee Weapon Training (Primitive), Pistol Training (SP), Basic Weapon Training (SP).",
    startingGear:
      "Autogun and 1 clip or shotgun and 12 shells, autopistol and 1 clip, brass knuckles or club, knife, quilted vest or beast furs, street wear or rags or dirty coveralls (Poor Quality Clothing).",
    startingRank: "Dreg",
    homeworldRolls: {
      feralWorld: "91–00",
      hiveWorld: "41–89",
      imperialWorld: "80–90",
      voidBorn: "76–85",
    },
    ranks: [
      rank("dreg", "Dreg", 1, "0–499"),
      rank("outcast", "Outcast", 2, "500–999"),
      rank("outlaw", "Outlaw", 3, "1,000–1,999"),
      rank("renegade", "Renegade", 4, "2,000–2,999"),
      rank("rogue", "Rogue", 5, "3,000–5,999"),
      rank("cutter", "Cutter", 6, "6,000–7,999", ["Cutter"]),
      rank("fixer", "Fixer", 6, "6,000–7,999", ["Fixer"]),
      rank("stubjack", "Stubjack", 7, "8,000–9,999", ["Cutter"]),
      rank("shark", "Shark", 7, "8,000–9,999", ["Fixer"]),
      rank("gang-lord", "Gang Lord", 8, "10,000–14,999", ["Cutter"]),
      rank("charlatan", "Charlatan", 8, "10,000–14,999", ["Fixer"]),
    ],
  },
  {
    id: "tech-priest",
    name: "Tech-Priest",
    source: SkillSource.CR,
    quote:
      "I am a Child of the Omnissiah, cultist of the Machine God. The rites of manifold applications, the liturgies of ignition and the songs of Engine-seeing are mine own to know. I speak to the spirits of ancient tech-machines, from the warrior heart of a battle tank to the secret wisdom of the cogitator.",
    attribution: "Vox Servitor Th3ta, on behalf of Cult Mechanicus Adept Manuel.",
    description:
      "Tech-Priests are the guardians of machine-spirits and the preserver of the traditions of tech. They tend to incredibly arcane machines and learn many mysteries, such as the rites of ignition and the art of maintenance. As they learn of ancient science, they seek out lost technology, and also replace their frail flesh with gleaming steel or chattering circuitry.",
    startingSkills:
      "Speak Language (Low Gothic) (Int), Tech-Use (Int), Literacy (Int), Secret Tongue (Tech) (Int), Trade (Scrimshawer) (Ag) or Trade (Copyist) (Int).",
    startingTalents:
      "Melee Weapon Training (Primitive), Basic Weapon Training (Las), Pistol Training (Las), Electro Graft Use.",
    startingGear:
      "Metal staff, las pistol and 1 charge pack, las carbine and 1 charge pack, knife, flak vest, glow lamp, data-slate, Mechanicus robes and vestments (Good Quality Clothing), 1d10 spare parts (power cells, wires, chronometers etc), vial of Sacred Machine Oil.",
    startingRank: "Technographer",
    homeworldRolls: { hiveWorld: "90–00", imperialWorld: "91–00", voidBorn: "86–00" },
    traits: [
      {
        name: "Mechanicus Implants",
        description:
          "Over the course of many complicated rituals, you have been blessed and purified. You have been judged a suitable vessel for the following implants:",
        sections: [
          {
            title: "Electro-Graft",
            content:
              "This is a small port that is grafted into your nervous system. Once you have been properly trained, this will allow you to interface with machine data ports, and certain types of data nets. Electro-grafts can take many forms, such as electoos, skull shunts, finger probes or spine jacks.",
          },
          {
            title: "Electoo Inductors",
            content:
              "These are palm-sized metal skin grafts that appear much like tattoos to the uninitiated. The electoos are wired into your nervous system, where they derive power from the bio-electrical emanations of the flesh. They can be used to emit or siphon power in many ways. Electoo inductors can be any colour, and can appear anywhere on the body—though hands or mechadendrites are the usual sites.",
          },
          {
            title: "Respirator Unit",
            content:
              "This implant covers the lower half of your face with a network of grilles and tubing. It purifies your air supply, granting a +20% bonus to resist airborne toxins and gas weapons. The respirator unit also contains a vox-synthesiser capable of transmitting your voice in a variety of ways. Respirators can appear as simple grille units or intricate mask-like carvings.",
          },
          {
            title: "Cyber-Mantle",
            content:
              "This is a framework of metal, wires and impulse transmitters that is bolted on to your spine and lower ribcage. As you gain further implants, this mantle will act as a sub-dermal anchorage point. Amongst some servants of the Omnissiah, this cyber-mantle is often referred to as ‘the true flesh’. One would have to look beneath the red robes of a Tech-Priest to discover what a cyber-mantle looks like, and thus no one admits to having seen one.",
          },
          {
            title: "Potentia Coil",
            content:
              "Cradled within the cyber-mantle is a power unit known as the potentia coil. This mass can store energy and produce various types of fields. Coils come in many types, from small crystal stack affairs, to bulky electrical galvanitors salvaged from vehicle engines. Many a hunchback within the Adeptus Mechanicus is blamed upon a primitive coil.",
          },
          {
            title: "Cranial Circuitry",
            content:
              "This is a series of linked processors, implants and cortical circuits that augments your mental capacities. Most sit within housing bolted onto the skull, whilst others nestle within the brain itself. As you grow in the seriousness of your devotions, more and more of the brain that deals with useless things such as emotion and intuition can be scooped away to provide room for additional augmentations. Cranial circuits are often very crude-looking, and frequently rather aged.",
          },
        ],
      },
    ],
    ranks: [
      rank("technographer", "Technographer", 1, "0–499"),
      rank("mech-wright", "Mech-Wright", 2, "500–999"),
      rank("electro-priest", "Electro-Priest", 3, "1,000–1,999"),
      rank("enginseer", "Enginseer", 4, "2,000–2,999"),
      rank("tech-priest", "Tech-Priest", 5, "3,000–5,999"),
      rank("technomancer", "Technomancer", 6, "6,000–7,999", ["Technomancer"]),
      rank("mech-deacon", "Mech-Deacon", 6, "6,000–7,999", ["Mech-Deacon"]),
      rank("cyber-seer", "Cyber-Seer", 7, "8,000–9,999", ["Technomancer"]),
      rank("omniprophet", "Omniprophet", 7, "8,000–9,999", ["Mech-Deacon"]),
      rank("magos", "Magos", 8, "10,000–14,999", ["Technomancer"]),
      rank("magos-errant", "Magos Errant", 8, "10,000–14,999", ["Mech-Deacon"]),
    ],
  },
] as const;

export function findCareerByName(name?: string): CareerData | undefined {
  if (!name) return undefined;
  return CAREER_LIST.find((career) => career.name.toLowerCase() === name.toLowerCase());
}
