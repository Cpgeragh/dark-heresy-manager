// src/data/traitDescriptions.ts
// Keyed by TraitData.id. Expand entries as needed.

export const TRAIT_DESCRIPTIONS: Record<string, string> = {
  // ─── Core Rulebook — Creature Traits ────────────────────────────────────────
  amorphous:
    "Can alter its Size by one step in either direction, though this does not change its speed. Movement uses half Agility Bonus. Typically relies on Unnatural Senses to perceive its surroundings.",
  "armour-plating":
    "Encased in heavy armour plating, increasing Armour Points by 2 to all locations.",
  "auto-stabilised":
    "Always counts as braced, even when firing weapons one-handed. May fire on semi- or full-automatic as a Half Action.",
  bestial:
    "Never needs a Survival Test in its natural habitat. Unless starving or desperate, must pass a Willpower Test when frightened, startled, or injured; on a failure, the creature flees.",
  blind:
    "Automatically fails all sight-based Tests and all Ballistic Skill Tests. Takes a –30 penalty to Weapon Skill Tests and most other Tests that ordinarily involve vision.",
  "brutal-charge": "Deals an extra 3 points of Damage when charging.",
  burrower:
    "Can burrow through soil, rock, and sand; some can burrow through metal. Leaves a tunnel behind — creatures one size smaller may traverse it freely. 50% chance per Round the tunnel collapses.",
  crawler:
    "Movement equals half Agility Bonus. Takes no penalties for moving over Difficult Terrain.",
  daemonic:
    "Doubles Toughness Bonus against all Damage. Immune to poison and disease. The doubling does not apply against force weapons, Psychic Powers, holy attacks, or other Daemonic creatures. If combined with Unnatural Toughness, do not multiply Toughness Bonus twice; add 1 to the Unnatural Toughness multiplier instead.",
  "dark-sight":
    "Sees normally in all levels of darkness. Never takes penalties for dim or absent lighting.",
  fear: "Characters who encounter this creature must pass a Willpower Test, modified by the Fear Rating. On failure, roll on the Shock Table, adding +10 per degree of failure. Fear Rating: 1 Disturbing (0), 2 Frightening (–10), 3 Horrifying (–20), 4 Terrifying (–30).",
  flyer: "Can fly at a speed listed in the creature entry.",
  "from-beyond":
    "Immune to Fear, Pinning, Insanity Points, and Psychic Powers used to cloud, control, or delude its mind.",
  hoverer: "Can fly up to two metres off the ground. Speed is listed in the creature entry.",
  incorporeal:
    "Insubstantial and weightless; may pass through solid objects. Gains +30 to Concealment Tests when hiding inside something. May become completely silent, automatically passing Silent Move Tests. Immune to normal weapons — only Daemons, Psychic Powers, warp creatures, other incorporeal creatures, and force weapons can harm it. Cannot normally affect non-incorporeal creatures without a special ability or Talent. Cannot pass through Geller fields or similar barriers.",
  machine:
    "Does not breathe; immune to vacuum, extreme cold, and mind-influencing psychic effects. Armour Points apply towards fire Damage. Has 1–5 Armour Points per location as listed.",
  "multiple-arms":
    "+10 Toughness Characteristic, +10 to Strength Tests involving movement such as Climb and Swim. May use the Multiple Attack Action to gain two attacks on its Turn.",
  "natural-armour":
    "Naturally tough hide or exoskeleton grants the listed number of Armour Points to all locations.",
  "natural-weapons":
    "Always counts as armed. Attacks deal 1d10+Strength Bonus Damage using Weapon Skill, but cannot Parry with natural weapons and cannot be disarmed. Natural weapons always count as Primitive.",
  phase:
    "Can become incorporeal or corporeal by spending a Half Action. Functions as the Incorporeal trait while insubstantial, except cannot cross psychically charged barriers, holy wards, Geller fields, or void shields.",
  possession:
    "Can attempt to possess a mortal body using a Full Action within a few metres. Entity and target make Opposed Willpower Tests each Round; the first to accumulate five cumulative degrees of success wins. A repelled entity cannot try again for 24 hours and takes 1d10 Damage. During possession, the victim gains +10 Strength and Toughness and 1d10 Wounds, using the entity's mental stats and powers. Surviving possession permanently reduces Toughness and Willpower by 2d10 and inflicts 1d10 Insanity Points.",
  quadruped:
    "Movement equals twice the Agility Bonus. Creatures with more than four legs gain an additional ×1 multiplier per extra pair of legs.",
  regeneration:
    "At the start of each Turn, tests Toughness to remove 1 point of Damage. Loses this Trait when slain.",
  size: "Affects hit modifier, Concealment, and Base Movement. Minuscule: –30 hit, +30 Concealment, AB–3; Puny: –20/+20/AB–2; Scrawny: –10/+10/AB–1; Average: 0/0/AB; Hulking: +10/–10/AB+1; Enormous: +20/–20/AB+2; Massive: +30/–30/AB+3.",
  "sonar-sense":
    "Perceives all solid objects within 30 metres via echolocation. Other creatures within range may detect the keening with a Difficult (–10) Awareness Test.",
  "soul-bound":
    "Soul is bound to a higher power for protection. Gains an extra d10 on Perils of the Warp rolls, discarding whichever to get a more favourable result. Upon binding, choose one effect: 1d10 Insanity Points, permanent loss of sight, permanent loss of 1d10 from one Characteristic, or a random mutation (Ruinous Powers only).",
  stampede:
    "On a failed Willpower Test, automatically charges in a straight line overrunning everything in its path, dealing Natural Weapon Damage (or 1d5+SB Impact if it has none). Spreads to all creatures within sight. Continues until the threat is no longer visible or for 1d10 minutes, whichever is last.",
  "strange-physiology":
    "The creature's alien physiology means it dies only when Damage equals or exceeds its Wounds.",
  "stuff-of-nightmares":
    "Completely immune to poison, disease, the need to breathe, most environmental hazards, Blood Loss, Stunning, and any Critical result — unless caused by a Psychic Power, force weapon, or holy attack.",
  sturdy: "+20 to Tests made to resist Grappling and the Takedown talent.",
  toxic:
    "Delivers poison via natural attacks, contact, or stench. Targets must pass a Toughness Test or suffer 1d10 Damage ignoring Armour. Variations are listed in the creature entry.",
  "unnatural-characteristic":
    "Double the Bonus of one Characteristic. May be taken multiple times; each additional application to the same Characteristic increases the multiplier by 1 (×2, ×3, ×4 etc.). Does not increase movement even if applied to Agility. If Daemonic and Unnatural Toughness both apply, do not multiply Toughness Bonus twice; add 1 to the Unnatural Toughness multiplier instead.",
  "unnatural-senses":
    "Perceives surroundings by means other than sight or hearing. Range is listed in the creature entry, typically 15 metres.",
  "unnatural-speed":
    "Doubles Agility Bonus for movement, applied after other modifiers from size and Traits.",
  "warp-instability":
    "If the creature takes Damage and does not deal Damage or Insanity Points to another creature by the end of its next Turn, it must test Willpower. On failure, it takes 1 Damage plus 1 per degree of failure. If this equals or exceeds its Wounds, the creature is cast back into the warp.",
  "warp-weapon":
    "Attacks ignore physical armour unless made from psychoreactive materials or carrying the holy quality. Force fields still work normally.",

  // ─── Core Rulebook — Career Traits ──────────────────────────────────────────
  "mechanicus-implants":
    "You bear the sacred implants of the Adeptus Mechanicus: an Electro-Graft (data port interface), Electoo Inductors (bio-electrical power siphon), a Respirator Unit (+20 to resist airborne toxins and gas weapons; includes a vox-synthesiser), a Cyber-Mantle (implant anchorage framework), a Potentia Coil (power storage), and Cranial Circuitry (cognitive augmentation).",
  "sanctioned-psyker":
    "Taken aboard the Black Ships to Holy Terra and sanctioned by agents of the Golden Throne through painful rituals that test the soul against the psychic predators of the warp. Roll on Table 1-5: Sanctioning Side Effects to determine the mark left by the sanctioning. Starting age is increased by 3d10 years.",

  // ─── Creatures Anathema ──────────────────────────────────────────────────────
  "improved-natural-weapons":
    "This creature's attacks are powerful enough to crush plasteel or punch through armour. The creature's natural weapons no longer count as Primitive.",

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

  // ─── Haarlock's Legacy III ──────────────────────────────────────────────────
  "shadow-shrouded":
    "+10 to all Concealment and Silent Move Tests. Regenerates 1 lost Wound per combat round while still alive.",

  // ─── Lathe Worlds ────────────────────────────────────────────────────────────
  "rigor-mentis":
    "Re-roll any Interaction Test made to resist Interrogation, Charm, Deceive, or any other method used to extract information relating to the Lords Dragon, the Panopticon Orbital, or the Praecursator Grid. This is an unconscious defence — the character cannot suppress it intentionally.",
  "outside-looking-in":
    "Treat the Disposition of any member of the Adeptus Mechanicus as two steps lower than normal. This effect is cumulative with other Malateks in the same cell.",
  "heart-of-steel":
    "Substitute Intelligence for Fellowship whenever interacting with other members of the Cult Mechanicus.",
  "skin-of-iron":
    "Upon selecting this Alternate Rank, automatically gain one Common-Quality cybernetic. Every two Ranks thereafter (Ranks 3, 5, and 7) either gain an additional cybernetic or upgrade one existing cybernetic to Good Quality.",
  "excommunicate-mechanicum":
    "If discovered as a member of the Cult of the Pure Form, all members of the Mechanicum treat the character with the lowest possible Disposition (and vice versa). All Interaction with the Machine Cult — even conversation — is treated as Arduous (–40) before other modifiers.",
  "fabricated-flesh":
    "Prerequisites: Tech-Priest. Cybernetics and augmetics appear as natural or common implants. Requires a Hard (–20) Scrutiny or Tech-Use Test to detect any tellingly mechanical signs. Mechadendrites and large attachments may be attached or removed in 1d5 hours at the cost of 1 Fatigue. Grants +5 to Fellowship Tests with Imperial citizens outside the Adeptus Mechanicus so long as augmentations are not conspicuous.",
  "genetic-pantropy":
    "Re-roll any Test resulting from extreme environments (intense heat or cold, low oxygen, toxic atmospheres, etc.). Suffer no adverse effects in areas of slightly higher or lower gravity and move normally in them.",
  "labourer-build":
    "Does not use the Fit for Purpose Trait. Instead, gain +3 Strength and +3 Toughness at character creation, but start with –5 Agility.",

  // ─── Core Rulebook — Homeworld Traits ──────────────────────────────────────
  "homeworld-iron-stomach":
    "Food is often scarce on feral worlds and those born on such worlds learn to set aside their revulsion and eat whatever they must to survive. Benefit: You gain a +10 bonus to Carouse Skill Tests made to resist the effects of ingested toxins, poison or tainted foods. This bonus applies to Tests made to consume unusual or unpleasant meals—rotting meat, Grox testes, corpse starch rations, to name a few—as well as Tests made to resist throwing up.",
  "homeworld-primitive":
    "Feral worlders have no time for the mysteries of technology or the rubbishy constraints of etiquette and social niceties. Penalty: You take a –10 penalty on Tech-Use (Int) Tests and a –10 penalty to Fellowship Tests made in formal or civilised surroundings.",
  "homeworld-rite-of-passage":
    "Life is harsh for a feral worlder, and blood spills all too frequently. Whether through surviving a brutal initiation ritual or through tribal teachings, feral worlders are adept at tending bleeding wounds. Benefit: You may spend a Full Action to make an Intelligence Test to staunch Blood Loss (see Chapter VII: Playing the Game on page 211). This is a Full Action. On a success, you manage to stop the bleeding.",
  "homeworld-wilderness-savvy":
    "Feral worlders are accustomed to hunting their own food. Benefit: Navigation (Surface) (Int), Survival (Int) and Tracking (Int) count as Basic Skills for feral worlders.",
  "homeworld-accustomed-to-crowds":
    "Hivers grow up surrounded by immense herds of humanity. They are used to weaving through even the densest mob with ease. Benefit: Crowds do not count as Difficult Terrain for hivers, and when Running or Charging through a dense crowd, hivers take no penalty to the Agility Test to keep their feet.",
  "homeworld-caves-of-steel":
    "To a hiver, surrounded at all times by metal, machinery and industry, the arcane mysteries of technology are not so strange. Benefit: Hivers treat the Tech-Use (Int) skill as a Basic Skill.",
  "homeworld-hivebound":
    "Hivers seldom endure the horrors of the open sky or the indignity of the great outdoors. Penalty: Hivers take a –10 penalty to all Survival (Int) Tests, and while out of a “proper hab” (e.g. places without manufactured goods, solid ceilings and electrical power) the hiver takes a –5 penalty to all Intelligence Tests.",
  "homeworld-wary":
    "Hivers are constantly alert for the first hint of trouble, be it a gang shoot-out, hab riot, or hivequake. Benefit: All hivers gain a +1 bonus to Initiative rolls.",
  "homeworld-blessed-ignorance":
    "Imperial citizens know that the proper ways of living are those that are tried and tested by the generations that have gone before. Horror, pain and death are the just rewards of curiosity, for those that look too deeply into the mysteries of the universe are all too likely to find malefic beings looking back at them. Penalty: Your wise blindness imposes a –5 penalty on Forbidden Lore (Int) Tests.",
  "homeworld-hagiography":
    "Meditation upon the lives—and, more importantly, deaths—of the Emperor’s blessed saints grants Imperial citizens a wide knowledge of the Imperium of Man. Benefit: Imperial worlders treat the Common Lore (Imperial Creed) (Int), Common Lore (Imperium) (Int), and Common Lore (War) (Int) skills as Basic Skills.",
  "homeworld-liturgical-familiarity":
    "Surrounded as they are by folk of the faith, Imperial citizens are accustomed to the preaching of the Ecclesiarchy. Benefit: Imperial world characters treat Literacy (Int) and Speak Language (High Gothic) (Int) as Basic Skills.",
  "homeworld-superior-origins":
    "Imperial citizens know that of all the worlds in the Imperium, theirs is, in fact, the most beloved of the Emperor. Benefit: Increase your Willpower by +3.",
  "homeworld-charmed":
    "The void born unconsciously channel the fickle powers of the warp, making them preternaturally lucky. Benefit: Whenever you spend a Fate Point (though not if you burn one), roll a 1d10. On the roll of a natural 9, you do not lose the Fate Point.",
  "homeworld-ill-omened":
    "Whether because of their strange looks, clannish ways or unwholesome air, the void born are shunned and mistrusted by most. In addition the void born are most likely to attract any negative attention that the party of Acolytes creates—accusations of curdling milk, disgruntled merchants, children with handfuls of Grox dung and so on. Penalty: You take a –5 penalty on all Fellowship Tests made to interact with non-void born humans.",
  "homeworld-shipwise":
    "Birthed in the depths of a spacefaring craft, the void born have a natural affinity for such vehicles. Benefit: Navigation (Stellar) (Int) and Pilot (Spacecraft) (Ag) are Basic Skills for you.",
  "homeworld-void-accustomed":
    "Due to their strange and unnatural childhood, the void born are used to the vagaries of changing gravity. Benefit: You are immune to space travel sickness. In addition, zero- or low-gravity environments are not considered Difficult Terrain for you.",

  // ─── Inquisitor's Handbook — Homeworld Traits ──────────────────────────────
  "homeworld-fit-for-purpose":
    "A forge world inhabitant is repeatedly tested, channelled and trained from birth for their chosen station and role in life. Weakness is not tolerated and failure met with painful incentives to do better. Even those who follow a rogue’s path must strive to be better than their peers to survive. Effect: Depending on your chosen Career, increase your Characteristic by +3: Adept—Intelligence, Assassin—Agility, Guardsman—Ballistic Skill, Scum—Perception, or Tech-Priest—Willpower.",
  "homeworld-stranger-to-the-cult":
    "Although forge world born citizens know that the Emperor is their god and saviour, they see the Imperial Creed through the lens of Cult Mechanicus doctrine. As a result, they can be surprisingly—and sometimes dangerously—ignorant of the common teachings and practices of the Ecclesiarchy, often failing to offer its clerics the level of deference they expect. Effect: Forge world characters take a –10 penalty on Tests involving knowledge of the Imperial Creed, and a –5 penalty on Fellowship Tests to interact with members of the Ecclesiarchy in formal settings.",
  "homeworld-credo-omnissiah":
    "Rather than being fully indoctrinated into the Imperial Cult, even the lowliest member of a forge world’s society is brought up to venerate the spirits of the machine and to know and trust the basic rites of tech-propitiation. Effect: You gain the Technical Knock talent.",
  "homeworld-schola-education":
    "“A progeny’s mind is the product of years of careful instruction in the fundamentals of knowledge and learning.” Effect: Common Lore (Administratum) (Int), Common Lore (Ecclesiarchy) (Int), Common Lore (Imperial Creed) (Int), Common Lore (Imperium) (Int), Common Lore (War) (Int), and Scholastic Lore (Philosophy) (Int) are Basic Skills for you.",
  "homeworld-skill-at-arms":
    "“All progena are instructed by grizzled drill abbots in the arts needed to defend the Emperor’s truth and, no matter what their calling, all are willing and able to shed blood if needed.” Effect: You begin play with the Basic Weapon Training (Las or SP), Melee Weapon Training (Primitive), and Pistol Training (Las or SP) talents.",
  "homeworld-sheltered-upbringing":
    "“Despite their extremely well-rounded education, the progena are largely ignorant of the Imperium’s worse elements, breeding a distain they can’t ever seem to manage to hide.” Effect: You take a –10 penalty on all Charm, Command, Deceive and Scrutiny Tests when dealing with the worst of examples of humanity (cultists, traitors, narco-addicts, gutter scum, mutants and the like).",
  "homeworld-tempered-will":
    "“The harsh methods of the Schola Progenium chiefly aim to forge the most crucial weapon a servant of the Emperor has: an unbending will.” Effect: Whenever you would attempt a Very Hard (–30) Willpower Test, you only take a –20 penalty for your Characteristic instead of the normal –30.",
  "homeworld-etiquette":
    "“Nobles are schooled in how to comport themselves in all manner of formal situations.” Effect: You gain a +10 bonus on Charm, Deceive and Scrutiny Tests when dealing with high authority and in formal situations.",
  "homeworld-supremely-connected":
    "“Nobles have extensive connections and you know that dropping the “right” names into a conversation can open more doors than a fistful of Thrones.” Effect: You begin play with the Peer (Nobility) talent. In addition, you also gain Peer (Academics, Adeptus Mechanicus, Administratum, Astropaths, Ecclesiarchy, Government, Mercantile, Military or Underworld), selecting one category to reflect your family’s powerbase.",
  "homeworld-vendetta":
    "“Every noble house has its sworn enemies and rivals who would do it and its members harm. Joining the Holy Ordos doesn’t stop this, it merely forces those who wish you harm to be a bit more cautious and subtle in exacting their vengeance.” Effect: You have powerful enemies, perhaps in the shape of a rival noble house or some other powerful group. The details of these enemies are left to you and the GM to define, working together to create a formidable threat. While they do not dog your steps at every turn, they are still out there, aiming to inconvenience, harm or kill you when you cross their path, You, of course, are free to return the favour when it’s expedient to do so.",
  "homeworld-engram-implantation":
    "With portions of the subjects’ minds left more or less as blank slates waiting to be filled, their reprogrammers often use egramatic induction to burn a variety of useful skill patterns directly into the Acolyte’s cortex. Effect: You begin play with Deceive (Fel) and Intimidate (S) skills. You treat Common Lore (Tech) (Int) and Survival (Int) as Basic Skills. You also begin with the Jaded and Pistol Weapon Training (SP and Las) talents.",
  "homeworld-failsafe-control":
    "All Mind Cleansed Inquisitorial agents have a failsafe command trigger implanted in their minds to prevent them from turning on their masters. Only the relevant NPC (their Inquisitor for example), should ever have access to this trigger, which usually must be delivered telepathically or by a specific sonic cadence (a simple code phrase is usually judged too risky). Effect: The trigger works just like the use of the Dominate Psychic Power (see page 178 in Dark Heresy). If the trigger is successful, you may be given an order or set of instructions you must carry out to the best of your abilities. However, if the command is antithetical or directly harmful to you, you may receive an appropriate bonus to resist the control.",
  "homeworld-imperial-conditioning":
    "Inquisition mind-scrubs are usually carried out to destroy selective memories but leave useful skills intact. Likewise the mind is often implanted with psychic barriers to prevent tampering, increase mental resilience and ensure loyalty. Effect: You gain a +10 bonus on Willpower Tests made to resist Fear or attempts to control or possess your mind (psychically, chemically or otherwise).",
  "homeworld-through-a-mirror-darkly":
    "The mind cleansing process has numerous side effects, including an eroding effect on the subject’s sanity and unique dangers of its own for the character. Effect: You start play with 1d5+2 Insanity Points. At the GMs discretion, certain rare events, individuals and even things like phrases, sights, and smells may trigger “repressed” memories—roll on Shards of Memory. When this occurs you must pass a Willpower Test or roll on the Shock Table (see page 233 in Dark Heresy)—note that your conditioning and any Talents that resist Fear or Insanity don’t help with this. GM Note: Use this Trait sparingly.",

  // ─── Book of Judgement ─────────────────────────────────────────────────────
  "blank-slate":
    "The Acolyte is imprinted with psychic triggers known only to their handler. One trigger wipes all previous imprinting; another prepares the mind for re-programming. When imprinted, the GM and player choose three Common Lore, Forbidden Lore, Scholastic Lore, or Trade skills appropriate to the assumed identity. Until wiped clean, the Slate-Agent is treated as possessing all chosen Skills and gains +10 to related Tests.",
};
