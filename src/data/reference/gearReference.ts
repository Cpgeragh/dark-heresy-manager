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

  // ── Core Rulebook — Clothing & Personal Items ─────────────────────────────

  {
    id: "cr-backpack",
    name: "Backpack",
    source: SkillSource.CR,
    description: "A personal carrying device, usually a bag with attached straps. Can carry approximately 50 kilograms.",
    weight: "1 kg",
    value: "10 Thrones",
    rarity: "Plentiful",
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
    rarity: "Rare",
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
    rarity: "Average",
  },
  {
    id: "cr-chrono",
    name: "Chrono",
    source: SkillSource.CR,
    description: "A hand-held or wrist-worn timepiece, generally dependable and simple to use.",
    weight: "—",
    value: "40 Thrones",
    rarity: "Abundant",
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
    rarity: "Common",
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
    rarity: "Abundant",
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
    rarity: "Rare",
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
    rarity: "Common",
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
    rarity: "Rare",
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
    rarity: "Scarce",
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
    rarity: "Scarce",
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
    rarity: "Common",
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
    rarity: "Average",
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
    rarity: "Plentiful",
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
    rarity: "Very Rare",
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
    rarity: "Scarce",
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
    rarity: "Scarce",
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
    rarity: "Rare",
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
    rarity: "Common",
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
    rarity: "Scarce",
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
    rarity: "Very Rare",
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
    rarity: "Abundant",
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
    rarity: "Common",
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
    rarity: "Average",
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
    rarity: "Average",
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
    rarity: "Plentiful",
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
    rarity: "Average",
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
    rarity: "Scarce",
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
    rarity: "Average",
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
    rarity: "Rare",
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
    rarity: "Scarce",
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
    rarity: "Average",
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
    rarity: "Scarce",
  },
  {
    id: "cr-writing-kit",
    name: "Writing Kit",
    source: SkillSource.CR,
    description: "Contains papers, inks and quills.",
    weight: "2 kg",
    value: "20 Thrones",
    rarity: "Common",
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
    description:
      "Coil-generator that emits a charged fluctuating mag-field, affecting all magnetic devices " +
      "within 30 metres for 2d10 Rounds, supercharging them. Separating any activated magnet from " +
      "its attached surface requires a Hellish (–60) Strength Test. " +
      "Good/Best Craftsmanship increase the radius by 5 m / 10 m. Poor Craftsmanship reduces it by 10 m.",
    weight: "5 kg",
    value: "2,000 Thrones",
    rarity: "Near Unique",
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
    rarity: "Scarce",
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
    rarity: "Rare",
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
    description:
      "An insectoid creature the size of a thumb that generates an acid harmless to flesh but " +
      "corrosive to stone and metal. Squeeze its thorax to force acid through its mandibles onto a " +
      "surface. One creature generates enough acid to draw a 2-metre line, eating through up to 30 cm " +
      "of adamantium before dissipating. Takes one week to replenish its acid reserves. Must be kept " +
      "in wooden, bone, or ivory cages. No craftsmanship variants exist.",
    weight: "1 kg",
    value: "500 Thrones",
    rarity: "Very Rare",
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
