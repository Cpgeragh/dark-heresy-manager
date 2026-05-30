// src/data/reference/cyberneticsReference.ts
// Reference data for cybernetic implants from the Core Rulebook.
// Each entry stores separate descriptions per craftsmanship quality.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CyberneticWeapon {
  type: "ranged" | "melee";
  /** Display name shown on the Weapons tab */
  name: string;
  class?: string;
  range?: string;
  rof?: string;
  damage: string;
  pen: string;
  clip?: string;
  rld?: string;
  specialRules?: string;
}

export interface CyberneticRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Cost listed is for Common craftsmanship */
  value: string;
  rarity: string;
  /** General rules that apply regardless of craftsmanship */
  notes?: string;
  /** Rules at Poor craftsmanship */
  poor?: string;
  /** Rules at Common craftsmanship */
  common?: string;
  /** Rules at Good craftsmanship */
  good?: string;
  /** If set, a location selection step is shown when installing */
  requiresLocation?: "arm" | "leg";
  /** Weapon capability granted by this implant */
  weapon?: CyberneticWeapon;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export const CYBERNETICS_REFERENCE: CyberneticRef[] = [

  // ── Core Rulebook ─────────────────────────────────────────────────────────

  {
    id: "cr-bionic-arm",
    name: "Bionic Arm",
    source: SkillSource.CR,
    value: "1,000 Thrones",
    rarity: "Scarce",
    requiresLocation: "arm",
    notes:
      "Adds +2 to Toughness Bonus against hits to the arm location. Replacement limbs can only " +
      "be used to perform tasks the character already knows how to do. Bonuses apply only to " +
      "tests made using the bionic limb; two bionic arms do not double the bonus.",
    poor:
      "Uses half the owner's Agility score for matters of fine dexterity. " +
      "Weapon Skill and Ballistic Skill Tests take a –10 penalty when using the limb.",
    common:
      "Mirrors the function of a human arm exactly, retaining strength, dexterity and sense of touch.",
    good:
      "Provides a +10 bonus to Agility Tests requiring delicate manipulation (such as Sleight of Hand) " +
      "and adds a +10 bonus to Strength Tests using the arm.",
  },

  {
    id: "cr-bionic-locomotion",
    name: "Bionic Locomotion",
    source: SkillSource.CR,
    value: "1,500 Thrones",
    rarity: "Scarce",
    requiresLocation: "leg",
    notes:
      "Covers legs, hips, pelvis, etc. Must be fully integrated into the spine and nervous system. " +
      "Adds +2 to Toughness Bonus against hits to the leg locations.",
    poor:
      "Halves the character's Movement Rates (round up). Characters that attempt to run must succeed " +
      "on an Agility Test or fall at the end of their movement.",
    common:
      "Accomplishes full integration without any loss of function over the human norm.",
    good:
      "Grants the Sprint talent. Adds a +20 bonus to Athletics Tests made to jump or leap.",
  },

  {
    id: "cr-bionic-respiratory-system",
    name: "Bionic Respiratory System",
    source: SkillSource.CR,
    value: "800 Thrones",
    rarity: "Rare",
    notes:
      "Mimics the action of human lungs. Common and above grants a +20 bonus to Toughness Tests " +
      "made to resist airborne toxins and gas weapons.",
    poor:
      "Same +20 bonus to resist airborne toxins as Common. However, the system is raucously loud " +
      "and the character takes a –20 penalty to all Silent Move checks. All tests involving strenuous " +
      "physical activity are increased by one level of Difficulty.",
    common:
      "Grants a +20 bonus to Toughness Tests made to resist airborne toxins and gas weapons.",
    good:
      "Counts as a full life support system — if the user's own respiratory system fails, the bionic " +
      "lungs will keep their blood oxygenated. Their presence may be unnoticeable if designed to be so.",
  },

  {
    id: "cr-auger-arrays",
    name: "Auger Arrays",
    source: SkillSource.CR,
    value: "1,000 Thrones",
    rarity: "Rare",
    notes:
      "Implanted devices duplicating the effects of special sensors. Use requires concentration and a Half Action.",
    poor:
      "Possesses only a single detection ability (either heat, radiation or electromagnetics) " +
      "and only functions within 20 metres.",
    common:
      "Functions identically to a standard auspex.",
    good:
      "Functions as a full auspex and allows re-rolls on all Perception-based Tests when using its functions.",
  },

  {
    id: "cr-ballistic-mechadendrite",
    name: "Ballistic Mechadendrite",
    source: SkillSource.CR,
    value: "600 Thrones",
    rarity: "Adeptus Mechanicus Only",
    notes:
      "Solid, shoulder-mounted two-metre mechadendrite with a built-in laspistol of Adeptus Mechanicus design. " +
      "Counts as a laspistol with the Compact upgrade. As a Reaction, the Tech-Priest may fire it as an off-hand " +
      "weapon with no penalties to hit. Has no optical targeting facilities. " +
      "Requires the Mechadendrite Use talent to operate. All mechadendrites are Good craftsmanship unless noted.",
    common:
      "All mechadendrites are considered Good craftsmanship by default.",
    good:
      "Standard quality for mechadendrites. Fires as a Compact laspistol and may be used as a Reaction " +
      "with no off-hand penalty.",
    weapon: {
      type: "ranged",
      name: "Laspistol (Compact)",
      class: "Pistol",
      range: "30m",
      rof: "S/2/–",
      damage: "1d10+2 E",
      pen: "0",
      clip: "30",
      rld: "Full",
      specialRules: "Compact",
    },
  },

  {
    id: "cr-cortex-implants",
    name: "Cortex Implants",
    source: SkillSource.CR,
    value: "5,000 Thrones",
    rarity: "Very Rare",
    notes:
      "Used to repair a severely damaged brain or augment its abilities.",
    poor:
      "Restores brain function but destroys the personality and memories of the subject, " +
      "effectively making them a servitor. Unsuitable for player characters.",
    common:
      "Restores paralysed and brain-damaged individuals. Results in a permanent loss of 1d10 points from " +
      "Weapon Skill, Ballistic Skill, Agility, Intelligence and Fellowship. The character also gains 1d10 Insanity Points.",
    good:
      "Extremely rare even among the Mechanicus (costs ten times the usual rare item cost). " +
      "Grants the trait Unnatural Intelligence (×2) and performs all functions of a cogitator system. " +
      "The character gains 1d10 Insanity Points.",
  },

  {
    id: "cr-cybernetic-senses",
    name: "Cybernetic Senses",
    source: SkillSource.CR,
    value: "2,250 Thrones",
    rarity: "Rare",
    notes:
      "Sight, hearing, touch, taste or more esoteric senses may be duplicated artificially. " +
      "Good cyber-eyes may incorporate telescopic sights, a photo-visor, and/or Dark Sight. " +
      "Good cybernetic hearing may include an internal micro-bead. Each extra upgrade counts as a separate implant.",
    poor:
      "Troublesome limitations (hearing plagued by static, vision glitching or monochrome, etc.). " +
      "The character takes a –20 penalty to Tests made involving the cybernetic sense.",
    common:
      "Usually obviously artificial and often oversized, but adequately duplicates the human range of senses. No further game effects.",
    good:
      "Grants the Heightened Senses talent for that sense, and a +20 bonus to Tests made to resist " +
      "attacks on the sense (deafening noises, blinding flashes, etc.).",
  },

  {
    id: "cr-manipulator-mechadendrite",
    name: "Manipulator Mechadendrite",
    source: SkillSource.CR,
    value: "500 Thrones",
    rarity: "Adeptus Mechanicus Only",
    notes:
      "Powerful shoulder-mounted mechadendrite of fire-hardened ceramite and steel, extending to 1.5m. " +
      "Grants +20 to Strength Tests. Tipped with crushing pincers that can tether the user as a Free Action. " +
      "May be used as a Primitive weapon dealing 1d5+2 Impact damage. " +
      "Cannot perform fine manipulation. Requires Mechadendrite Use talent. All mechadendrites are Good craftsmanship unless noted.",
    common:
      "All mechadendrites are considered Good craftsmanship by default.",
    good:
      "Standard quality for mechadendrites. Grants +20 to Strength Tests; pincers deal 1d5+2 I.",
    weapon: {
      type: "melee",
      name: "Crushing Pincers",
      class: "Melee",
      damage: "1d5+2 I",
      pen: "0",
      specialRules: "Primitive",
    },
  },

  {
    id: "cr-medicae-mechadendrite",
    name: "Medicae Mechadendrite",
    source: SkillSource.CR,
    value: "500 Thrones",
    rarity: "Adeptus Mechanicus Only",
    notes:
      "Two-metre flexible limb granting +10 to Medicae Tests. Houses six injector pistons (doses must be supplied separately). " +
      "Flesh staplers can staunch Blood Loss as a Half Action. Small chainscalpel reduces limb amputation to Challenging (+0) " +
      "and deals 1d5 Rending damage as an improvised weapon. Grants +10 to Interrogation Tests. " +
      "May be shoulder or sternum-mounted. Requires Mechadendrite Use talent. All mechadendrites are Good craftsmanship unless noted.",
    common:
      "All mechadendrites are considered Good craftsmanship by default.",
    good:
      "Standard quality for mechadendrites. Grants +10 Medicae, +10 Interrogation, 6 injector pistons, and chainscalpel.",
    weapon: {
      type: "melee",
      name: "Chainscalpel",
      class: "Melee",
      damage: "1d5 R",
      pen: "2",
    },
  },

  {
    id: "cr-mind-impulse-unit",
    name: "Mind Impulse Unit",
    source: SkillSource.CR,
    value: "1,750 Thrones",
    rarity: "Rare",
    notes:
      "Also known as a sense-link. Allows direct interface with machines and technological devices. " +
      "Basic or crude MIU involves a single spinal or cortex connector; advanced variants add wrist connectors and mechadendrite probes.",
    poor:
      "Requires a successful Willpower Test to use and imposes a –10 penalty to interact with machine spirits.",
    common:
      "Imposes no modifiers to machine spirit communication. Adds +10 to Tech-Use, Pilot or Drive Tests " +
      "used in conjunction with MIU-capable devices.",
    good:
      "Grants +10 to communicate with machine spirits, and +10 to Tech-Use, Pilot, Drive, Logic, Inquiry " +
      "and Weapon Skill Tests when interfaced with MIU systems.",
  },

  {
    id: "cr-optical-mechadendrite",
    name: "Optical Mechadendrite",
    source: SkillSource.CR,
    value: "400 Thrones",
    rarity: "Adeptus Mechanicus Only",
    notes:
      "Highly flexible, camera-studded mechadendrite extending to 3m (reduces to pencil-width). " +
      "Grants +10 to all Perception-based Tests. Allows microscopic examination. " +
      "May be used as a telescopic sight. Fitted with infra-red torch and sensors — no penalties in darkness " +
      "and +20 to vision-based Perception Tests at night. Fitted with a tinted light. " +
      "May be shoulder or sternum-mounted. Requires Mechadendrite Use talent. All mechadendrites are Good craftsmanship unless noted.",
    common:
      "All mechadendrites are considered Good craftsmanship by default.",
    good:
      "Standard quality for mechadendrites. Grants +10 Perception, no darkness penalties, +20 to night vision Tests.",
  },

  {
    id: "cr-utility-mechadendrite",
    name: "Utility Mechadendrite",
    source: SkillSource.CR,
    value: "500 Thrones",
    rarity: "Adeptus Mechanicus Only",
    notes:
      "Two-metre limb housing a variety of tools. Counts as a combi-tool, granting +10 to all Tech-Use Tests. " +
      "Houses six injector pistons for sacred machine oil (must be supplied separately). " +
      "Contains an electrically powered censer — blasts incense smoke (one per 15 minutes) imposing –5 WS to all " +
      "living creatures within 2m for one Round (Half Action). Censer active: +10 to Perception Tests relying on smell to detect the Tech-Priest. " +
      "Contains a cutting blade counting as a knife with Defensive quality and mono upgrade. " +
      "Requires Mechadendrite Use talent. All mechadendrites are Good craftsmanship unless noted.",
    common:
      "All mechadendrites are considered Good craftsmanship by default.",
    good:
      "Standard quality for mechadendrites. Grants +10 Tech-Use, combi-tool, censer, and mono knife.",
    weapon: {
      type: "melee",
      name: "Mono Knife",
      class: "Melee",
      damage: "1d5-2 I",
      pen: "2",
      specialRules: "Defensive, Mono",
    },
  },

  // ── Book of Judgement ─────────────────────────────────────────────────────

  {
    id: "boj-constructer-interface",
    name: "Constructer Interface",
    source: SkillSource.BoJ,
    value: "—",
    rarity: "—",
    notes:
      "Required to interface with Subrique-pattern Cyber-Mastiffs and Grapple-Hawks. " +
      "Allows silent Command Tests using Tech-Use in place of Command skill. " +
      "Uplinks up to 5 constructs; actively commands 2. " +
      "Full Action to upload a pattern: Defence (+10 WS), Restrain (+20 WS grapple), " +
      "Harass (+10 Dodge, Dodge Training), Alpha (+10 Per, Awareness Training), " +
      "Beta (+10 Per, Track Training), Pursuit (+1 AgB, Accustomed to Crowds).",
    good: "Can actively command 3 constructs instead of 2.",
  },

  {
    id: "boj-karrikian-lock-arm",
    name: "Karrikian Lock-Arm",
    source: SkillSource.BoJ,
    value: "—",
    rarity: "—",
    requiresLocation: "arm",
    notes:
      "Servo-enhanced augmetic arm. Treated as Unnatural Strength (×3) for grappling or restraining. " +
      "+20 Strength on melee attacks made with the arm. " +
      "Contains magnetic grapple stakes that brace against nearby supports to prevent the user " +
      "being lifted when restraining abnormally strong suspects.",
  },

  {
    id: "boj-landrian-revealer",
    name: "Landrian Revealer",
    source: SkillSource.BoJ,
    value: "—",
    rarity: "—",
    notes:
      "Ocular augmetic that allows the user to literally see scents and biological markers. " +
      "Grants Heightened Sense (Smell) and Talented (Tracking). " +
      "When blinded, may locate targets by smell with only –10 to BS/WS Tests. " +
      "Half Action to activate.",
    good: "No penalty when blinded. Also includes Photo-visor or Infra-red goggles.",
  },

  // ── Lost Dataslate ────────────────────────────────────────────────────────

  {
    id: "ld-cranial-armour",
    name: "Cranial Armour",
    source: SkillSource.LD,
    value: "600 Thrones",
    rarity: "Rare",
    notes:
      "Inserted just beneath the skin. Adds +1 AP to the head location, stacking with other armour " +
      "and Talents that provide Armour Points (such as The Flesh is Weak).",
    poor:
      "Crude and obvious. Permanently reduces the user's Fellowship by 1d10.",
    common:
      "Adds +1 AP to the head, stacking with all other sources of head protection.",
    good:
      "Adds an additional +1 AP to the head (total of +2).",
  },

  {
    id: "ld-synthmuscle-graft",
    name: "Synthmuscle Graft",
    source: SkillSource.LD,
    value: "2,000 Thrones",
    rarity: "Very Rare",
    notes:
      "Dense vat-grown muscle tissue augmented with flakweave, implanted into existing muscle tissue.",
    common:
      "Grants +1 to the user's Strength Bonus.",
    good:
      "Grants the Unnatural Strength (×2) Trait, but imposes a –10 penalty to all Agility Tests " +
      "due to the misshapen nature of the body.",
  },

  {
    id: "boj-malfian-dermaguise",
    name: "Malfian Dermaguise",
    source: SkillSource.BoJ,
    value: "—",
    rarity: "—",
    notes:
      "Electro-flexible plates beneath the skin linked to micro-servos, reshaping facial structure. " +
      "Requires 5 Rounds and a Challenging (+0) Tech-Use Test: +20 to Disguise (rising to +30 after healing). " +
      "Failed Test: 1 Tearing Damage per DoF (not reduced by Toughness). " +
      "3+ DoF: Hard (–20) Toughness Test or lose 1d5 Fellowship permanently. " +
      "Process can be shortened to 1 Round at –10 per Round reduced.",
    good: "Also alters skin tone in addition to facial structure.",
  },
];
