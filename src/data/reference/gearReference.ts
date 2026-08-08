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
  availability: string;
}

// ─── Gear Reference ──────────────────────────────────────────────────────────

export const GEAR_REFERENCE: GearRef[] = [
  // ── Core Rulebook — Clothing & Personal Items ─────────────────────────────

  {
    id: "cr-backpack",
    name: "Backpack",
    source: SkillSource.CR,
    description:
      "A personal carrying device, usually a bag with attached straps. Can carry approximately 50 kilograms.",
    weight: "1 kg",
    value: "10 Thrones",
    availability: "Plentiful",
  },
  {
    id: "cr-cameleoline-cloak",
    name: "Cameleoline Cloak",
    source: SkillSource.CR,
    description:
      "Made of mimic fibres that blend the wearer's colouration into their surroundings. " +
      "Grants a +20 bonus to Concealment Tests. If the wearer remains stationary, he counts as " +
      "being at Extreme Range when targeted by ranged weapons.",
    weight: "0.5 kg",
    value: "500 Thrones",
    availability: "Rare",
  },
  {
    id: "cr-charm",
    name: "Charm",
    source: SkillSource.CR,
    description:
      "A keepsake, holy relic or good luck token intended to draw the benevolent eye of the Emperor. " +
      "No tangible game benefits. However, when the adventure calls for something bad to happen to a " +
      "random character, at the GM's discretion a character with a charm will be exempt.",
    weight: "—",
    value: "Variable",
    availability: "Average",
  },
  {
    id: "cr-chrono",
    name: "Chrono",
    source: SkillSource.CR,
    description: "A hand-held or wrist-worn timepiece, generally dependable and simple to use.",
    weight: "—",
    value: "40 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-clip-drop-harness",
    name: "Clip/Drop Harness",
    source: SkillSource.CR,
    description:
      "A compact spool-stored safety line with a magnetic or hooked clasp, ideal for safety on " +
      "rooftops or rappelling. A character using a clip harness to descend a vertical surface gains " +
      "a +30 bonus to Climb Tests and cannot fall if he fails.",
    weight: "2 kg",
    value: "25 Thrones",
    availability: "Common",
  },
  {
    id: "cr-clothing",
    name: "Clothing",
    source: SkillSource.CR,
    description:
      "Practical street wear, military uniform, religious garb or any other attire. " +
      "Cost varies from a few Thrones for basic rags up to thousands for exquisite attire.",
    weight: "—",
    value: "Variable",
    availability: "Abundant",
  },
  {
    id: "cr-explosive-collar",
    name: "Explosive Collar",
    source: SkillSource.CR,
    description:
      "Most often attached to penal legionnaires as an additional incentive. Comes with a remote " +
      "trigger (up to 1,000m range). When detonated, instantly kills the wearer and inflicts " +
      "1d10 Explosive Damage on anyone within three metres. Removing the collar without the trigger " +
      "requires a Hard (–20) Tech-Use Test; a serious or worse failure causes it to explode.",
    weight: "1 kg",
    value: "55 Thrones",
    availability: "Rare",
  },
  {
    id: "cr-filtration-plugs",
    name: "Filtration Plugs",
    source: SkillSource.CR,
    description:
      "Simple plugs worn in each nostril to screen out most pollutants and harmful gases. " +
      "Grants a +20 bonus to any Toughness Test made to resist the effects of gas.",
    weight: "—",
    value: "15 Thrones",
    availability: "Common",
  },
  {
    id: "cr-infra-red-goggles",
    name: "Infra-Red Goggles",
    source: SkillSource.CR,
    description:
      "Allows the wearer to see thermal images from warm bodies, revealing hiding enemies. " +
      "The wearer suffers no penalties due to darkness and gains a +20 bonus to vision-based " +
      "Perception Tests at night. Advanced models can be disguised as simple eyeglasses.",
    weight: "0.5 kg",
    value: "275 Thrones",
    availability: "Rare",
  },
  {
    id: "cr-photo-visors",
    name: "Photo-Visors/Contacts",
    source: SkillSource.CR,
    description:
      "Advanced lenses that enhance low-level light — users can see in the dark almost as well as " +
      "in daylight. Characters wearing these gain the Dark Sight trait. " +
      "Good Quality visors also make the wearer immune to the effects of photon ash grenades.",
    weight: "0.5 kg",
    value: "100 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-re-breather",
    name: "Re-Breather",
    source: SkillSource.CR,
    description:
      "A mask or helmet with its own air supply, designed to preserve the user in even the most " +
      "toxic atmospheres. The wearer is immune to the effects of gases and can even survive " +
      "underwater. Air canisters last about one hour then must be replaced (Full Action). " +
      "Replacement canisters cost 25 Thrones and are Scarce.",
    weight: "1 kg",
    value: "50 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-recoil-glove",
    name: "Recoil Glove",
    source: SkillSource.CR,
    description:
      "Interlocking plates connected with memory wire that lock into a rigid strut around the " +
      "hand and wrist when gripping a weapon. A character using a recoil glove can fire a Basic " +
      "weapon with one hand without the normal –20 penalty. In addition, Pistol weapons that " +
      "require two hands can be used one-handed without penalty.",
    weight: "0.5 kg",
    value: "85 Thrones",
    availability: "Common",
  },
  {
    id: "cr-respirator",
    name: "Respirator/Gas Mask",
    source: SkillSource.CR,
    description:
      "A breathing mask that covers the nose and mouth or entire face, offering much better " +
      "protection than filtration plugs. A character wearing a respirator or gas mask gains a " +
      "+30 bonus to Toughness Tests made to resist the effects of gas, and may re-roll failed results.",
    weight: "0.5 kg",
    value: "25 Thrones",
    availability: "Average",
  },
  {
    id: "cr-void-suit",
    name: "Void Suit",
    source: SkillSource.CR,
    description:
      "A sealed suit intended to preserve the wearer in the most hostile environments. " +
      "Incorporates a re-breather and allows the wearer to survive in vacuum.",
    weight: "8 kg",
    value: "100 Thrones",
    availability: "Plentiful",
  },
  {
    id: "cr-synskin",
    name: "Synskin",
    source: SkillSource.CR,
    description:
      "A bio-reactive bodyglove with an inert non-reactive surface that moulds itself to the " +
      "wearer's form. Adds 2 Armour Points to all locations and grants a +10 bonus to Concealment " +
      "and Silent Move Tests. Renders the wearer invisible to the effects of infra-red goggles " +
      "and Dark Sight.",
    weight: "2 kg",
    value: "2,500 Thrones",
    availability: "Very Rare",
  },

  // ── Core Rulebook — Tools ─────────────────────────────────────────────────

  {
    id: "cr-auspex",
    name: "Auspex/Scanner",
    source: SkillSource.CR,
    description:
      "Used to detect energy emissions, motion and biological life signs. Grants a +20 bonus to " +
      "Awareness Tests. A Tech-Use Test allows detection of things not normally detectable " +
      "(invisible gases, bio-signs, ambient radiation). Standard range 50m; walls more than 50cm " +
      "thick and certain shielding materials can block the scanner.",
    weight: "0.5 kg",
    value: "145 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-auto-quill",
    name: "Auto Quill",
    source: SkillSource.CR,
    description:
      "An arcane-looking scribing device that allows the user to copy text at an impressive rate " +
      "with great accuracy. A character with the Trade (Copyist) skill gains +10 to their Skill Tests.",
    weight: "—",
    value: "55 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-combi-tool",
    name: "Combi-tool",
    source: SkillSource.CR,
    description:
      "A versatile mechanical device commonly found in the hands of the Adeptus Mechanicus. " +
      "Grants a +10 bonus to Tech-Use Tests.",
    weight: "1 kg",
    value: "200 Thrones",
    availability: "Rare",
  },
  {
    id: "cr-data-slate",
    name: "Data-slate",
    source: SkillSource.CR,
    description:
      "The primary means of storing and reading printed text, video or audio in the Imperium. " +
      "Some contain only a single media recording; others can re-record, transmit and receive data " +
      "from other devices.",
    weight: "0.5 kg",
    value: "25 Thrones",
    availability: "Common",
  },
  {
    id: "cr-demolition-charge",
    name: "Demolition Charge",
    source: SkillSource.CR,
    description:
      "A simple explosive device used for blowing open doors, breaching walls and destroying " +
      "bridges. Cost and weight represent 1 kg of explosives; charges can be rigged together for " +
      "greater effect. When detonated: 3d10 Explosive Damage plus +2 per kilogram used. " +
      "Blast radius = kilograms used × 5 metres.",
    weight: "1 kg",
    value: "250 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-excruciator-kit",
    name: "Excruciator Kit",
    source: SkillSource.CR,
    description:
      "An array of blades, needles, chemicals, drugs, thermal prongs and neural links used in " +
      "the questioning of captured enemies. Grants a +20 bonus to all Interrogation Tests.",
    weight: "1 kg",
    value: "375 Thrones",
    availability: "Very Rare",
  },
  {
    id: "cr-glow-globe",
    name: "Glow-globe/Lamp Pack",
    source: SkillSource.CR,
    description:
      "A common source of light, able to illuminate an area a dozen or more metres in diameter. " +
      "Lasts 1d5 hours before needing to be recharged or have its power cell replaced.",
    weight: "0.5 kg",
    value: "15 Thrones",
    availability: "Abundant",
  },
  {
    id: "cr-grapnel",
    name: "Grapnel",
    source: SkillSource.CR,
    description:
      "Fires a hooked or magnetic grapnel connected to 100m of thin but strong wire. Once attached, " +
      "the user can manually climb the line or activate a powered winch. Can also be used as a crude " +
      "projectile weapon, counting as a single-shot crossbow.",
    weight: "2 kg",
    value: "30 Thrones",
    availability: "Common",
  },
  {
    id: "cr-lascutter",
    name: "Lascutter",
    source: SkillSource.CR,
    description:
      "A short-range device that emits an intense laser beam, capable of cutting through rock, " +
      "steel and armour plate. Can cut through or weld shut 10 cm of metal per Turn. " +
      "Too unwieldy to be used in combat.",
    weight: "4 kg",
    value: "65 Thrones",
    availability: "Average",
  },
  {
    id: "cr-magnoculars",
    name: "Magnoculars",
    source: SkillSource.CR,
    description:
      "Powerful vision aids that magnify distant objects. Advanced models can provide range " +
      "read-outs, detect heat sources, calculate target location positioning and take image " +
      "snapshots for later analysis.",
    weight: "0.5 kg",
    value: "55 Thrones",
    availability: "Average",
  },
  {
    id: "cr-manacles",
    name: "Manacles",
    source: SkillSource.CR,
    description:
      "Solid restraints often used by bounty hunters and enforcers, and equally found in the " +
      "hands of more nefarious individuals for darker purposes.",
    weight: "1 kg",
    value: "35 Thrones",
    availability: "Plentiful",
  },
  {
    id: "cr-micro-bead",
    name: "Micro-bead",
    source: SkillSource.CR,
    description:
      "A short-range communication device worn in the ear, good out to about one kilometre. " +
      "Bad weather, dense terrain and intervening rock or plasteel can greatly reduce this range.",
    weight: "—",
    value: "20 Thrones",
    availability: "Average",
  },
  {
    id: "cr-multikey",
    name: "Multikey",
    source: SkillSource.CR,
    description:
      "Can open most standard Imperial locks — not a standard item for honest Imperial citizens. " +
      "Grants a +30 bonus to any Security Test when trying to open locks.",
    weight: "—",
    value: "150 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-pict-recorder",
    name: "Pict Recorder",
    source: SkillSource.CR,
    description:
      "A live-media recording device, some with holographic capabilities. Most allow for playback " +
      "as well as recording.",
    weight: "1 kg",
    value: "100 Thrones",
    availability: "Average",
  },
  {
    id: "cr-psy-focus",
    name: "Psy-focus",
    source: SkillSource.CR,
    description:
      "A device used by psykers to focus their powers — sacred bones, carved wyth staves, blessed " +
      "icons or crystals. When a Psyker with a Psy-focus makes an Invocation Test, he gains a " +
      "+10 bonus.",
    weight: "—",
    value: "100 Thrones",
    availability: "Rare",
  },
  {
    id: "cr-screamers",
    name: "Screamers",
    source: SkillSource.CR,
    description:
      "Proximity alarms that detect motion or sound (depending on the model). Requires a Tech-Use " +
      "Test to set (GM rolls secretly). Once set, has a Perception of 75 for detecting sounds or " +
      "motions. If triggered, sounds an alarm audible up to one kilometre away.",
    weight: "2 kg",
    value: "140 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-stummers",
    name: "Stummers",
    source: SkillSource.CR,
    description:
      "Generate sound waves to cancel out ambient sounds and noises made by moving personnel. " +
      "Grants a +30 bonus to Silent Move Tests. Has enough power for 20 minutes of continuous use " +
      "before needing to be recharged (approximately one hour).",
    weight: "2 kg",
    value: "25 Thrones",
    availability: "Average",
  },
  {
    id: "cr-vox-caster",
    name: "Vox-caster",
    source: SkillSource.CR,
    description:
      "A communication device capable of sending signals over great distances, including to ships " +
      "in orbit from a planet's surface. Using a vox to receive or transmit requires a successful " +
      "Ordinary (+10) Tech-Use Test.",
    weight: "4 kg",
    value: "300 Thrones",
    availability: "Scarce",
  },
  {
    id: "cr-writing-kit",
    name: "Writing Kit",
    source: SkillSource.CR,
    description: "Contains papers, inks and quills.",
    weight: "2 kg",
    value: "20 Thrones",
    availability: "Common",
  },

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
    availability: "Rare",
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
    value: "100 Thrones",
    availability: "Rare",
  },
  {
    id: "lock-punch",
    name: "Lock-Punch",
    source: SkillSource.BoJ,
    description:
      "Two-handed cylinder with a salvaged grav-plate generator. Press against a lock and trigger " +
      "to destroy it (Challenging +0 Tech-Use Test). Works on doors AP 16 or less. " +
      "On 4+ Degrees of Failure, the device misfires and throws the user 2d10 metres (falling damage applies). " +
      "Good/Best Craftsmanship versions misfire on 5/6 Degrees of Failure respectively. " +
      "Poor Craftsmanship imposes -10 to Tech-Use Tests.",
    weight: "0.2 kg",
    value: "300 Thrones",
    availability: "Scarce",
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
    availability: "Rare",
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
    availability: "Scarce",
  },
  {
    id: "pinner",
    name: "Pinner",
    source: SkillSource.BoJ,
    description:
      "Coil-generator that emits a charged fluctuating mag-field, affecting all magnetic devices " +
      "within 30 metres for 2d10 Rounds, supercharging them. Separating any activated magnet from " +
      "its attached surface requires a Hellish (–60) Strength Test. " +
      "Good/Best Craftsmanship increase the radius by 5 m / 10 m. Poor Craftsmanship reduces it by 10 m.",
    weight: "5 kg",
    value: "2,000 Thrones",
    availability: "Near Unique",
  },
  {
    id: "strait-cape",
    name: "Strait Cape",
    source: SkillSource.BoJ,
    description:
      "A heavy sack of strong synthetic canvas thrown over a suspect. Limbs are pulled through " +
      "holes and immobilised with internal chains; an attached hood provides a blindfold, gag, and " +
      "earmuffs. All Tests to escape (Contortionist, Security, or Strength) are at a Very Hard (–30) " +
      "penalty and take five times as long. The captive cannot use any Skill or Talent requiring " +
      "sight, sound, voice, limbs, or hands.",
    weight: "5 kg",
    value: "100 Thrones",
    availability: "Scarce",
  },
  {
    id: "vertical-spindle-set",
    name: "Vertical Spindle Set",
    source: SkillSource.BoJ,
    description:
      "Reinforced gloves and boots connected to a central back unit via feed-lines. Electro-magnets " +
      "in the plates activate on contact with ferromagnetic surfaces, allowing the wearer to climb " +
      "them at 25% normal speed without the Climb Skill — even upside down. Imposes –5 to Silent " +
      "Move Tests. Plates can detach to lower the user up to 50 m on adamantium-weave monoline. " +
      "Good: compressor launchers fire plates at distant surfaces (Half Action, Challenging +0 BS). " +
      "Best: monofibre hairs allow climbing any surface. Poor: no detachable plates or monoline.",
    weight: "20 kg",
    value: "1,500 Thrones",
    availability: "Rare",
  },
  {
    id: "vox-pickup",
    name: "Vox-Pickup",
    source: SkillSource.BoJ,
    description:
      "A black box no larger than a child's thumb-joint. Eavesdrops on all conversation within " +
      "10 metres — records up to 100 hours or transmits in short secure bursts to a waiting receiver. " +
      "Activating is a Full Action; no Tech-Use Test required. Detecting a planted vox-pickup requires " +
      "an Opposed Search Test pitting the searcher's Search against the planter's Intelligence.",
    weight: "0.01 kg",
    value: "100 Thrones",
    availability: "Very Rare",
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
    availability: "Rare",
  },
  {
    id: "wall-eater",
    name: "Wall Eater",
    source: SkillSource.BoJ,
    description:
      "An insectoid creature the size of a thumb that generates an acid harmless to flesh but " +
      "corrosive to stone and metal. Squeeze its thorax to force acid through its mandibles onto a " +
      "surface. One creature generates enough acid to draw a 2-metre line, eating through up to 30 cm " +
      "of adamantium before dissipating. Takes one week to replenish its acid reserves. Must be kept " +
      "in wooden, bone, or ivory cages. No craftsmanship variants exist.",
    weight: "1 kg",
    value: "500 Thrones",
    availability: "Very Rare",
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
    availability: "Issued Only",
  },
  {
    id: "cilice",
    name: "Cilice",
    source: SkillSource.BoM,
    description:
      "+10 on Willpower Tests to resist Fear, Charm, Intimidation, and other kinds of social manipulation. " +
      "Characters who wear a cilice for longer than twice their Toughness Bonus in hours " +
      "must make a Toughness Test or suffer 1 Level of Fatigue.",
    weight: "Varies",
    value: "Varies",
    availability: "Rare",
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
    availability: "Issued Only",
  },
  {
    id: "eikon",
    name: "Eikon",
    source: SkillSource.BoM,
    description: "No specific game effect.",
    weight: "—",
    value: "Varies",
    availability: "Common",
  },
  {
    id: "hospitaller-medicae-tools",
    name: "Hospitaller Medicae Tools",
    source: SkillSource.BoM,
    description:
      "Counts as a medkit, 2 doses of De-tox, and 2 doses of Stimm. " +
      "The Sister Hospitaller may amputate a damaged limb with a Hard (–10) Medicae Test. " +
      "If successful, the patient loses the limb but all Critical Effects caused by damage to that limb are removed " +
      "(including Fatigue and Blood Loss), and may (GM discretion) heal 1d5 wounds suffered in the loss of the limb.",
    weight: "10 kg",
    value: "—",
    availability: "Issued Only",
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
    availability: "Issued Only",
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
    availability: "Uncommon",
  },
  {
    id: "pilgrims-travel-staff",
    name: "Pilgrim's Travel Staff",
    source: SkillSource.BoM,
    description: "Can be used as a Staff in combat.",
    weight: "3 kg",
    value: "15 Thrones",
    availability: "Common",
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
    availability: "Very Rare",
  },
  {
    id: "questing-pilgrim-badge",
    name: "Questing Pilgrim Badge",
    source: SkillSource.BoM,
    description: "No specific game effect.",
    weight: "—",
    value: "Varies",
    availability: "Common",
  },
  {
    id: "reliquary",
    name: "Reliquary",
    source: SkillSource.BoM,
    description:
      "No specific game effect. Used to contain relics, charms, or holographic images of actual relics.",
    weight: "1 kg",
    value: "Varies",
    availability: "Common",
  },
  {
    id: "ring-of-suffrage",
    name: "Ring of Suffrage",
    source: SkillSource.BoM,
    description: "Treated as a charm.",
    weight: "0 kg",
    value: "10 Thrones",
    availability: "Rare",
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
    availability: "Rare",
  },
  {
    id: "sarissa",
    name: "Sarissa (Bolter Attachment)",
    source: SkillSource.BoM,
    description: "When mounted on a bolter, a sarissa counts as an axe in close combat.",
    weight: "+2 kg",
    value: "50 Thrones",
    availability: "Rare",
  },
  {
    id: "sarissa-standalone",
    name: "Sarissa",
    source: SkillSource.BoM,
    description:
      "A heavy spiked blade; when not mounted on a bolter, counts as an axe in close combat.",
    weight: "2 kg",
    value: "200 Thrones",
    availability: "Rare",
  },
  {
    id: "seraphim-jump-pack",
    name: "Seraphim Jump Pack",
    source: SkillSource.BoM,
    description:
      "Requires Pilot (Jump Pack) skill and Sororitas Power Armour. " +
      "Allows a safe, guided fall from any height. Short jumps double the character's Base Movement action " +
      "and must end by the end of her Turn. At maximal thrust, duplicates the Flyer (12) trait for up to " +
      "one minute before the turbines require one minute to cool.",
    weight: "15 kg",
    value: "5,000 Thrones",
    availability: "Very Rare",
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
    availability: "Issued Only",
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
    availability: "Very Rare",
  },

  // ── Daemon Hunter — Gear ──────────────────────────────────────────────────
  {
    id: "dh-unguents-of-warding",
    name: "Unguents of Warding",
    source: SkillSource.DH,
    description:
      "Inscribe onto armour (10 min/location, Hard –20 Scholastic Lore Occult or Imperial Creed Test per location). " +
      "A single pot is enough to ward one armour location. " +
      "+20 to Fear Tests vs daemonic entities; +10 to WP Tests to resist psychic powers. " +
      "Wards last one month (GM may remove earlier if armour is soaked, burned, etc.).",
    weight: "—",
    value: "50 Thrones",
    availability: "Common",
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
    availability: "Scarce",
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
    availability: "Very Rare",
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
    availability: "Scarce",
  },
  {
    id: "dh-neural-scourge",
    name: "Neural Scourge",
    source: SkillSource.DH,
    description:
      "Metal gauntlet with burrowing wires. Requires Difficult (–10) Tech-Use or Challenging (+0) Medicae Test to use. " +
      "Target must be restrained or controlled. Failure on the use Test deals 1d5 Wounds ignoring Toughness Bonus. " +
      "Once activated, grants +20 to opposed Interrogation Tests against the subject. " +
      "If the subject wins the opposed Test, they take 1d5 Damage ignoring Toughness Bonus.",
    weight: "2 kg",
    value: "1,700 Thrones",
    availability: "Rare",
  },
  {
    id: "dh-psyocculum",
    name: "Psyocculum (Witch-Glasses)",
    source: SkillSource.DH,
    description:
      "Challenging (+10) Awareness Test reveals psykers and Warp-creatures in a corona of white light. " +
      "Grants Dark Sight for perceiving revealed psykers/Warp-creatures; +10 BS on single shots at revealed targets. " +
      "–20 to all other sight-based Awareness Tests while worn. " +
      "Using for more than one minute causes 1 Fatigue; cannot remove this fatigue while worn.",
    weight: "1.5 kg",
    value: "1,200 Thrones",
    availability: "Rare",
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
    availability: "Very Rare",
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
    availability: "Near Unique",
  },

  // ── Lathe Worlds ─────────────────────────────────────────────────────────

  {
    id: "lw-core-gel",
    name: "Core-Gel",
    source: SkillSource.LW,
    description:
      "A transparent, viscous and highly conductive material that acts as a surrogate for Electoo-Inducers " +
      "and MIU links. Allows a character to access machinery that would otherwise require an Electro-Graft " +
      "or MIU interface, even without those implants. Decays quickly — must be cleaned away and reapplied " +
      "every hour. Each canister contains enough for two applications.",
    weight: "—",
    value: "500 Thrones",
    availability: "Rare",
  },

  {
    id: "lw-scatter-caster",
    name: "Scatter-Caster",
    source: SkillSource.LW,
    description:
      "Also known as binary bombs or cant grenades. A heavy generator that pumps out discordant frequencies, " +
      "lingua technis gibberish, and invalid scrapcode across a wide area. Range 25m: anyone with Mechanicus " +
      "Implants suffers –10 to all Tests while within range. Giving orders to servitors, Servo-Skulls, and " +
      "other familiars imposes a –50 penalty to all control Tests. " +
      "Good Quality: range 50m. Best Quality: range 100m.",
    weight: "10 kg",
    value: "450 Thrones",
    availability: "Rare",
  },

  // ── Lost Dataslate ────────────────────────────────────────────────────────

  {
    id: "ld-dark-mask",
    name: "Dark Mask",
    source: SkillSource.LD,
    description:
      "A rare substance known as Dark Mask or Lacuna dust, darker than the void itself. " +
      "Applied to anything — weapons, clothing, bare skin. When hiding in shadow or low-light, " +
      "grants +60 to Concealment Tests. Scanning equipment (e.g. auspex) can only locate a coated " +
      "target with a Very Hard (–30) Tech-Use Test. One canister covers a standard-sized human " +
      "plus clothing and basic equipment.",
    weight: "—",
    value: "450 Thrones",
    availability: "Very Rare",
  },

  {
    id: "ld-luma-crete",
    name: "Luma-Crete",
    source: SkillSource.LD,
    description:
      "A chemical compound injected at several points in the body, turning flesh a glowing dullish grey " +
      "and hardening it against punishment. Grants The Flesh is Weak equal to half the character's Toughness Bonus " +
      "(round up), the Resistance (Heat) Trait, and a +10 bonus to Tests made to resist radiation. " +
      "Effects last 1d5 hours; when they wear off, the character gains 1d5 levels of Fatigue.",
    weight: "—",
    value: "600 Thrones",
    availability: "Very Rare",
  },

  // ── Inquisitor's Handbook ────────────────────────────────────────────────
  {
    id: "ih-braid-cloak",
    name: "Braid Cloak",
    source: SkillSource.IH,
    description:
      "The hunters of Fedrid rarely go tracking without wearing a braid cloak. The cloak is made from the tough hide of a large herbivorous creature, called the Ungorth, which has evolved a tough hide to repel the sharp claws of its predators. The braid cloak is worn by hunters to protect against similar attacks, as the predators that fall from the trees on Fedrid are not particularly choosy about what they attack. Hunters often incorporate vines, leaves and other vegetation for camouflage. Outside of the Fedrid jungles, the cloak’s value is somewhat lessened.\n\nA braid cloak grants a +10 bonus on Concealment Tests when worn in forest or jungle terrain. In addition, the cloak grants 1 Armour Point to the Body. The protection provided counts as Primitive.",
    weight: "2 kg",
    value: "80 Thrones",
    availability: "Uncommon",
  },
  {
    id: "ih-caltrop",
    name: "Caltrop",
    source: SkillSource.IH,
    description:
      "The caltrop is a small, four-pointed spike, left on the ground for intended targets to step upon. Fervious caltrops are often coated in the venom of the feared Fervious serpent. Should the target step on the caltrops, they face a prolonged and agonising death unless anti-venom is nearby.\n\nCaltrops are sold in quantities enough to blanket a two metre by two metre area.\n\nAnyone walking on Fervious caltrops without at least 1 Armour Point on their feet counts as being hit by a weapon with the Toxic special quality. In addition, those walking across caltrops must succeed on a Difficult (−10) Agility Test. A success halves movement, while a failed Test quarters movement. The reduced speed lasts until the victim receives medical treatment.",
    weight: "0.1 kg",
    value: "6 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-capsican-trap",
    name: "Capsican Trap",
    source: SkillSource.IH,
    description:
      "Used on the feral world of Monrass to break up the masses of soldiers used in the battles between its rival empires, these primitive land mines are surprisingly effective devices. Simply made from fragile clay pots and filled with a mixture of spine-thorns, lamp oil and spay-burner grubs (an indigenous insect filled with a pyretic acid), the mines are placed in a shallow-dug hole and covered with a thin layer of earth. When stood upon, the pot breaks causing the victim to be gouged by the spine-thorns and rupturing the spay-burner’s bloated bodies, causing severe and painful acid burns, and igniting their clothing with sticky, burning ichor. Feral regiments raised for the Imperial Guard from Monrass have taken this weapon with them, even going so far as to take breeding nests of burner grubs with them on campaign, much to their Munitorum quartermasters’ dismay.\n\nAnyone stepping on a Capsican Trap must make a Difficult (−10) Agility Test. Failure indicates that they have set it off, causing 1D10 E Damage to their legs. A second, Challenging (+0), Agility Test determines if the victim has also caught on fire.",
    weight: "3 kg",
    value: "20 Thrones",
    availability: "Uncommon",
  },
  {
    id: "ih-feral-healers-kit",
    name: "Feral Healer’s Kit",
    source: SkillSource.IH,
    description:
      "On feral worlds, healers rely upon herbs, poultices and other primitive methods to tend to their patients. A typical kit will contain the following: seep moss to staunch bleeding, stitch-ticks to close wounds, sleep bark to numb pain, splints and soft leather bandages, bone tweezers and flint knife, and a heavy cosh for untreatable cases.",
    weight: "2 kg",
    value: "50 Thrones",
    availability: "Average",
  },
  {
    id: "ih-feudal-healers-kit",
    name: "Feudal Healer’s Kit",
    source: SkillSource.IH,
    description:
      "On feudal worlds, there is usually a modicum of medical theory and surgical techniques, often taught by secretive guilds or academic schools. Occasionally there are folk practitioners using ancient wisdom and common sense, however, most of these are usually burnt as witches. A typical healer’s kit would contains the following items: leeches to staunch bleeding, needle and thread to close wounds, alchemical tincture to numb pain, cloth bandages, splints and plaster, metal scalpel, probes, clamps and pliers, saw for amputations and a stout leather apron to stop the stains.",
    weight: "3 kg",
    value: "100 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-glo-slug-of-dusk",
    name: "Glo-slug of Dusk",
    source: SkillSource.IH,
    description:
      "In the foetid swamps of Dusk swim the glo-slugs, brown and black gastropods of an unremarkable nature. Like much of Dusk’s native fauna, the slugs are carnivorous and spend their lives searching for dead creatures to slime over and digest. However, when removed from the water, the slug’s skin emanates a phosphorous white glow. Placing two or more slugs together dramatically increases the illumination. The inhabitants of Dusk place three or four slugs together in a jar to give off a very bright light to help them illuminate the marshy hunting grounds.\n\nEach slug illuminates a one metre radius area. The light from multiple glo-slugs is cumulative, so two will shed light out to two metres, three to three metres, and so on.\n\nThis natural light source can prove useful in numerous situations where there is no power or where null-fields have been installed, preventing torches and other illuminating devices from working.",
    weight: "0.1 kg",
    value: "8 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-hunting-musk",
    name: "Hunting Musk",
    source: SkillSource.IH,
    description:
      "Tribal hunters are all too aware of the acute senses of their prey. Accordingly, many smear themselves with stench-laden pastes to disguise their natural body odour. Made from all manner of foulness (on which it is best not to dwell), nevertheless, such pastes are a useful tool. Creatures that rely on smell to detect their prey take a −20 penalty on Perception Tests made to detect characters wearing hunting musk. An application of hunting musk lasts for 1d10 hours.",
    weight: "0.2 kg",
    value: "20 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-kill-stick",
    name: "Kill Stick",
    source: SkillSource.IH,
    description:
      "Volonx kill sticks are used in booby traps and consist of a sharpened stick made from bamboo or mono-plastics. They work best when employed in groups, often based within a hidden pit or trench. Anyone stepping into an area of kill sticks must succeed on an Agility Test or take 1d10+2 R points of Damage.",
    weight: "0.3 kg",
    value: "1 Thrones",
    availability: "Common",
  },
  {
    id: "ih-powder-bomb",
    name: "Powder Bomb",
    source: SkillSource.IH,
    description:
      "Created by the death cults of Fervious, an ignited powder bomb unleashes a white powder throughout a 30-metre radius. The powder reduces visibility and the pollens used to make the powder are toxic to humans. Inhaling the powder is rarely lethal. However, it will inflame the eyes, nose and throat, and induces serious nausea, all of which takes a good few hours to clear.\n\nThe cloud of powder disperses at a rate appropriate to the environmental conditions. A strong wind clears the area in 1 Round. Indoors, the powder settles after 2d10 Rounds.\n\nPowder bombs are Thrown weapons with a Range of 10m and have the Smoke quality. Those caught within the blast must Test Toughness or gain one level of Fatigue.",
    weight: "1.5 kg",
    value: "17 Thrones",
    availability: "Uncommon",
  },
  {
    id: "ih-skeleton-key",
    name: "Skeleton Key",
    source: SkillSource.IH,
    description:
      "On feudal worlds, the locks of many castles (and sometimes whole towns) have been designed so that one master key, known as the skeleton key, can open them. Given that most primitive locks operate on the same basic mechanism, those who wish easy ingress often keep a collection of such keys on hand.",
    weight: "0.1 kg",
    value: "24 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-skem-net",
    name: "Skem Net",
    source: SkillSource.IH,
    description:
      "A skem net is made from strips of plant stem harvested from the poisonous skem plant. A typical net is usually six metres square. The stem of the skem plant is notoriously hardy and so the net can actually be packed up quite tight, to about the size of a man’s balled fist. On Volonx, hunters launch the net with the aid of an arrow. The net is coated in skem poison that causes anyone unfortunate enough to be caught in it to be sent into anaphylactic shock unless the antidote is administered within ten minutes. This also means that the owner of the net must always use gloves and avoid skin contact when repacking it.\n\nUse the Toxic and Snare rules when the net is deployed.",
    weight: "3 kg",
    value: "85 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-sleep-dust",
    name: "Sleep Dust",
    source: SkillSource.IH,
    description:
      "Harvested on Zillman’s Domain, the apothecaries found that crushing the seeds of an innocuous red and black flowered plant created a potent soporific powder. Inhaling the dust would drop a full-grown human in a matter of minutes and allow them to sleep dreamlessly for hours. Apart from feeling slightly drowsy for another couple hours afterwards, there are no other short- or long-term effects. The powder is tasteless and is often administered by being stirred into food.\n\nInhaling or ingesting sleep dust forces a character to make a Difficult (−10) Toughness Test or 1d10 minutes later fall into a deep sleep for 1d5−TB hours.",
    weight: "0.5 kg",
    value: "100 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-smoke-flare",
    name: "Smoke Flare",
    source: SkillSource.IH,
    description:
      "Fedrid smoke flares are made from the hollowed-out spines of a native cactus-like plant. The spines are filled with white cotton that, when lit, gives off a high yield of thick black, acrid smoke over an area of up to 40 metres. The smoke disperses at a rate appropriate to the environmental conditions. A strong wind clears the area in 1d5 Rounds; indoors, the smoke clears after 2d10 minutes.",
    weight: "0.4 kg",
    value: "12 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-soul-mask",
    name: "Soul Mask",
    source: SkillSource.IH,
    description:
      "These ornate, bizarre and often frightening masks are employed by the native hunters of Fedrid as a sinister form of defence. Soaked in the blood of beasts (and some say ritually murdered rivals), these outsized masks are worn on the back with the common belief that the trapped soul within will flinch with anticipation if danger stalks up behind the wearer. Unsurprisingly these macabre items of “primitive art” grace the walls of many a private study on Scintilla and elsewhere and fetch high prices. The stories of strange hauntings, bloody histories and native curses clinging to such masks only adds to the frisson of owning one for some.",
    weight: "1 kg",
    value: "200 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-sour-mud",
    name: "Sour Mud",
    source: SkillSource.IH,
    description:
      "The substance known as sour mud is found on the beds of dormant tar pits on the feral world Endrite. It is used by shamans and witch doctors for healing and can be used in poultices, placed directly onto a wound to staunch bleeding or even diluted with hot water and ingested to reduce fevers—although it is said to taste foul!\n\nStudies show the putty-like substance is rich in minerals and contains strong anti-bacterial agents. Rumours abound of an interested corporation wishing to build a large industrial complex on the tar pits to harvest and export the substance off-world.\n\nA medic using sour mud gains a +10 bonus on Medicae Tests when treating diseases and fevers and may use the substance to stop Blood Loss as a Full Action.",
    weight: "3 kg",
    value: "45 Thrones",
    availability: "Uncommon",
  },
  {
    id: "ih-spark-rocks",
    name: "Spark Rocks (2)",
    source: SkillSource.IH,
    description:
      "Spark rocks are small white crystals that work like flint and steel. Striking the rocks together creates sparks. Creating the sparks over tinder, such as animal hair, wood shavings or dried dung, makes a flame that can be nursed into a campfire or used to light a torch. Spark rocks can even be used when wet.\n\nIt is best not to store the rocks together as even the slightest contact can produce sparks. Inexperienced users have been known to set their packs alight by keeping two or more spark rocks in the same bag.",
    weight: "1 kg",
    value: "2 Thrones",
    availability: "Common",
  },
  {
    id: "ih-spine-pick",
    name: "Spine Pick",
    source: SkillSource.IH,
    description:
      "Spine picks are useful tools created from the tough spikes that protrude from the hide of the Gar-keeler, a giant porcupine-like creature that inhabits the jungles of the frontier world Faldon Kise in the Malfian sub-sector. Once the creature is slaughtered and its spines removed, the base of the spines are bevelled into a crude handle, leaving the sharp spike tip in place.\n\nThe pick can be used as a basic, improvised weapon. However, its primary role is that of a climbing aid. A spine pick grants a +10 bonus on all Climb Tests.",
    weight: "1 kg",
    value: "25 Thrones",
    availability: "Uncommon",
  },
  {
    id: "ih-stink-bomb",
    name: "Stink Bomb",
    source: SkillSource.IH,
    description:
      "These are used on a variety of primitive worlds, although the most renowned are those from the planet of Munsk. Created by collecting the faeces of a large worm-like creature, the excrement is then mixed with virulent pollen from the yellow-petalled plant known locally as the “dung-bloom” for its distinctive odour. The mixture is then balled up and encased in a dried mud shell. Once the fragile mud-shell is cracked an intolerable stench is released (an eight metre diameter per bomb). Most humans will not be able to stand the odour and must vacate the area or experience severe nausea and even loss of consciousness if they suffer prolonged exposure.\n\nAnyone exposed to a stink bomb must succeed on a Toughness Test each Round or gain one level of Fatigue.",
    weight: "1 kg",
    value: "6 Thrones",
    availability: "Common",
  },
  {
    id: "ih-syckle-oil",
    name: "Syckle Oil",
    source: SkillSource.IH,
    description:
      "Made from linn seeds found only on the feral world of Tygress V, syckle oil can be used on any metal blade. The oil coats the blade giving it a bright sheen and making the metal all but frictionless. It will also prevent rust and tarnishing. Weaponsmiths use the oil on simple mechanisms, such as flintlock triggers, to prevent them jamming.\n\nApplying syckle oil to a bladed melee weapon or primitive firearm allows the user to re-roll any failed Test that would result in it being broken or Jammed. An application of the oil lasts for 1d10+4 attacks with the weapon or 12 hours, whichever comes first.",
    weight: "0.5 kg",
    value: "12 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-axe-rake",
    name: "Axe-Rake",
    source: SkillSource.IH,
    description:
      "A heavy multi-purpose tool, common to hive smelteries, foundries and work crews. The axe-rake is taken almost universally to symbolise labour and the manual workforce of the hive in the Calixis Sector. The axe-rake is frequently rendered as an icon both in industrial architecture and guild livery on most hive worlds. The genuine article can also make for a handy weapon in skilled hands.\n\nThe axe-rake grants a +10 bonus to Climb Tests, as well as on Tests made to force doors or locks open. It can also be used as a melee weapon, dealing 1d10+2 I or R Damage with the Primitive and Unbalanced qualities.",
    weight: "4 kg",
    value: "20 Thrones",
    availability: "Abundant",
  },
  {
    id: "ih-cognomen",
    name: "Cognomen",
    source: SkillSource.IH,
    description:
      "“Cognomen” is the official Administratum designation in the Calixis Sector for a hiver’s identity card. In a hive, it is one of the only viable means of tracking, taxing and identifying the citizenry. Cognomen are usually blank iron-grey, punched-metal squares (about the size and shape of a playing card) and designed to be read by data-slates and cogitator systems. The only feature on the face of a Cognomen is the symbol of the issuing hive, guild or Adepta whom the citizen serves. In some ways, ownership of a cognomen is frighteningly important: it represents the only legal proof of identity, a right to work and even to be fed and housed for the average mid-hiver. Its loss might genuinely mean starvation, abandonment, arrest or even being cast down into the underhive in the blind face of Imperial bureaucracy. There is, of course, a thriving trade in the theft and falsification of cognomen, the price for a “face” varies on the identity fabricated or stolen, and can range from a few gelt to thousands.",
    weight: "—",
    value: "Varies",
    availability: "Plentiful",
  },
  {
    id: "ih-forgery-kit",
    name: "Forgery Kit",
    source: SkillSource.IH,
    description:
      "This represents a catch-all category of tools and materials, from special parchment inks to task-dedicated codifiers intended to help the user forge or duplicate official documents, cognomen, passes and permits. Using this kit in conjunction with the relevant Skill (Trade (Copyist) or Tech-Use) grants a bonus to copy, forge or fabricate such items, depending on the quality of the materials involved and the difficulty of the task. The price shown is for a common quality kit that provides a +10 bonus. A Good Quality kit gives a +20 bonus, while a Best Quality kit provides a +30.",
    weight: "Varies",
    value: "400 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-gloom-eyes",
    name: "Gloom Eyes",
    source: SkillSource.IH,
    description:
      "In the deepest regions of Volg, where light of any form rarely penetrates, the dripping, polluted waste occasionally forms strange amber-like deposits. Globular and glassy, these forms often glow with a strange luminescence that slowly changes and shifts in shade and colour. Rounded lumps, hacked from these deposits, are known as “gloom eyes” and are often carried bound into thongs around the necks of Volg gangers or mirk-stalkers as a form of charm. Though the light they shed is useful, the bearers of these curious objects believe that the eye’s glow changes to warn them of danger. Whether true or not, you need any edge you can get if you live in Volg and the belief is widely held.\n\nThese items count as a superior charm and they also shed light equivalent to that of a candle when uncovered. Characters from Volg that wear this charm gain a +10 bonus on Tests made to avoiding Pinning.",
    weight: "—",
    value: "300 Thrones",
    availability: "Scarce (Volg) or Very Rare (elsewhere)",
  },
  {
    id: "ih-heretics-wake-deck",
    name: "Heretic’s Wake Deck",
    source: SkillSource.IH,
    description:
      "In the centuries since the sector’s founding, the Ministorum has been unstinting in their efforts to stamp-out the game of “Heretic’s Wake”, but with little success. The game is played with a deck of cards made from a twisted and debased version of the Emperor’s Tarot and to possess a set is a crime punishable by “having one’s fingers dipped in molten gold”—for the blasphemy of holding such lies and creations of wickedness. The images on each card are rumoured to have been designed by the heretic illuminator, Cassilda, and it is said that if the cards are drawn in a certain pattern, the player will find themselves granted a vision of a far greater game, or perhaps simply go mad. The potential consequences have not prevented Heretics’ Wake from spreading throughout the sector to the point where a game can be found in almost every dark recess.",
    weight: "—",
    value: "10 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-holo-wafer",
    name: "Holo Wafer",
    source: SkillSource.IH,
    description:
      "Intended as fealty-badges, bargaining chips or signal-markers, holo wafers are small ceramic discs, each about as thick as a coin and no wider than a palm. Each is keyed to show a particular small holographic image when triggered. The devices have another, more sinister, use as so-called “death markers” or “kill claimers”. Holo wafers displaying images such as a winking skull, a weeping mother or a burning tower are de rigueur items in the Scintillan underworld, serving as “calling cards” for many assassins, gunsells and contracted blades who leave them on the corpses of their victims to enhance their mystique and their reputation.",
    weight: "—",
    value: "5 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-mantle-shrine",
    name: "Mantle Shrine",
    source: SkillSource.IH,
    description:
      "Common devotional items in the Calixis Sector, these small portable shrines take the form of a triptych wooden or flakboard box that can be closed into a case for carrying. Traditionally, mantle-shrines feature three hand-painted icons, the central being one of the aspects of the God-Emperor and at his right hand Saint Drusus, and at the left, an image or saint determined by the painter. The base unfolds to hold candles, an incense burner or a tack for votive papers. Most of these mantle-shrines are crafted in the pilgrim shantytowns of Hive Tarsus and exported by the Ecclesiarchy across the sector. One can find mantle-shrines even in the homes of the very poor on many worlds—indeed families often club together to buy them as wedding gifts. Many hive scummers, intent on robbery, also know that a locked mantle shrine is a favoured hiding place for many a poor stack-family’s few coins, if they dare desecrate it.",
    weight: "1 kg",
    value: "30 Thrones",
    availability: "Abundant",
  },
  {
    id: "ih-ocular-catechizer",
    name: "Ocular Catechizer",
    source: SkillSource.IH,
    description:
      "A device favoured by ranking adepts, sages and Administratum officials, these arcane and intricate-looking eyepieces are designed to magnify objects and help identify and analyse visual patterns and data. They are somewhat temperamental instruments, requiring stillness and concentration to use; their machine-spirits are notoriously easily vexed, much to the pain of the operator.\n\nUsing these devices gains a character a +10 bonus on Literacy, Lore and Search Tests where the close examination of objects, symbols and deciphering written text is involved. Other Actions cannot be attempted while using an ocular, and if a failure by four or more degrees is rolled on a Test involving the device, feedback through the eyepiece inflicts 1 level of Fatigue on the user. The eyepiece can also record its impressions to an attached data-slate for later study.",
    weight: "—",
    value: "250 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-penth-rift-dreadfuls",
    name: "Penth Rift Dreadfuls",
    source: SkillSource.IH,
    description:
      "The “penth rift dreadful” is a Calixian slang name for a small, cheaply printed pamphlet containing lurid stories of sordid murders, gang violence, fanciful tales of xenos atrocities and other strange occurrences, all couched in the form of morality tales or scaremongering religious tracts in order to evade censorship by the authorities. A popular, slightly licentious pleasure in the mid-hives, these publications are generally allowed to continue by the powers-that-be as they serve to reinforce the justly held fears and hatreds of the population, although, the Holy Ordos often keep a weather eye on their contents, just to ensure that no dangerous “truths” slip through amid the purple prose.",
    weight: "—",
    value: "1 Thrones",
    availability: "Average",
  },
  {
    id: "ih-salvation-auger-basic",
    name: "Salvation Auger (Basic)",
    source: SkillSource.IH,
    description:
      "About the size of a pocket chrono, the salvation auger is designed to detect the presence of harmful radiation, airborne toxins and pollutants. These devices are common on most hive worlds, particularly for up-hivers venturing into the depths. Augers alert the wearer when danger is encountered, coming in a variety of patterns and makes, varying from ornate hololithic dials to utilitarian lapel-boxes that shriek alarms when triggered. Basic models do nothing more than signal danger, while the better models can be read with an Ordinary (+10) Tech-Use Test to determine the exact nature of the hazard.",
    weight: "—",
    value: "20 Thrones",
    availability: "Common",
  },
  {
    id: "ih-salvation-auger-superior",
    name: "Salvation Auger (Superior)",
    source: SkillSource.IH,
    description:
      "About the size of a pocket chrono, the salvation auger is designed to detect the presence of harmful radiation, airborne toxins and pollutants. These devices are common on most hive worlds, particularly for up-hivers venturing into the depths. Augers alert the wearer when danger is encountered, coming in a variety of patterns and makes, varying from ornate hololithic dials to utilitarian lapel-boxes that shriek alarms when triggered. Basic models do nothing more than signal danger, while the better models can be read with an Ordinary (+10) Tech-Use Test to determine the exact nature of the hazard.",
    weight: "—",
    value: "80 Thrones",
    availability: "Average",
  },
  {
    id: "ih-vox-phonograph",
    name: "Vox-Phonograph",
    source: SkillSource.IH,
    description:
      "A domestic toy of the wealthy, phonographs are bulky table-piece devices of clockwork-cogs, switches, vox-grills, sounding horns and lens-projectors, built to play music or provide flickering holo-lantern shows. The usual fare for a vox-phonograph is orchestral symphonies, inspirational Ecclesiarchy sermons, issued guild reports and pict-slides, each recorded on a micro-etched metal cylinder which plugs into the machine’s loom to be played. Better models (twice the listed price) may record cylinders of their own and play media from other sources such as data-slates. Sadly such entertainment is well beyond the price of the masses in most hives.",
    weight: "20 kg",
    value: "200 Thrones",
    availability: "Average",
  },
  {
    id: "ih-vox-phonograph-cylinder",
    name: "Cylinder",
    source: SkillSource.IH,
    description:
      "A micro-etched metal cylinder which plugs into a vox-phonograph’s loom to be played.",
    weight: "1 kg",
    value: "20+ Thrones",
    availability: "Common",
  },
  {
    id: "ih-vox-thief-short-range",
    name: "Vox-Thief (Short-Range)",
    source: SkillSource.IH,
    description:
      "This complex device of the Omnissiah’s arts is designed to pick up, store and analyse both vox and data transmissions in the surrounding area. They can either be used by an operator or can be covertly hidden to record in a particular area. Using a vox-thief’s basic functions requires a successful Difficult (−10) Tech-Use Test and may be made considerably harder by the nature of the task. Additionally, heavily encrypted signals need further analysis to break their code. Short-range vox-thieves are the size of a data-slate and have a range of about two to three kilometres, while long-range models are larger units, containing a powerful in-built cogitator and are comparable to military vox-casters in size (a large backpack), with a range of up to 50 kilometres. In both cases, this range can be reduced dramatically by local conditions.",
    weight: "0.5 kg",
    value: "500 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-vox-thief-long-range",
    name: "Vox-Thief (Long-Range)",
    source: SkillSource.IH,
    description:
      "This complex device of the Omnissiah’s arts is designed to pick up, store and analyse both vox and data transmissions in the surrounding area. They can either be used by an operator or can be covertly hidden to record in a particular area. Using a vox-thief’s basic functions requires a successful Difficult (−10) Tech-Use Test and may be made considerably harder by the nature of the task. Additionally, heavily encrypted signals need further analysis to break their code. Short-range vox-thieves are the size of a data-slate and have a range of about two to three kilometres, while long-range models are larger units, containing a powerful in-built cogitator and are comparable to military vox-casters in size (a large backpack), with a range of up to 50 kilometres. In both cases, this range can be reduced dramatically by local conditions.",
    weight: "15 kg",
    value: "3,000 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-ward-accessor",
    name: "Ward Accessor",
    source: SkillSource.IH,
    description:
      "Although often ritualised and little understood by most who use them, ward accessors are electronic passes that allow access to certain areas that are otherwise restricted. Such security measures are commonplace in hive cities where individual citizens and workers usually find certain places off-limits. Individual accessors vary widely in appearance, from simple cards to holo-coins, badges of office or even great seals, depending on just where the security is located and what is being guarded. The cost listed here is for a “blank” accessor (a potentially dubious but not illegal item) ready to be programmed with a code.",
    weight: "—",
    value: "25 Thrones",
    availability: "Average",
  },
  {
    id: "ih-aerial-pinions-four-line",
    name: "Aerial Pinions (4 line)",
    source: SkillSource.IH,
    description:
      "A somewhat misnamed apparatus, aerial pinions were not designed to allow a user to soar through the air, but rather to prevent divers from sinking to their deaths in the chemical oceans of Landunder. The “hanging” colonies of Landunder are mounted on the undersides of the planet’s continents floating upon a vast chemical sea. Chemical mining, research and undercity maintenance must all be done “outside”, which is when aerial pinions are employed. A set of pinions resembles a webbed body harness festooned with articulated blades each of which is connected to a coiled, reinforced ceramite line. The lines are in turn attached to small motors that contain integral highly specialised logic-engines. A diver using a set of aerial pinions typically connects two or more lines into the city or ground above, using the blades as either grappling hooks or spiking them deep into the crust of the planet, as the pinion’s logic-engines dictate.\n\nA character using aerial pinions can move at half his normal rate, but can neither Run nor Charge.",
    weight: "10 kg",
    value: "300 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-aerial-pinions-six-line",
    name: "Aerial Pinions (6 line)",
    source: SkillSource.IH,
    description:
      "A somewhat misnamed apparatus, aerial pinions were not designed to allow a user to soar through the air, but rather to prevent divers from sinking to their deaths in the chemical oceans of Landunder. The “hanging” colonies of Landunder are mounted on the undersides of the planet’s continents floating upon a vast chemical sea. Chemical mining, research and undercity maintenance must all be done “outside”, which is when aerial pinions are employed. A set of pinions resembles a webbed body harness festooned with articulated blades each of which is connected to a coiled, reinforced ceramite line. The lines are in turn attached to small motors that contain integral highly specialised logic-engines. A fully extended set of aerial pinions resembles a great pair of wings from a distance, hence the name.\n\nA character using the advanced six blade-and-line aerial pinions can make an Agility Test in order to move at normal rates for as long as he wishes, until he comes to a stop. A separate Agility Test is required to use a Run or Charge Action. Failure indicates that one of the lines doesn’t connect or one of the logic-engines fails momentarily, instantly halting the character. Three or more degrees of failure mean that the character has overstretched his aerial pinions’ lines and become unmoored. On Landunder, that means he’s sinking; elsewhere that he is probably falling.",
    weight: "15 kg",
    value: "500 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-beetle-tent-three-person",
    name: "Beetle Tent (3 Person)",
    source: SkillSource.IH,
    description:
      "The Cestelle Alliance was instrumental in the original creation of a series of collapsible bio-dome structures now known as “beetle tents” due to their distinctly insectoid profile, an easy to assemble portable bio-dome formed from polycarbonate sidings reinforced with plasteel rods. While not as easily transportable as a shelter made from cloth, beetle tents are far more durable in the face of hostile creatures and uncertain weather. Beetle tents have AP 8 (Primitive), though they can be reinforced with armoured panels for travellers expecting to encounter particularly hostile native fauna. The three-person tent holds up to a maximum of three adult humans.",
    weight: "5 kg",
    value: "60 Thrones",
    availability: "Common",
  },
  {
    id: "ih-beetle-tent-six-person",
    name: "Beetle Tent (6 Person)",
    source: SkillSource.IH,
    description:
      "The Cestelle Alliance was instrumental in the original creation of a series of collapsible bio-dome structures now known as “beetle tents” due to their distinctly insectoid profile, an easy to assemble portable bio-dome formed from polycarbonate sidings reinforced with plasteel rods. While not as easily transportable as a shelter made from cloth, beetle tents are far more durable in the face of hostile creatures and uncertain weather. Beetle tents have AP 8 (Primitive), though they can be reinforced with armoured panels for travellers expecting to encounter particularly hostile native fauna. The six-person tent holds up to a maximum of six adult humans.",
    weight: "10 kg",
    value: "100 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-beetle-tent-extra-armour",
    name: "Beetle Tent (Extra Armour)",
    source: SkillSource.IH,
    description:
      "Extra armour for a beetle tent increases its AP value to 12.",
    weight: "+8 kg",
    value: "80 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-calixis-survival-kit",
    name: "Calixis Survival Kit",
    source: SkillSource.IH,
    description:
      "One of the most basic pieces of gear any traveller should have, a survival kit contains a wide variety of equipment and supplies, all of which are intended to help their users survive in less than optimal conditions. Generally, if the owner of a survival kit is forced to rely upon their kit’s contents, something has gone wrong—a particularly deadly prospect on an alien world. Several trade guilds within the Calixis Sector manufacture portable survival kits, with the ones produced by Haal-Lorden of Cantus particularly favoured, as that guild has held a contract to produce kits for the Imperial Guard for several centuries. There are many variants to be had and well-travelled users frequently tailor their personal survival kits to the specific environments they intend to find themselves within.\n\nSurvival kits add a +10 bonus to Survival Tests—the kit itself doesn’t supply knowledge of how to survive, but it can provide the tools to do so.",
    weight: "—",
    value: "120 Thrones",
    availability: "Average",
  },
  {
    id: "ih-camp-warders",
    name: "Camp Warders",
    source: SkillSource.IH,
    description:
      "Travellers to the feral worlds of the sector often choose devices that encourage passing hostile native creatures to go elsewhere and without a fight if possible. One of the more sophisticated of these is the elegant camp warder, a small techno-arcane device with an appearance reminiscent of clockwork scorpions. Data-linked to a screamer, camp warders are buried within the soil surrounding a campsite. When the screamer detects an intruder; instead of releasing an audible signal it sends a silent alarm to the camp warders, which immediately converge on the intruder by swiftly burrowing underground towards it.\n\nUpon arrival, the camp warders begin quickly stabbing their tails up out of the soil into the intruder. The camp warders then begin “herding” the creature away from the main campsite with continuous painful jabs. While this doesn’t cause any real damage, the frightening nature of the unseen assailants cause any being with the Bestial trait to immediately attempt a Hard (−20) Willpower Test or flee the area protected by the camp warders.\n\nThe listed cost includes a modified screamer and half a dozen camp warders.",
    weight: "4 kg",
    value: "310 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-redole-re-breather",
    name: "Redole Re-breather",
    source: SkillSource.IH,
    description:
      "Widely considered amidst the greater triumphs of a much-celebrated career, one of the legendary Magos Genetus Halix Redole’s final contributions to the Imperium was an alternate form of re-breather that followed the philosophies by which he lived his life. The Redole Re-breather is a helmet that literally draws breathable oxygen from the water around it, allowing a user to stay underwater indefinitely. As long as a Redole Re-breather’s flesh components are kept wet, each has a functional life of around a decade before needing to be replaced. Note that unlike a “standard” re-breather, Redole’s device provides no protection against harmful air-born toxins as it only functions underwater.",
    weight: "1 kg",
    value: "250 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-poi-savant",
    name: "Poi-Savant",
    source: SkillSource.IH,
    description:
      "A hand-held cogitation device, the poi-savant measures various levels of bio-chemicals and searches for signs of a diverse number of dangerous toxins in any substance that it is used to analyse. Any substance the poi-savant clears as “edible” is safe for human consumption, though not necessarily appetizing.\n\nPoi-savants were specifically designed to be easy to use; their operator need only make a Routine (+20) Tech-Use Test to employ them correctly. A failed Test gives inconclusive readings, while a failure by three or more degrees indicates that a blameless substance is toxic or vice versa (GM decision).",
    weight: "—",
    value: "300 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-shade-servitor",
    name: "Shade-Servitor",
    source: SkillSource.IH,
    description:
      "Hot environments are often doubly dangerous to travellers because they can compel visitors to a new planet to strip off their armour in order to withstand the heat, almost invariably a fatal mistake. Shade-servitors have no organic parts and are not, in fact, servitors in the strict Imperial sense of the word. They are relatively small devices resembling a cone surmounted by a series of ceramic lamellar blades that swiftly rotate in different directions. The devices hover about their master, using their blades as natural fans and parasols, occasionally supplemented with a cold blast of air sent over an internal cooling coil. Shade servitors have a small internal battery with a 12-hour reserve that constantly recharges via a series of photonic cells along their blades, allowing them to function near ceaselessly in hot, sunlit environments.\n\nA shade-servitor assists in removing penalties due to heat and helps to fend off Fatigue in hot environments (GM’s discretion).",
    weight: "3 kg",
    value: "400 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-sky-eye",
    name: "Sky Eye",
    source: SkillSource.IH,
    description:
      "A techno-arcane device of great sophistication, a sky eye incorporates a small hovering sphere slightly less than two fingers wide with an elegant docking station containing a variety of holo-display modules. The sphere scouts out a chosen area within 15 kilometres of the docking station, a process that can take anywhere from a few minutes to several hours depending on the distances involved and the level of stealth asked of the sphere component. Upon the eye’s return, the docking station produces perfect three-dimensional holomaps of the scouted area that can be downloaded to standard data-slates.\n\nThe sky eye drone is a Minuscule object that can sustain only a single point of Damage before it is destroyed. It has the Flyer (8) trait. Attempts to detect the sky eye either by sight or hearing are at a −30 penalty.",
    weight: "4 kg case",
    value: "1,500 Thrones",
    availability: "Very Rare",
  },
  {
    id: "ih-thermal-gloves",
    name: "Thermal Gloves",
    source: SkillSource.IH,
    description:
      "Thermal gloves are slender but sturdy gauntlets; thin enough to allow for delicate manipulation and lined with an assortment of circuitry that keeps them comfortably warm despite external weather. The power cells are incorporated into thin forearm shields in order to protect them from the elements. The energy in these cells can be used to power-up emergency ports on other equipment and, when doing so, provide a +10 bonus to Tech-Use Tests to restart generators, power up old data-slates and similar tasks. A full discharge from the generator cells can also be used to part-recharge a lasgun or laspistol clip as well, providing 1D5 shots of charge before draining the power cells entirely.",
    weight: "1 kg",
    value: "220 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-emergency-kit",
    name: "Emergency Kit",
    source: SkillSource.IH,
    description:
      "Most ships have emergency kits scattered about, and crewmen often carry around smaller versions. A full kit can include all of the following items: Glowstick; Universal Power Cell; Ration pack and water canister; Emergency Vox; Air bottle and Mask; Anti-radiation Tabs; and Hull Sealant Spray-Gel.",
    weight: "6 kg",
    value: "300 Thrones",
    availability: "Common",
  },
  {
    id: "ih-jump-pack",
    name: "Jump Pack",
    source: SkillSource.IH,
    description:
      "Personal flight and anti-grav devices are something of a rarity in the Imperium, however, far from unknown. Jump packs are one such system, allowing limited powered flight using a combination of suspensor systems and thrusters. Jump packs require the operator to have the Pilot (Jump Pack) skill. A standard (basic) jump pack allows for a safe, guided fall from any height and, with a thruster boost, make an unlimited series of short jumps (landing at the end of each Round’s movement), or they can duplicate the Flyer (12) trait for up to about a minute at a time. A jump pack’s power supply will last for about an hour of strenuous operation before it needs replacing.",
    weight: "25 kg",
    value: "2,000 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-magboots",
    name: "Magboots",
    source: SkillSource.IH,
    description:
      "Heavy and bulky, these oversized shoes contain electromagnets, which when activated, means the user can adhere to metallic surfaces such as exterior hull plating. Walking in them takes some effort, but they allow for a much easier time when working outside a ship or in areas where grav plating has failed. Magboots reduce the wearer’s Movement and AB by half (round up) but allow him to move about normally in areas of low or no gravity as long as there is a suitable surface to walk on.",
    weight: "2 kg",
    value: "65 Thrones",
    availability: "Average",
  },
  {
    id: "ih-melta-gel",
    name: "Melta Gel",
    source: SkillSource.IH,
    description:
      "This term covers a wide variety of extruded gelatine similar to dental paste, usually bright red or some other strong colour and sticky enough to adhere to most surfaces. Once applied and activated by an electric spark, it rapidly burns through bulkhead plating without the need for oxygen. Ideal for opening up a spacecraft from the outside or working in areas where air has escaped, most repair crews carry several tubes in their kits. A tube of melta gel can cover five metres in a thin line, or a surface area of one metre square. Along this line or area it deals Damage as a melta bomb over the course of about a minute as it burns through whatever it is applied to before becoming inert.",
    weight: "—",
    value: "200 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-navis-prima",
    name: "Navis Prima",
    source: SkillSource.IH,
    description: "",
    weight: "—",
    value: "Priceless",
    availability: "Very Rare",
  },
  {
    id: "ih-entrenching-tool",
    name: "The 9-70 Entrenching Tool",
    source: SkillSource.IH,
    description:
      "Used mostly to fill sandbags, this small folding shovel is durable and handy for a variety of other duties such as ditch and grave digging. It also serves as a nasty improvised weapon.",
    weight: "2 kg",
    value: "15 Thrones",
    availability: "Average",
  },
  {
    id: "ih-backpack-or-field-sack",
    name: "Backpack or Field Sack",
    source: SkillSource.IH,
    description:
      "Heavy and durable, each can hold almost everything listed here. For many a Guardsman a field sack also serves as his body bag when his service to the Emperor comes to an end.",
    weight: "2 kg",
    value: "5 Thrones",
    availability: "Common",
  },
  {
    id: "ih-bedroll",
    name: "Bedroll",
    source: SkillSource.IH,
    description:
      "Bedrolls are one of the infantrymen’s favoured possessions, for it offers a modicum of comfort at night or whenever there is a chance to catch a few winks. Bedrolls include heavy blankets.",
    weight: "4 kg",
    value: "8 Thrones",
    availability: "Plentiful",
  },
  {
    id: "ih-compass-orienting-device",
    name: "Compass/Orienting Device",
    source: SkillSource.IH,
    description:
      "Normally a simple magnetic compass, calibrated to current planetary true and magnetic polar locations, these tools are vital additions to any infantryman’s kit.",
    weight: "—",
    value: "25 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-dog-tags",
    name: "Dog Tags",
    source: SkillSource.IH,
    description:
      "Dog tags are issued to all Imperial soldiers and often serve as the only means of identifying their remains. The more heretical renegades collect them as souvenirs.",
    weight: "—",
    value: "1 Thrones",
    availability: "Plentiful",
  },
  {
    id: "ih-hostile-weather-gear",
    name: "Hostile Weather Gear",
    source: SkillSource.IH,
    description:
      "Depending on the battlefield, additional items such as tent liners, heating bricks, sunscreen, extra blankets, insect repellent, heavy gloves, greatcoats or parkas, filtration plugs, rad pills and more can be issued.",
    weight: "2 kg",
    value: "10 Thrones",
    availability: "Common",
  },
  {
    id: "ih-uplifting-primer",
    name: "The Imperial Infantryman’s Uplifting Primer",
    source: SkillSource.IH,
    description:
      "One of the most widespread books in the galaxy, every Imperial Guardsman must (by regulation) have a copy of it on their person at all times. It is filled with useful information including xenos recognition, weapon maintenance and use, survival and medical tips, and combat formations. More importantly, it carries prayers, hymns, litanies and inspirational passages to ensure that proper spiritual and morale levels are kept at proper levels.",
    weight: "0.3 kg",
    value: "5 Thrones",
    availability: "Plentiful",
  },
  {
    id: "ih-infantry-lamp-pack",
    name: "Infantry Lamp Pack",
    source: SkillSource.IH,
    description:
      "Rugged and compact, these light sources can be hand-held or fitted to the bayonet lugs on most rifles. A focusing dial on the lens can adjust the beam to either a wide swath for general lighting or a tight longer range illumination. A lamp pack runs for 1d5+5 hours on a standard charge.",
    weight: "1 kg",
    value: "10 Thrones",
    availability: "Average",
  },
  {
    id: "ih-mess-kit",
    name: "Mess Kit",
    source: SkillSource.IH,
    description:
      "A mess kit contains a combination spoon and fork, knife and collapsible mug, all fitting into a clamshell container that doubles as tray. Often a meal is simply placed in the container, closed tightly, and dropped into an open fire for rapid cooking.",
    weight: "0.5 kg",
    value: "5 Thrones",
    availability: "Plentiful",
  },
  {
    id: "ih-personal-grooming-kit",
    name: "Personal Grooming Kit",
    source: SkillSource.IH,
    description:
      "These kits include shaving gear, soap, dental care items and other things as deemed appropriate by the regimental commander, such as anti-fungal and parasite powders.",
    weight: "0.1 kg",
    value: "2 Thrones",
    availability: "Common",
  },
  {
    id: "ih-sandbags",
    name: "Sandbags",
    source: SkillSource.IH,
    description:
      "Doubly useful in the field as they can be filled with earth or sand to provide protection, or filled with clothing to create a makeshift pillow.",
    weight: "5 kg",
    value: "4 Thrones",
    availability: "Plentiful",
  },
  {
    id: "ih-tent",
    name: "Tent",
    source: SkillSource.IH,
    description:
      "Simple and durable, this tent can fit two people and their gear. Standard issue tents are waterproof with a reflective side for sun-baked climates.",
    weight: "9 kg",
    value: "40 Thrones",
    availability: "Average",
  },
  {
    id: "ih-tool-kit",
    name: "Tool Kit",
    source: SkillSource.IH,
    description:
      "A small set of screwdrivers, wrenches, wire and other items for maintenance and routine repairs, tool kits often contain rolls of “mud tape” (named as it sticks to everything and never comes off) and a small multi-purpose axe as well.",
    weight: "1 kg",
    value: "15 Thrones",
    availability: "Common",
  },
  {
    id: "ih-uniform",
    name: "Uniform",
    source: SkillSource.IH,
    description:
      "While many things are standardised in the Imperial Guard, uniforms are definitely not one of them. Each regiment has their own styles of dress, depending on their home world, background and combat style. In the Calixis Sector, uniforms can range from the impeccable dress of the Scintillan platoons to the ragged colours of the Penal Legions. Each also has differing standards such that individuals in each platoon may even maintain different battledress uniforms. Most, though, consist of heavy durable clothing and tough boots with thick socks to withstand a lifetime’s worth of marching. Rain gear, gloves and other items can be included depending on Munitorum decree.",
    weight: "3 kg",
    value: "10 Thrones",
    availability: "Common",
  },
  {
    id: "ih-weapon-gear-storage",
    name: "Weapon/Gear Storage",
    source: SkillSource.IH,
    description:
      "A variety of durable lightweight items used to store items such as ammunition packs, sidearm weapons and grenades. Common forms are hip packs, holsters, bandoliers and vests. Worn over armour, they allow easy storage while keeping the arms free for fighting. Most items a soldier needs quickly are carried in them, especially ammunition clips, grenades and a sidearm. Like uniforms these can vary from regiment to regiment. The harness can hold a maximum of 15 kg worth of small items.",
    weight: "1 kg",
    value: "5 Thrones",
    availability: "Common",
  },
  {
    id: "ih-weapon-maintenance-kit",
    name: "Weapon Maintenance Kit",
    source: SkillSource.IH,
    description:
      "Most commonly designed around the ubiquitous lasgun, each kit includes items such as blessed oils and lubricants, swabbing cloths, cleaning gels, weapon-specific tools and spare parts such as a spare stock and barrel. As standard, these kits are calibrated to Calixis-patterns, but generally work on all Munitorum-issued lasguns. Bear in mind, without the proper litanies and invocations, however, even the finest efforts will not ensure that the weapon maintains its proper function.",
    weight: "1 kg",
    value: "20 Thrones",
    availability: "Average",
  },
  {
    id: "ih-whistle",
    name: "Whistle",
    source: SkillSource.IH,
    description:
      "A surprisingly effective tool for alerting other members of your platoon of dangers or calling for help, whistles are standard issue. Some of the Scintillan regiments have adopted hiver ocarinas to also relay battle instructions in coded tones when electronic communications may be compromised.",
    weight: "—",
    value: "5 Thrones",
    availability: "Plentiful",
  },
  {
    id: "ih-cast-spray",
    name: "Cast Spray",
    source: SkillSource.IH,
    description:
      "A variation of synth-skin, cast spray forms a tough rigid coating over broken limbs so the trooper can be more easily transported. The temporary cast has coagulants and counterseptic drugs laced into the material to help fight Blood Loss and infection (reduces Difficulty of Medicae Test to stop Blood Loss by one-step).",
    weight: "—",
    value: "55 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-counterseptic-drugs",
    name: "Counterseptic Drugs",
    source: SkillSource.IH,
    description:
      "These include a broad range of antiseptics and analgesics to fight off infections, either injected via a pre-packaged needle or ingested in tab form. When taken, a counterseptic drug gives a +20 bonus on any Tests made to resist disease or infections for six hours.",
    weight: "—",
    value: "25 Thrones",
    availability: "Common",
  },
  {
    id: "ih-rainbow",
    name: "Rainbow",
    source: SkillSource.IH,
    description:
      "A somewhat dangerous all-in-one injection covering almost anything that can be wrong with someone. It includes an anti-bacterial serum, a blood clotting agent, an allergen, poison and radiation antidote broad-band immune booster, vitamins, a white cell stimulator and a sedative. This much stimulation to the body’s system can also cause massive shock, but when faced with a life or death situation against an unknown ailment some medicae take the gamble. An application of this drug allows the patient to immediately re-roll any failed Tests to resist disease or toxins and automatically stops Blood Loss. However, users must also immediately succeed on a Toughness Test or take 1d5 points of Damage ignoring Armour and Toughness Bonus.",
    weight: "—",
    value: "75 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-synth-skin",
    name: "Synth-Skin",
    source: SkillSource.IH,
    description:
      "A thin foam sprayed over burned flesh wounds to staunch bleeding and promote new skin regeneration, synth-skin is commonly issued to troopers for their own battlefield dressings. An application of synth-skin, a Full Action, stops Blood Loss.",
    weight: "—",
    value: "50 Thrones",
    availability: "Average",
  },
  {
    id: "ih-toxin-wands",
    name: "Toxin Wands",
    source: SkillSource.IH,
    description:
      "Easy to use by untrained personnel, toxin wands work to detect poisons and recommend counter-agents and immunisers. A character can use a toxin wand to determine whether or not someone has been poisoned or not by succeeding at a Challenging (+0) Perception Test or a Routine (+20) Medicae Test. Success by two or more degrees also grants enough information to identify an antidote (if one exists).",
    weight: "0.2 kg",
    value: "100 Thrones",
    availability: "Scarce",
  },
  {
    id: "ih-null-box",
    name: "Null Box",
    source: SkillSource.IH,
    description:
      "Occasionally vital for preserving or safely containing a sample or woeful artefact, null boxes are portable stasis field generators in the shape of small armoured boxes, although some go right up to the size of a large chest or sarcophagus. Inside a stasis field, all time and motion halts and whatever is trapped inside is effectively frozen and removed from any interaction with reality—essentially contained in a psychic dead zone. True relics of the Dark Age of Technology, most null boxes are extraordinarily resilient and tough and once active require no further power unless deactivated and turned on again. Unless breached with enormous force or simply turned off by someone able to do so, a null box and its contents can out-sit eternity if needs be.",
    weight: "20 kg",
    value: "25,000 Thrones",
    availability: "Very Rare",
  },
  {
    id: "ih-psy-jammer-amulet",
    name: "Psy-Jammer (Amulet)",
    source: SkillSource.IH,
    description:
      "Somewhat esoteric examples of techno-arcana, these devices can at least partially disrupt psychic energy and offer some degree of protection against the dark arts of the psyker and the witch. The amulet has the disadvantage that it can be physically removed. A psy-jammer grants its wearer a +20 bonus on any Test involved to resist the effects of a Psychic Power and +10 bonus on Tests to resist possession attacks. The jammer, however, has no effect on psychic attacks that inflict direct physical Damage.\n\nPsykers cannot use psy-jammers (they naturally overload them).",
    weight: "0.5 kg",
    value: "7,000 Thrones",
    availability: "Very Rare",
  },
  {
    id: "ih-psy-jammer-implant",
    name: "Psy-Jammer (Implant)",
    source: SkillSource.IH,
    description:
      "Somewhat esoteric examples of techno-arcana, these devices can at least partially disrupt psychic energy and offer some degree of protection against the dark arts of the psyker and the witch. While the implant cannot be so easily countered, it can have unpleasant long-term side effects to the user. A psy-jammer grants its wearer a +20 bonus on any Test involved to resist the effects of a Psychic Power and +10 bonus on Tests to resist possession attacks. The jammer, however, has no effect on psychic attacks that inflict direct physical Damage.\n\nPsykers cannot use psy-jammers (they naturally overload them).",
    weight: "—",
    value: "12,000 Thrones",
    availability: "Very Rare",
  },
  {
    id: "ih-psy-tracker",
    name: "Psy-Tracker",
    source: SkillSource.IH,
    description:
      "Sometimes referred to as aetherscopes, these are a particular form of scanner designed to monitor disturbances in the empyrean and detect and analyse psychic energies. These sophisticated and tricky devices are used extensively by adepts and savants attached to the Holy Ordos, although very similar scanners are actually used as a common part of the engineering equipment of major starships to monitor the status of the ship’s Geller field and its generators.\n\nThe Tech Use skill is required to be able use one of these scanners. Awareness Tests taken in conjunction with the device enable the user to determine the presence and relative strength of psychic force, Daemons, the lingering effects of warp disturbances and the like. Psy-trackers are somewhat temperamental devices with an operating range of no more than a few hundred metres (although they might register very powerful spikes and signals from far beyond that). They are also easily clouded and confused by powerful energy fields and psychic “background noise”.",
    weight: "1.5 kg",
    value: "1,000 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-black-grimoire",
    name: "The Calixian Black Grimoire",
    source: SkillSource.IH,
    description:
      "Thought to have been first penned by the Ordo Xenos Inquisitor Lord Quate’maz Knael in the in the aftermath of his expeditions into the Hazeroth Abyss, and substantially added to a century later by the infamous Inquisitor Kol Shek, the Black Grimoire is no less than a field manual detailing many forms of xenos creatures they had encountered in their long years of service—explaining how to identify, combat and destroy them. The Grimoire takes the shape of a small black data-slate made of high-impact polyflex that opens in the fashion of a clasped book and also has a short-range audio and pict recording and a playback function. Their owners, in addition to numerous other safeties built into them, personally encrypt all copies of the Black Grimoire and the Grimoire self-immolates if opened by an individual not specified by its gene-lock, or if tampered with.\n\nThe Black Grimoire provides a +10 bonus on Research Tests involving Ciphers (Occult), Scholastic Lore (Legend) and Forbidden Lore (Cults, Daemonology, Warp and/or Xenos).",
    weight: "1 kg",
    value: "2,500 Thrones",
    availability: "Very Rare (Ordo Xenos only)",
  },
  {
    id: "ih-cherubim",
    name: "Cherubim",
    source: SkillSource.IH,
    description: "",
    weight: "—",
    value: "3,000 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-thurible",
    name: "Thurible",
    source: SkillSource.IH,
    description: "",
    weight: "5 kg",
    value: "500 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-excruciator",
    name: "Excruciator",
    source: SkillSource.IH,
    description:
      "The most common (and mobile) of these devices are known as excruciators, and consist of a variety of long monofilament induction needles and auto injectors linked to a control unit and a specially modified medicae auspex.\n\nUsing such a device requires a about an hour to set up on a subject (who must be restrained) and can only be employed by a character with both the Medicae and Tech-Use skills. The use of an excruciator adds a +20 bonus to Interrogation Tests for the questioner and a −10 penalty to Deceive Tests for the subject.\n\nIndividuals with the Fearless talent or From Beyond trait are immune to this device’s effects.",
    weight: "2 kg",
    value: "10,000 Thrones",
    availability: "Rare",
  },
  {
    id: "ih-icon-of-holy-wrath",
    name: "Icon of Holy Wrath",
    source: SkillSource.IH,
    description:
      "There usually comes a time even in the most labyrinthine covert investigation, or ongoing deception by the Inquisition, when the facts have been gathered and the guilty identified. A time to punish and purify with all the awesome might and magisterial fury the Holy Ordos can muster. It is at these times that the Icon of Holy Wrath is displayed. Each icon differs, based on the traditions and tastes of the Inquisitors that own them.\n\nThe presence of the Icon of Holy Wrath enhances the character’s visibility for the purpose of certain talents (Into the Jaws of Hell, for example). Additionally they give the bearer and their allies within six metres a rating of Fear (1 Disturbing), to cultists, mutants, heretics and anybody else the GM deems appropriate.\n\nThese icons cannot be bought, only fashioned appropriately by a full Inquisitor, and their use granted for a particular battle.",
    weight: "10 kg",
    value: "—",
    availability: "Issued Only",
  },
  // ── Inquisitor's Handbook — War Zone Explosive Materials ─────────────────
  {
    id: "ih-det-cord-and-det-tape",
    name: "Det-Cord and Det-Tape",
    source: SkillSource.IH,
    description: "Det-cord and det-tape are the two most common types of timer material, often used in conjunction with tube-charges. The delay is set by either peeling back the tape or cutting the cord to the desired length. Both can be used as a low-grade explosive material in an emergency, inflicting 1d5 X Damage for every one kilogram used with a blast radius of twice its weight in kilograms.",
    weight: "1 kg",
    value: "20 Thrones",
    availability: "Common",
  },
  {
    id: "ih-fyceline",
    name: "Fyceline",
    source: SkillSource.IH,
    description: "A chemical used in many standard Imperial explosives, it is mined from rare ores and its production often becomes the primary tithe for many planets. Refined fyceline can be used to fashion crude explosives. Fyceline explosives inflict 1d10+5 X Damage for every kilogram used in their construction and have a blast radius of five times their weight in kilograms.",
    weight: "1 kg",
    value: "70 Thrones",
    availability: "Average",
  },
  {
    id: "ih-promethium",
    name: "Promethium",
    source: SkillSource.IH,
    description: "Petrochem-based liquid fuel, promethium is the jelly-like substance used to power flamer weapons. It can also be used to create anti-personnel explosives and bombs as it is highly flammable. Promethium explosives inflict 2d10 E Damage for every kilogram used in their construction and have a blast radius of four times their weight in kilograms. In addition, anyone caught in the radius of a promethium explosion must make an Agility Test or catch on fire.",
    weight: "1 kg",
    value: "60 Thrones",
    availability: "Scarce",
  },
];
