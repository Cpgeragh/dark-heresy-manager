// src/data/traitDescriptions.ts
// Keyed by TraitData.id. Expand entries as needed.

export const TRAIT_DESCRIPTIONS: Record<string, string> = {

  // ─── Core Rulebook — Creature Traits ────────────────────────────────────────
  "amorphous":               "Can alter its Size by one step in either direction, though this does not change its speed. Movement uses half Agility Bonus. Typically relies on Unnatural Senses to perceive its surroundings.",
  "armour-plating":          "Encased in heavy armour plating, increasing Armour Points by 2 to all locations.",
  "auto-stabilised":         "Always counts as braced, even when firing weapons one-handed. May fire on semi- or full-automatic as a Half Action.",
  "bestial":                 "Never needs a Survival Test in its natural habitat. Unless starving or desperate, must pass a Willpower Test when frightened, startled, or injured; on a failure, the creature flees.",
  "blind":                   "Automatically fails all sight-based Tests and all Ballistic Skill Tests. Takes a –30 penalty to Weapon Skill Tests and most other Tests that ordinarily involve vision.",
  "brutal-charge":           "Deals an extra 3 points of Damage when charging.",
  "burrower":                "Can burrow through soil, rock, and sand; some can burrow through metal. Leaves a tunnel behind — creatures one size smaller may traverse it freely. 50% chance per Round the tunnel collapses.",
  "crawler":                 "Movement equals half Agility Bonus. Takes no penalties for moving over Difficult Terrain.",
  "daemonic":                "Doubles Toughness Bonus against all Damage. Immune to poison and disease. The doubling does not apply against force weapons, Psychic Powers, holy attacks, or other Daemonic creatures.",
  "dark-sight":              "Sees normally in all levels of darkness. Never takes penalties for dim or absent lighting.",
  "fear":                    "Characters who encounter this creature must pass a Willpower Test, modified by the Fear Rating. On failure, roll on the Shock Table, adding +10 per degree of failure. Fear Rating: 1 Disturbing (0), 2 Frightening (–10), 3 Horrifying (–20), 4 Terrifying (–30).",
  "flyer":                   "Can fly at a speed listed in the creature entry.",
  "from-beyond":             "Immune to Fear, Pinning, Insanity Points, and Psychic Powers used to cloud, control, or delude its mind.",
  "hoverer":                 "Can fly up to two metres off the ground. Speed is listed in the creature entry.",
  "incorporeal":             "Insubstantial and weightless; may pass through solid objects. Gains +30 to Concealment Tests when hiding inside something. May become completely silent, automatically passing Silent Move Tests. Immune to normal weapons — only Daemons, Psychic Powers, warp creatures, other incorporeal creatures, and force weapons can harm it. Cannot normally affect non-incorporeal creatures without a special ability or Talent. Cannot pass through Geller fields or similar barriers.",
  "machine":                 "Does not breathe; immune to vacuum, extreme cold, and mind-influencing psychic effects. Armour Points apply towards fire Damage. Has 1–5 Armour Points per location as listed.",
  "multiple-arms":           "+10 Toughness Characteristic, +10 to Strength Tests involving movement such as Climb and Swim. May use the Multiple Attack Action to gain two attacks on its Turn.",
  "natural-armour":          "Naturally tough hide or exoskeleton grants the listed number of Armour Points to all locations.",
  "natural-weapons":         "Always counts as armed. Attacks deal 1d10+Strength Bonus Damage using Weapon Skill, but cannot Parry with natural weapons and cannot be disarmed. Natural weapons always count as Primitive.",
  "phase":                   "Can become incorporeal or corporeal by spending a Half Action. Functions as the Incorporeal trait while insubstantial, except cannot cross psychically charged barriers, holy wards, Geller fields, or void shields.",
  "possession":              "Can attempt to possess a mortal body using a Full Action within a few metres. Entity and target make Opposed Willpower Tests each Round; the first to accumulate five cumulative degrees of success wins. A repelled entity cannot try again for 24 hours and takes 1d10 Damage. During possession, the victim gains +10 Strength and Toughness and 1d10 Wounds, using the entity's mental stats and powers. Surviving possession permanently reduces Toughness and Willpower by 2d10 and inflicts 1d10 Insanity Points.",
  "quadruped":               "Movement equals twice the Agility Bonus. Creatures with more than four legs gain an additional ×1 multiplier per extra pair of legs.",
  "regeneration":            "At the start of each Turn, tests Toughness to remove 1 point of Damage. Loses this Trait when slain.",
  "size":                    "Affects hit modifier, Concealment, and Base Movement. Minuscule: –30 hit, +30 Concealment, AB–3; Puny: –20/+20/AB–2; Scrawny: –10/+10/AB–1; Average: 0/0/AB; Hulking: +10/–10/AB+1; Enormous: +20/–20/AB+2; Massive: +30/–30/AB+3.",
  "sonar-sense":             "Perceives all solid objects within 30 metres via echolocation. Other creatures within range may detect the keening with a Difficult (–10) Awareness Test.",
  "soul-bound":              "Soul is bound to a higher power for protection. Gains an extra d10 on Perils of the Warp rolls, discarding whichever to get a more favourable result. Upon binding, choose one effect: 1d10 Insanity Points, permanent loss of sight, permanent loss of 1d10 from one Characteristic, or a random mutation (Ruinous Powers only).",
  "stampede":                "On a failed Willpower Test, automatically charges in a straight line overrunning everything in its path, dealing Natural Weapon Damage (or 1d5+SB Impact if it has none). Spreads to all creatures within sight. Continues until the threat is no longer visible or for 1d10 minutes, whichever is last.",
  "strange-physiology":      "The creature's alien physiology means it dies only when Damage equals or exceeds its Wounds.",
  "stuff-of-nightmares":     "Completely immune to poison, disease, the need to breathe, most environmental hazards, Blood Loss, Stunning, and any Critical result — unless caused by a Psychic Power, force weapon, or holy attack.",
  "sturdy":                  "+20 to Tests made to resist Grappling and the Takedown talent.",
  "toxic":                   "Delivers poison via natural attacks, contact, or stench. Targets must pass a Toughness Test or suffer 1d10 Damage ignoring Armour. Variations are listed in the creature entry.",
  "unnatural-characteristic":"Double the Bonus of one Characteristic. May be taken multiple times; each additional application to the same Characteristic increases the multiplier by 1 (×2, ×3, ×4 etc.). Does not increase movement even if applied to Agility.",
  "unnatural-senses":        "Perceives surroundings by means other than sight or hearing. Range is listed in the creature entry, typically 15 metres.",
  "unnatural-speed":         "Doubles Agility Bonus for movement, applied after other modifiers from size and Traits.",
  "warp-instability":        "If the creature takes Damage and does not deal Damage or Insanity Points to another creature by the end of its next Turn, it must test Willpower. On failure, it takes 1 Damage plus 1 per degree of failure. If this equals or exceeds its Wounds, the creature is cast back into the warp.",
  "warp-weapon":             "Attacks ignore physical armour unless made from psychoreactive materials or carrying the holy quality. Force fields still work normally.",

  // ─── Core Rulebook — Career Traits ──────────────────────────────────────────
  "mechanus-implants":       "You bear the sacred implants of the Adeptus Mechanicus: an Electro-Graft (data port interface), Electoo Inductors (bio-electrical power siphon), a Respirator Unit (+20 to resist airborne toxins and gas weapons; includes a vox-synthesiser), a Cyber-Mantle (implant anchorage framework), a Potentia Coil (power storage), and Cranial Circuitry (cognitive augmentation).",

  // ─── Creatures Anathema ──────────────────────────────────────────────────────
  "improved-natural-weapons": "This creature's attacks are powerful enough to crush plasteel or punch through armour. The creature's natural weapons no longer count as Primitive.",

  // ─── Disciples of the Dark Gods ─────────────────────────────────────────────
  "dotdg-untouchable":
    "Psychic Invulnerability: Completely immune to Psychic Powers, warp effects, possession, sorcery, and Corruption from warp shock. " +
    "Cannot be detected by Psyniscience, Sense Presence, or similar abilities — such powers simply fail to affect them. " +
    "Area psychic powers that catch an Untouchable in their radius fail to affect them, but may affect others normally. " +
    "Psychic Disruption: All Psychic Powers manifested within a radius equal to the Untouchable's Willpower Bonus in metres " +
    "have their Threshold increased by 10, and any associated psyker Tests have their Difficulty increased by 20. " +
    "Entities subject to Warp Instability suffer double damage from its effects while within this area. " +
    "Note: Indirect effects (e.g. a telekinetically hurled boulder) may still affect an Untouchable at GM discretion.",

  "dotdg-cryptos-possession":
    "The Possession Attack: The Cryptos must be in contact with its victim and use a Full Action. " +
    "Both make Opposed Willpower Tests each Round, accumulating degrees of success. " +
    "The first to reach five cumulative degrees wins. " +
    "If the Cryptos wins, it possesses the victim. If the victim wins, the Cryptos is repelled for 24 hours and Stunned for 1d10 Rounds. " +
    "Effects of Possession: The Cryptos takes complete control with full access to the victim's memories and body. " +
    "Modifications: +10 Toughness; the Cryptos's Intelligence, Perception, and Willpower replace the victim's; " +
    "the Cryptos's Psy Rating and powers replace the victim's; the Cryptos's Skills and Talents are added to the victim's; " +
    "+20 to Deceive Tests to impersonate the victim. The victim's mind is crushed into an oblivious state. " +
    "Casting Off: The Cryptos is expelled if it suffers Critical Damage or the victim receives a powerful electrical shock — leaving it with 1 Wound. " +
    "It may also leave voluntarily, inflicting 1d5 Wounds on itself. Cannot be expelled by methods that affect daemons (it is not a warp entity). " +
    "Surviving Possession: When the Cryptos departs, 25% chance the host dies (apparent multi-organ failure). " +
    "Survivors suffer 1d10 permanent Damage to both Toughness and Willpower, gain 1d10 Insanity Points, and have no memory of the possession.",

  // ─── Book of Judgement ─────────────────────────────────────────────────────
  "blank-slate": "The Acolyte is imprinted with psychic triggers known only to their handler. One trigger wipes all previous imprinting; another prepares the mind for re-programming. When imprinted, the GM and player choose three Common Lore, Forbidden Lore, Scholastic Lore, or Trade skills appropriate to the assumed identity. Until wiped clean, the Slate-Agent is treated as possessing all chosen Skills and gains +10 to related Tests.",
};
