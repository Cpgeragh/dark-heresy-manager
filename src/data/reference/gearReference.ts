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

  // ── Book of Judgement — Gear ──────────────────────────────────────────────
  {
    id: "gene-printer",
    name: "Gene Printer",
    source: SkillSource.BoJ,
    description:
      "Backpack-sized device that confirms whether two biological samples (hair, skin, etc.) " +
      "come from the same person. Requires an Ordinary (+20) Tech-Use Test. " +
      "Complex genetic factors (twins, manipulation, xenos tampering) may interfere at GM's discretion.",
    weight: "15 kg",
    value: "1,500 Thrones",
    rarity: "Rare",
  },
  {
    id: "goreman-carta-sanguine",
    name: "Lord Marshal Goreman's Carta Sanguine",
    source: SkillSource.BoJ,
    description:
      "A bounty warrant issued by Lord Marshal Goreman. Permits the bearer to travel world to world " +
      "in pursuit of the named criminal and to carry locally permitted weapons. " +
      "Availability is Rare; base cost at least 100 Thrones. " +
      "Once the terms are met, redeem for ten times the original value.",
    weight: "0.1 kg",
    value: "100+ Thrones",
    rarity: "Rare",
  },
  {
    id: "lock-punch",
    name: "Lock-Punch",
    source: SkillSource.BoJ,
    description:
      "Two-handed cylinder with a salvaged grav-plate generator. Press against a lock and trigger " +
      "to destroy it (Challenging +0 Tech-Use Test). Works on doors AP 16 or less. " +
      "On 4+ Degrees of Failure, the device misfires and throws the user 2d10 metres (falling damage applies).",
    weight: "0.2 kg",
    value: "300 Thrones",
    rarity: "Scarce",
  },
  {
    id: "magnacles",
    name: "Magnacles",
    source: SkillSource.BoJ,
    description:
      "Magnetised handclamps that can be locked to lampposts, vehicles, or other metal surfaces. " +
      "All Tests to escape (Contortionist, Security, or Strength) take at least a Very Hard (–30) " +
      "penalty and take three times as long as normal.",
    weight: "1.5 kg",
    value: "120 Thrones",
    rarity: "Rare",
  },
  {
    id: "magnetic-harness",
    name: "Magnetic Harness",
    source: SkillSource.BoJ,
    description:
      "Multiple magnetic plates worn on the body. Each plate can be individually activated to hold " +
      "a weapon, piece of equipment, or even a suspect. " +
      "Bearer is treated as having the Quick Draw Talent for any item stored on the harness. " +
      "If Quick Draw is already possessed, stowing is also a Free Action.",
    weight: "10 kg",
    value: "500 Thrones",
    rarity: "Scarce",
  },
  {
    id: "pinner",
    name: "Pinner",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "5 kg",
    value: "2,000 Thrones",
    rarity: "Near Unique",
  },
  {
    id: "strait-cape",
    name: "Strait Cape",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "5 kg",
    value: "100 Thrones",
    rarity: "Scarce",
  },
  {
    id: "vertical-spindle-set",
    name: "Vertical Spindle Set",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "20 kg",
    value: "1,500 Thrones",
    rarity: "Rare",
  },
  {
    id: "vox-pickup",
    name: "Vox-Pickup",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "0.01 kg",
    value: "100 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "vox-privacy-field",
    name: "Vox-Privacy Field",
    source: SkillSource.BoJ,
    description:
      "Generates a dome of flickering blue light with a 10-foot radius that cannot be seen through " +
      "or eavesdropped upon. Offers no physical protection. " +
      "Usually mounted in a small handheld case or on a Servo-Skull.",
    weight: "1 kg",
    value: "500 Thrones",
    rarity: "Rare",
  },
  {
    id: "wall-eater",
    name: "Wall Eater",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "1 kg",
    value: "500 Thrones",
    rarity: "Very Rare",
  },

  // ── Book of Judgement — Drugs ─────────────────────────────────────────────
  {
    id: "drug-sandstone",
    name: "Sandstone (Drug)",
    source: SkillSource.BoJ,
    description:
      "Yellowish granules rubbed into the gums or injected. Lasts 1d5+3 hours. " +
      "Grants +30 to all Willpower-based Tests and +10 to resist Interrogation. " +
      "On wearing off, must pass a Difficult (–10) Toughness Test or gain 1 Fatigue.",
    weight: "—",
    value: "95 Thrones",
    rarity: "Scarce",
  },
  {
    id: "drug-clear",
    name: "Clear (Drug)",
    source: SkillSource.BoJ,
    description:
      "Tar-like bitter gum chewed to resist alcohol and common poisons. " +
      "Grants the Decadence Talent and +30 to Toughness-based Tests vs passing out or poison effects. " +
      "Causes a powerful migraine ~3 hours after use; user must refrain from strenuous work for 1d5 hours.",
    weight: "—",
    value: "110 Thrones",
    rarity: "Rare",
  },
  {
    id: "drug-eazille",
    name: "Eazille (Drug)",
    source: SkillSource.BoJ,
    description:
      "Powerful inhibition reducer, possibly alien in origin. Lasts 1d5 hours (+1 per dose taken that week). " +
      "User ignores moral constraints and must pass an Ordinary (+10) Willpower Test to resist baser instincts. " +
      "Repeated use increases effects permanently over time.",
    weight: "—",
    value: "230 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "drug-holdfast",
    name: "Holdfast (Drug)",
    source: SkillSource.BoJ,
    description:
      "Greasy bluish liquid injected to stiffen the mind. Lasts 2d5 hours. " +
      "Neurological drugs are at –30 to their normal effects, " +
      "but the user also suffers –20 to all Willpower-based Tests.",
    weight: "—",
    value: "165 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "drug-hyperexia",
    name: "Hyperexia (Drug)",
    source: SkillSource.BoJ,
    description:
      "Thickens skin to a rubbery texture. Must be taken at least a dozen times over as many days before it takes effect. " +
      "Grants Resistance (Cold, Heat) and inflicts 1 Fatigue. " +
      "One dose per week required to maintain the effect.",
    weight: "—",
    value: "80 Thrones",
    rarity: "Scarce",
  },
  {
    id: "drug-karrikian-red-eye",
    name: "Karrikian Red-Eye (Drug)",
    source: SkillSource.BoJ,
    description:
      "Extends vision into the infra-red spectrum. Lasts 1d5 hours. " +
      "+20 to Awareness Tests to detect heat-based images. " +
      "If used more than once per day, must pass a Difficult (–10) Toughness Test " +
      "or suffer –20 to all vision-based Tests for that day.",
    weight: "—",
    value: "185 Thrones",
    rarity: "Rare",
  },
  {
    id: "drug-leatherwort",
    name: "Leatherwort (Drug)",
    source: SkillSource.BoJ,
    description:
      "Dried fungal powder rubbed into skin. Treated areas count as having 2 additional AP " +
      "(stacks with regular armour) and user gains +10 to Toughness-based Tests. " +
      "Applied areas turn mottled dark green then slowly return to normal.",
    weight: "—",
    value: "115 Thrones",
    rarity: "Scarce",
  },
  {
    id: "drug-scav-glysten",
    name: "Scav-Glysten (Drug)",
    source: SkillSource.BoJ,
    description:
      "Injected chemical that eliminates all scent and pheromone output. Lasts 1d10 hours. " +
      "–30 to any tracking attempts by scent against the user. " +
      "Also grants Concealment and Shadowing when hiding from or tracking animals.",
    weight: "—",
    value: "155 Thrones",
    rarity: "Rare",
  },
  {
    id: "drug-scraper-ripper",
    name: "Scraper-Ripper (Drug)",
    source: SkillSource.BoJ,
    description:
      "Rendered underhive fish paste, injected or inhaled. Lasts 1d5 hours. " +
      "+30 to all Agility-based Tests, but user must pass a Hard (–20) Willpower Test " +
      "to avoid reacting violently when surprised by any stimuli.",
    weight: "—",
    value: "90 Thrones",
    rarity: "Scarce",
  },
  {
    id: "drug-sisk-ash",
    name: "Sisk Ash (Drug)",
    source: SkillSource.BoJ,
    description:
      "Burnt bush-plant mixed with lho and smoked. Lasts 1d5 hours. Induces calm; " +
      "user may need an Easy (+30) Willpower Test to perform reluctant tasks. " +
      "Pure (unmixed) version causes unconsciousness for 1 hour on a failed Hard (–20) Toughness Test. " +
      "Smoke also interferes with Cybermastiff scent-tracking.",
    weight: "—",
    value: "80 Thrones",
    rarity: "Scarce",
  },
  {
    id: "drug-truth-revealed",
    name: "The Truth Revealed (Drug)",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "—",
    value: "135 Thrones",
    rarity: "Rare",
  },
  {
    id: "drug-zumthorian-greyve",
    name: "Zumthorian Greyve (Drug)",
    source: SkillSource.BoJ,
    description: "No description available — consult the Book of Judgement.",
    weight: "—",
    value: "125 Thrones",
    rarity: "Rare",
  },

  // ── Book of Judgement — Cybernetics ───────────────────────────────────────
  {
    id: "constructer-interface",
    name: "Constructer Interface (Cybernetic)",
    source: SkillSource.BoJ,
    description:
      "Required to interface with Subrique-pattern Cyber-Mastiffs and Grapple-Hawks. At least Good Quality. " +
      "Allows silent Command Tests using Tech-Use in place of Command skill. " +
      "Uplinks up to 5 constructs; actively commands 2 (Best Quality: 3). " +
      "Full Action to upload a pattern: Defence (+10 WS), Restrain (+20 WS grapple), " +
      "Harass (+10 Dodge, Dodge Training), Alpha (+10 Per, Awareness Training), " +
      "Beta (+10 Per, Track Training), Pursuit (+1 AgB, Accustomed to Crowds).",
    weight: "—",
    value: "—",
    rarity: "—",
  },
  {
    id: "karrikian-lock-arm",
    name: "Karrikian Lock-Arm (Cybernetic)",
    source: SkillSource.BoJ,
    description:
      "Servo-enhanced augmetic arm. Treated as Unnatural Strength (×3) for grappling or restraining. " +
      "+20 Strength on melee attacks made with the arm. " +
      "Contains magnetic grapple stakes that brace against nearby supports to prevent the user being lifted " +
      "when restraining abnormally strong suspects.",
    weight: "—",
    value: "—",
    rarity: "—",
  },
  {
    id: "landrian-revealer",
    name: "Landrian Revealer (Cybernetic)",
    source: SkillSource.BoJ,
    description:
      "Ocular augmetic that allows the user to literally see scents and biological markers. " +
      "Grants Heightened Sense (Smell) and Talented (Tracking). " +
      "When blinded, may locate targets by smell with only –10 to BS/WS Tests. " +
      "Half Action to activate. Good Quality: no penalty when blinded. " +
      "Best Quality: also includes Photo-visor or Infra-red goggles.",
    weight: "—",
    value: "—",
    rarity: "—",
  },
  {
    id: "malfian-dermaguise",
    name: "Malfian Dermaguise (Cybernetic)",
    source: SkillSource.BoJ,
    description:
      "Electro-flexible plates beneath the skin linked to micro-servos, reshaping facial structure. " +
      "Requires 5 Rounds and a Challenging (+0) Tech-Use Test: +20 to Disguise (rising to +30 after healing). " +
      "Failed Test: 1 Tearing Damage per DoF (not reduced by Toughness). " +
      "3+ DoF: Hard (–20) Toughness Test or lose 1d5 Fellowship permanently. " +
      "Process can be shortened to 1 Round at –10 per Round reduced. Good Quality: also alters skin tone.",
    weight: "—",
    value: "—",
    rarity: "—",
  },

  // ── Blood of Martyrs ──────────────────────────────────────────────────────
  {
    id: "chaplet-ecclesiasticus",
    name: "Chaplet Ecclesiasticus",
    source: SkillSource.BoM,
    description:
      "When openly displayed, the bearer may re-roll any failed Charm Tests " +
      "made against members of the Ecclesiarchy of equal or lower status (GM's discretion).",
    weight: "1 kg",
    value: "1,000 Thrones",
    rarity: "Issued Only",
  },
  {
    id: "cilice",
    name: "Cilice",
    source: SkillSource.BoM,
    description:
      "+10 on Tests to resist Intimidation and other kinds of social manipulation. " +
      "Characters who wear a cilice for longer than twice their Toughness Bonus in hours " +
      "must make a Toughness Test or suffer 1 Level of Fatigue.",
    weight: "Varies",
    value: "Varies",
    rarity: "Rare",
  },
  {
    id: "dialogous-staff",
    name: "Dialogous Staff",
    source: SkillSource.BoM,
    description:
      "Fitted with a Laud Hailer and an audio recording device. " +
      "Sturdy enough to use in combat as a Staff. Grants +10 to understand sounds at a distance.",
    weight: "4 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "eikon",
    name: "Eikon",
    source: SkillSource.BoM,
    description:
      "No specific game effect.",
    weight: "—",
    value: "Varies",
    rarity: "Common",
  },
  {
    id: "hospitaller-medicae-tools",
    name: "Hospitaller Medicae Tools",
    source: SkillSource.BoM,
    description:
      "Contains sacred oils, unguents, surgical tools, sterilisers, 2 doses of De-tox, " +
      "and 2 doses of Stimm. The Sister Hospitaller may amputate a damaged limb with a " +
      "Hard (–10) Medicae Test. If successful, the patient loses the limb but all other " +
      "Critical Effects caused by damage to that limb are removed (including Fatigue and Blood Loss).",
    weight: "10 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "liber-heresius",
    name: "Liber Heresius",
    source: SkillSource.BoM,
    description:
      "+20 on Research Tests involving Forbidden Lore (Cults, Heresy). " +
      "Issued only to proven Witch Hunters.",
    weight: "10 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "litanies-of-faith",
    name: "Litanies of Faith",
    source: SkillSource.BoM,
    description:
      "A complete copy provides +20 on Research Tests involving Common Lore (Ecclesiarchy) " +
      "and Scholastic Lore (Imperial Creed). " +
      "Abridged versions (concentrating primarily on prayers) provide only +10.",
    weight: "10 kg",
    value: "500 Thrones",
    rarity: "Uncommon",
  },
  {
    id: "pilgrims-travel-staff",
    name: "Pilgrim's Travel Staff",
    source: SkillSource.BoM,
    description:
      "Can be used as a Staff in combat.",
    weight: "3 kg",
    value: "15 Thrones",
    rarity: "Common",
  },
  {
    id: "psyocculum",
    name: "Psyocculum",
    source: SkillSource.BoM,
    description:
      "Grants the Psyniscience Skill with a +20 bonus. " +
      "Can only detect psykers. Using the psyocculum requires a Full Action.",
    weight: "2 kg",
    value: "3,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "questing-pilgrim-badge",
    name: "Questing Pilgrim Badge",
    source: SkillSource.BoM,
    description:
      "No specific game effect.",
    weight: "—",
    value: "Varies",
    rarity: "Common",
  },
  {
    id: "reliquary",
    name: "Reliquary",
    source: SkillSource.BoM,
    description:
      "No specific game effect. Used to contain relics, charms, or holographic images of actual relics.",
    weight: "1 kg",
    value: "Varies",
    rarity: "Common",
  },
  {
    id: "ring-of-suffrage",
    name: "Ring of Suffrage",
    source: SkillSource.BoM,
    description:
      "Treated as a charm.",
    weight: "0 kg",
    value: "10 Thrones",
    rarity: "Rare",
  },
  {
    id: "rule-of-sororitas",
    name: "Rule of Sororitas",
    source: SkillSource.BoM,
    description:
      "+10 bonus to all Common Lore Tests on the subject of Ecclesiarchy, Heretics, " +
      "Mutants, or the Adepta Sororitas.",
    weight: "5 kg",
    value: "100 Thrones",
    rarity: "Rare",
  },
  {
    id: "sarissa",
    name: "Sarissa (Bolter Attachment)",
    source: SkillSource.BoM,
    description:
      "When mounted on a bolter, a sarissa counts as an axe in close combat.",
    weight: "+2 kg",
    value: "50 Thrones",
    rarity: "Rare",
  },
  {
    id: "sarissa-standalone",
    name: "Sarissa",
    source: SkillSource.BoM,
    description:
      "A long-bladed spear used by Ecclesiarchy warriors.",
    weight: "2 kg",
    value: "200 Thrones",
    rarity: "Rare",
  },
  {
    id: "seraphim-jump-pack",
    name: "Seraphim Jump Pack",
    source: SkillSource.BoM,
    description:
      "Requires Pilot (Jump Pack) skill and Sororitas Power Armour. " +
      "Allows a safe, guided fall from any height and any number of short jumps (Move Action; " +
      "must end by end of Turn). At maximal thrust, duplicates the Flyer (12) trait for a " +
      "number of Turns up to the character's Agility Bonus.",
    weight: "15 kg",
    value: "5,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "simulacrum-imperialis",
    name: "Simulacrum Imperialis",
    source: SkillSource.BoM,
    description:
      "Whenever a character within 20 metres spends a Fate Point, they immediately recover it " +
      "on a dice roll of 8, 9, or 10. Characters with more than 20 Corruption Points cannot " +
      "benefit from this effect.",
    weight: "10 kg",
    value: "—",
    rarity: "Issued Only",
  },
  {
    id: "witch-cage",
    name: "Witch Cage",
    source: SkillSource.BoM,
    description:
      "A psyker wearing a Witch Cage deducts 4 from their effective Psy Rating, " +
      "takes –40 to all Invocation Tests, and is considered Blind and Deaf.",
    weight: "15 kg",
    value: "4,000 Thrones",
    rarity: "Very Rare",
  },

  // ── Daemon Hunter — Gear ──────────────────────────────────────────────────
  {
    id: "dh-unguents-of-warding",
    name: "Unguents of Warding",
    source: SkillSource.DH,
    description:
      "Inscribe onto armour (10 min/location, Hard –20 Scholastic Lore Occult or Imperial Creed Test per location). " +
      "+20 to Fear Tests vs daemonic entities; +10 to WP Tests to resist psychic powers. " +
      "Wards last one month (GM may remove earlier if armour is soaked, burned, etc.).",
    weight: "—",
    value: "50 Thrones",
    rarity: "Common",
  },
  {
    id: "dh-consecrated-scrolls",
    name: "Consecrated Scrolls",
    source: SkillSource.DH,
    description:
      "One reroll on the Psychic Phenomena table. Single use — crumbles to dust after. " +
      "Must be prepared specifically for the bearer.",
    weight: "1 kg",
    value: "100 Thrones",
    rarity: "Scarce",
  },
  {
    id: "dh-grimoire-of-true-names",
    name: "Grimoire of True Names",
    source: SkillSource.DH,
    description:
      "Two successes on a Hard (–20) Forbidden Lore (Daemonology) Test (30 min per attempt) " +
      "reveals a notable daemon's True Name. Calling out portions of the True Name during attacks " +
      "allows auto-confirmation of Righteous Fury against that daemon. " +
      "Knowledge fades after 2d10+Intelligence Bonus days and must be re-studied.",
    weight: "10 kg",
    value: "5,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "dh-litany-micro-beads",
    name: "Litany Micro-Beads",
    source: SkillSource.DH,
    description:
      "Blessed vox-caster (1-mile range) broadcasts prayers over the micro-bead. " +
      "Three channels (Half Action to switch): " +
      "Catechism of Devotion and Sanctity (Chem-Geld talent benefit); " +
      "Prayers of St Drusus (Jaded talent benefit); " +
      "Petitions of Redemption (+10 WP to resist mind control). " +
      "Wearer is Deafened while not transmitting.",
    weight: "—",
    value: "100 Thrones",
    rarity: "Scarce",
  },
  {
    id: "dh-neural-scourge",
    name: "Neural Scourge",
    source: SkillSource.DH,
    description:
      "Metal gauntlet with burrowing wires. Requires Difficult (–10) Tech-Use or Challenging (+0) Medicae Test to use. " +
      "Target must be restrained or controlled. Grants +20 to Interrogation Tests against the subject. " +
      "If the subject wins the opposed Test, they take 1d5 Wounds ignoring Toughness Bonus.",
    weight: "2 kg",
    value: "1,700 Thrones",
    rarity: "Rare",
  },
  {
    id: "dh-psyocculum",
    name: "Psyocculum (Witch-Glasses)",
    source: SkillSource.DH,
    description:
      "Challenging (+10) Awareness Test reveals psykers and Warp-creatures in a corona of white light. " +
      "Grants Dark Sight for perceiving revealed psykers; +10 BS on single shots at revealed targets. " +
      "–20 to all other sight-based Awareness Tests while worn. " +
      "Using for more than one minute causes 1 Fatigue; cannot remove this fatigue while worn.",
    weight: "1.5 kg",
    value: "1,200 Thrones",
    rarity: "Rare",
  },
  {
    id: "dh-sacred-incense-burner",
    name: "Sacred Incense Burner",
    source: SkillSource.DH,
    description:
      "Daemons within 10m of the bearer suffer –10 WS and –10 to all Warp Instability Tests. " +
      "Can also be swung as a melee weapon (Flexible, Sanctified, 1d10+2 I — see Weapons tab).",
    weight: "3 kg",
    value: "800 Thrones",
    rarity: "Rare",
  },
  {
    id: "dh-soubirous-power-pack",
    name: "Soubirous Power Pack",
    source: SkillSource.DH,
    description:
      "A lasgun charge blessed at the eternal flame of the Shrine of Soubirous. " +
      "Renders the las-weapon Sanctified for its remaining charges. " +
      "Creatures with Warp Instability must Test after taking any damage from the weapon. " +
      "Cannot be recharged once blessed. Single use.",
    weight: "—",
    value: "150 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "dh-ulumeathi-plasma-siphon",
    name: "Ulumeathi Plasma Siphon",
    source: SkillSource.DH,
    description:
      "Crystal arrangement of unknown origin. Anyone firing a plasma weapon at a target within 10m, " +
      "or firing a plasma weapon from within 10m, suffers –30 BS. " +
      "Plasma weapons affected also lose the Volatile quality.",
    weight: "10 kg",
    value: "8,000 Thrones",
    rarity: "Near Unique",
  },

  // Drugs
  {
    id: "dh-dreamjuice",
    name: "Dreamjuice (Drug)",
    source: SkillSource.DH,
    description:
      "+10 to all Intelligence Tests for 30 minutes. " +
      "–20 to all Willpower Tests while under effect. " +
      "After the effect wears off: –10 to all Perception Tests. Not physically addictive.",
    weight: "—",
    value: "75 Thrones",
    rarity: "Scarce",
  },
  {
    id: "dh-imperiums-fervour",
    name: "Imperium's Fervour (Drug)",
    source: SkillSource.DH,
    description:
      "Lasts 24 hours (12 hours if taken orally). " +
      "Fear Tests reduced by one degree of severity. Insanity Points gained are reduced by 2 (minimum 1). " +
      "–10 to Perception Tests while active. " +
      "Memories of events during effect become hazy — Hard (–20) Intelligence Test to recall; Very Hard after one month.",
    weight: "—",
    value: "20 Thrones",
    rarity: "Scarce",
  },

  // Force Fields
  {
    id: "dh-refraction-bracer",
    name: "Refraction Bracer (Force Field, PR 30)",
    source: SkillSource.DH,
    description:
      "Protection Rating 30. Provides a shield-like wall of force protecting body and arms only — " +
      "head and legs are unprotected. Does not function against area attacks.",
    weight: "0.3 kg",
    value: "5,000 Thrones",
    rarity: "Rare",
  },
  {
    id: "dh-refraction-field-brontian",
    name: "Refraction Field, Brontian Pattern (Force Field, PR 30)",
    source: SkillSource.DH,
    description:
      "Protection Rating 30. Standard refraction field. " +
      "Ordo Malleus agents treat availability as Rare (instead of Very Rare) and reduce cost by 25%.",
    weight: "0.4 kg",
    value: "15,000 Thrones",
    rarity: "Very Rare",
  },
  {
    id: "dh-jokaerian-field",
    name: "Jokaerian Field (Force Field, PR 70)",
    source: SkillSource.DH,
    description:
      "Protection Rating 70 — but functions only against psychic attacks " +
      "(including friendly ones originating more than 5m away). " +
      "Also deals 1d10 damage ignoring Armour and Toughness Bonus to any creature with the Daemonic trait " +
      "that passes or remains within 5m of the user. Jokaero-modified Imperial technology.",
    weight: "0.5 kg",
    value: "50,000 Thrones",
    rarity: "Near Unique",
  },

];
