// src/data/talentDescriptions.ts
// Keyed by TalentData.id. Expand entries as needed.

export const TALENT_DESCRIPTIONS: Record<string, string> = {
  // ─── Core Rulebook ──────────────────────────────────────────────────────────
  "air-of-authority":
    "On a successful Command Test, affect 1d10 + Fellowship Bonus targets. Non-servants may be commanded at a –10 penalty.",
  ambidextrous:
    "No –20 penalty for using your off-hand. With Two-Weapon Wielder, the dual attack penalty drops to –10.",
  "armour-of-contempt":
    "Reduce all Corruption Point gains by 1. Test Willpower as a Free Action to ignore the effects of your Corruption for one Round.",
  "arms-master": "Use ranged weapons you lack training in at –10 rather than –20.",
  "assassin-strike":
    "After a melee attack, test Acrobatics to move at Half Move rate as a Free Action. Your opponent may not take their customary free attack.",
  autosanguine:
    "Always count as Lightly Wounded for healing purposes. Naturally heal 2 points of Damage each day.",
  "basic-weapon-training":
    "Use one group of Basic weapons without penalty. Groups: Bolt, Flame, Las, Launcher, Melta, Plasma, Primitive, SP.",
  "battle-rage": "You may spend Reactions to Parry while in a Frenzied state.",
  "berserk-charge": "Gain +20 to Weapon Skill when Charging instead of the usual +10.",
  "binary-chatter": "+10 to any attempt to instruct, program, or question servitors.",
  blademaster:
    "When attacking with any sword or knife (including chainswords and power swords), re-roll one missed attack per Round.",
  "blind-fighting":
    "Take only half the usual penalties when fighting in environments that obscure your vision, such as fog, smoke, and darkness.",
  "bulging-biceps": "Fire a heavy weapon on semi- or autofire without first bracing.",
  catfall:
    "Test Agility as a Free Action when falling. On a success, reduce the distance fallen by your Agility Bonus per degree of success for damage purposes.",
  "chem-geld":
    "Seduction attempts against you automatically fail. Charm Tests against you increase one difficulty step. Gain 1 Insanity Point when taken.",
  "cleanse-and-purify":
    "Targets exposed to your flamer attacks take a –20 penalty to avoid being hit.",
  "combat-master": "Opponents gain no bonus to Weapon Skill for outnumbering you in melee.",
  "concealed-cavity":
    "You have a hidden compartment on your person for one small item no bigger than your palm. Finding it requires a Difficult (–10) Search Test; a medicae scanner or chem-sniffer reduces this to Ordinary (+10).",
  "corpus-conversion":
    "For every 2 points of Damage you voluntarily take, add your Willpower Bonus to your Power Roll. Free Action.",
  "counter-attack":
    "After a successful Parry, immediately make an attack against that opponent using the weapon that made the Parry, at a –20 penalty.",
  "crack-shot": "When your ranged attack deals Critical Damage, deal an extra 2 points.",
  "crippling-strike":
    "Whenever you deal Critical Damage with a melee weapon, deal an additional 1d5–1 points.",
  "crushing-blow": "Add +2 to Damage you inflict in melee.",
  "dark-soul": "Whenever you make a Malignancy Test, take half the normal penalty.",
  "deadeye-shot": "Called Shots are at a –10 penalty instead of the normal –20.",
  decadence:
    "Do not pass out from alcohol until failing Toughness Tests equal to twice your Toughness Bonus. Gain +10 to tests to continue using drugs within 24 hours.",
  "deflect-shot":
    "Spend a Reaction to Parry an incoming ranged attack from a Primitive or Thrown weapon.",
  "die-hard":
    "When you suffer from Blood Loss, roll twice to avoid death and take the better result.",
  disarm:
    "While engaged with an opponent wielding a melee weapon, use a Full Action to make an Opposed Weapon Skill Test. If you win the Opposed Test, your opponent drops their weapon at their feet. Three or more degrees of success lets you take the weapon.",
  "discipline-focus":
    "Gain +2 to Power Rolls when manifesting powers from your chosen Discipline. Groups: Biomancy, Divination, Pyromancy, Telekinetics, Telepathy.",
  "disturbing-voice":
    "+10 to Intimidate and Interrogation Tests when using your voice. –10 to Fellowship Tests with anyone likely to be unsettled by your manner.",
  "double-team":
    "When ganging up on an opponent with an ally, gain an additional +10 to Weapon Skill Tests. If both of you have this Talent, you both gain +10 for a total of +20, on top of the normal outnumbering bonus.",
  "dual-shot":
    "Full Action: fire two pistols simultaneously. Make a single Ballistic Skill Test; on a success, both shots hit the target.",
  "dual-strike":
    "Full Action: attack with two melee weapons simultaneously. Make a single Weapon Skill Test; on a success, both weapons hit the target.",
  "electrical-succour":
    "Ordinary (+10) Toughness Test while in contact with a functioning powered machine or fully charged battery. Remove one level of Fatigue plus one per degree of success. Takes one minute.",
  "electro-graft-use":
    "+10 to Common Lore, Inquiry, and Tech-Use Tests while connected to a data point via electro graft.",
  "energy-cache":
    "No longer gain Fatigue from using Luminen Charge, Luminen Shock, or Luminen Blast.",
  "exotic-weapon-training": "Use one specific Exotic weapon without penalty.",
  "favoured-by-the-warp":
    "Whenever a Power Roll triggers Psychic Phenomena, roll two dice on the table and take the more favourable result.",
  fearless:
    "Immune to Fear and Pinning. To disengage from combat or back down from a fight, you must first succeed on a Willpower Test.",
  "feedback-screech":
    "Full Action: all creatures within 30m (except Daemonic and machine-based) must test Willpower or lose a Half Action on their next Turn. Cannot be used again for 1d5 Rounds.",
  "ferric-lure":
    "Test Willpower as a Full Action to call one visible, unsecured metal object up to 1 kg per Willpower Bonus to your hand. The object must be within 20m.",
  "ferric-summons":
    "Test Willpower as a Full Action to call one visible, unsecured metal object up to 2 kg per Willpower Bonus to your hand. The object must be within 40m.",
  flagellant:
    "Spend 20 minutes daily in prayer, inflicting 1 Damage on yourself (which cannot be healed), to gain +10 to Willpower Tests to resist mind control or Malignancy. With Frenzy, may enter it as a Free Action. Failing to flagellate imposes –5 to all Tests that day.",
  foresight:
    "Spend ten minutes contemplating a problem to gain +10 to your next relevant Intelligence Test.",
  frenzy:
    "Spend one Round to enter Frenzy: +10 Strength and Willpower, –10 Weapon Skill and Intelligence. Must attack the nearest enemy in melee and use All-Out Attack whenever possible; may not flee, retreat, or Parry. Lasts for the duration of combat. Cannot use Psychic Powers unless you have Mental Rage.",
  "furious-assault":
    "When you hit an opponent using the All-Out Attack Manoeuvre, spend your Reaction to make one additional attack, retaining the original attack's bonuses and penalties.",
  "good-reputation":
    "+10 to Fellowship Tests when dealing with your chosen group. Stacks with Peer for a total of +20.",
  "gun-blessing":
    "Full Action: make an Intelligence Test to unjam a number of guns equal to your Intelligence Bonus within a 10m radius.",
  gunslinger:
    "Reduce the penalty for fighting with two pistols by –10. With Ambidextrous, take no penalty when firing both.",
  "hard-target":
    "When you Charge or Run, all opponents take –20 to Ballistic Skill Tests to hit you with ranged attacks, until the start of your next Turn.",
  hardy: "For the purposes of removing Damage, you are always considered to be Lightly Wounded.",
  hatred:
    "Choose one race or group. When fighting members of that group, gain +10 to all Weapon Skill Tests made to attack them.",
  "heavy-weapon-training":
    "Use one group of heavy weapons without penalty. Groups: Bolt, Flame, Las, Launcher, Melta, Plasma, Primitive, SP.",
  "heightened-senses": "Choose one of the five senses. Gain +10 to any Tests involving that sense.",
  "hip-shooting":
    "Full Action: simultaneously move up to your Full Move rate and make a single attack with a pistol.",
  "independent-targeting":
    "When firing two weapons at once, you may attack targets that are more than 10m apart.",
  "insanely-faithful":
    "When rolling for the effects of Shock, roll twice and take the better result.",
  "into-the-jaws-of-hell": "While visible to your minions, they are immune to Fear and Pinning.",
  "iron-discipline":
    "While visible to your minions, they may re-roll failed Willpower Tests made to resist Fear and Pinning.",
  "iron-jaw": "When you become Stunned, make a Toughness Test to shrug off the effect.",
  jaded:
    "Never gain Insanity Points from the sight of blood, death, violence, or any ordinary horror. Supernatural terrors still affect you as normal.",
  "leap-up": "Stand up from prone as a Free Action.",
  "light-sleeper":
    "Always count as awake for Awareness Tests, being Surprised, or getting up in a hurry — even when asleep.",
  "lightning-attack":
    "Full Action: make three melee attacks. Replaces Swift Attack. Cannot be combined with Dual Strike.",
  "lightning-reflexes": "Add twice your Agility Bonus when rolling for Initiative.",
  "litany-of-hate":
    "Full Action Charm Test: on a success, grant +10 to Weapon Skill Tests against your hated foes to one target per Fellowship Bonus. Lasts for the encounter.",
  "logis-implant":
    "Reaction: make a Tech-Use Test to activate. On success, gain +10 to Weapon Skill and Ballistic Skill until the end of your next Turn. Each successful use causes one level of Fatigue.",
  "luminen-blast":
    "Ballistic Skill Test to direct bio-electrical energy at a target within 10m, dealing 1d10 + Willpower Bonus Energy Damage. Each use causes one level of Fatigue.",
  "luminen-charge":
    "Toughness Test to power or recharge machinery with your bio-electrical field. Example difficulties: Ordinary (+10) for a chemical battery or glow globe; Challenging (+0) for a lasgun charge pack, data-slate, or personal heater; Difficult (–10) for an overcharge pack, air-conditioning unit, or servo-skull; Hard (–20) for a land speeder engine, lascannon charge pack, or servitor; and Very Hard (–30) for an industrial press, cogitator engine, or xenos technology. At the GM's discretion, some technology may be too arcane, broken, or power-hungry to activate. Takes one minute. Each use causes one level of Fatigue.",
  "luminen-shock":
    "Touch an enemy (requires a Weapon Skill Test or Grappling) to deal 1d10+3 Energy Damage. Each use causes one level of Fatigue.",
  "maglev-grace":
    "Half Action: hover 20–30cm off the ground for 1d10+Toughness Bonus minutes and move at normal walking speed; requires a Half Action each Round to maintain. May activate while falling to treat all falling Damage as 1d10+3 Impact. Once per 12-hour period.",
  "maglev-transcendence":
    "Half Action: hover 20–30cm off the ground for 2d10+Toughness Bonus minutes at running speed; requires a Half Action each Round to maintain. If active when landing, take no Damage from falling. Twice per 12-hour period.",
  marksman: "No penalties for shooting at Long or Extreme range.",
  "master-chirurgeon":
    "+10 to all Medicae Tests. Heals 2 Wounds instead of 1 for Heavily or Critically Wounded patients. Grants the patient +20 to Toughness Tests to resist limb loss from Critical Hits.",
  "master-orator":
    "Fellowship Tests and Fellowship-based Skill Tests can affect 10 times the normal number of targets.",
  "mechadendrite-use":
    "You have the training, initiation, and hypnodoctrination to use one type of mechadendrite. Groups: Gun, Manipulator, Medicae, Optical, Utility.",
  meditation:
    "Make a Willpower Test and enter a trance. For every ten minutes in the trance, remove one level of Fatigue.",
  "melee-weapon-training":
    "Use one group of melee weapons without penalty. Groups: Primitive, Chain, Shock, Power.",
  "mental-fortress":
    "When targeted by a psychic attack, force the psyker to make a Willpower Test. On a failure, the psyker takes 1d10 + Willpower Bonus Impact Damage to the head, bypassing Armour and Toughness Bonus. The psyker may reduce this Damage by their Willpower Bonus.",
  "mental-rage": "You may use Psychic Powers while in a Frenzied state.",
  "mighty-shot": "Add +2 to Damage you inflict with ranged weapons.",
  mimic:
    "Copy a person's voice after listening to them for at least one hour; you must understand their language and be of the same race. Listeners must pass a Difficult (–10) Scrutiny Test to detect the deception. If based on recordings rather than live conversation, difficulty drops to Challenging (+0). The deception automatically fails if a listener can clearly see that you are not the person being mimicked.",
  "minor-psychic-power": "Gain one Minor Psychic Power.",
  "nerves-of-steel": "Re-roll a failed Willpower Test to avoid or recover from Pinning.",
  orthoproxy: "+20 to Willpower Tests to resist mind control or interrogation.",
  paranoia:
    "+2 to Initiative rolls. The GM may secretly Test your Perception to notice hidden threats.",
  peer: "+10 to all Fellowship Tests when interacting with your chosen group.",
  "pistol-training":
    "Use one group of pistols without penalty. Groups: Bolt, Flame, Las, Launcher, Melta, Plasma, Primitive, SP.",
  "power-well":
    "+1 to Manifesting rolls when using Psychic Powers. May be taken multiple times; effects are cumulative.",
  "precise-blow":
    "When making a Called Shot with a melee weapon, do not incur the normal –20 penalty.",
  prosanguine:
    "Once per 12 hours, make a Tech-Use Test to remove 1d5 Damage. On a roll of 96–100, the test fails and implants cease to function for one week, losing benefits of both Prosanguine and Autosanguine. Takes ten minutes to activate.",
  "psy-rating-1":
    "Unlock Psychic Powers. Select Minor Powers equal to half your Willpower Bonus (round up). Gain Psy Rating 1: roll 1d10 + Willpower Bonus when manifesting powers. Later increases to your Willpower Bonus do not retroactively grant additional powers.",
  "psy-rating-2":
    "Select Minor Powers equal to half your Willpower Bonus (round up). Gain Psy Rating 2: roll up to 2d10 + Willpower Bonus when manifesting powers. Later increases to your Willpower Bonus do not retroactively grant additional powers.",
  "psy-rating-3":
    "Choose a Discipline and gain one power from it. Select Minor Powers equal to half your Willpower Bonus (round up). Gain Psy Rating 3: roll up to 3d10 + Willpower Bonus when manifesting powers. Later increases to your Willpower Bonus do not retroactively grant additional powers.",
  "psy-rating-4":
    "Gain Discipline powers equal to half your Willpower Bonus, rounded up, in any known Discipline plus the same number of Minor Powers — or instead choose a new Discipline and gain one power. Gain Psy Rating 4: roll up to 4d10 + Willpower Bonus when manifesting powers. Later increases to your Willpower Bonus do not retroactively grant additional powers.",
  "psy-rating-5":
    "Gain Discipline powers equal to half your Willpower Bonus, rounded up, in any known Discipline — or instead choose a new Discipline and gain one power. Gain Psy Rating 5: roll up to 5d10 + Willpower Bonus when manifesting powers. Later increases to your Willpower Bonus do not retroactively grant additional powers.",
  "psy-rating-6":
    "Gain Discipline powers equal to half your Willpower Bonus, rounded up, plus the same number of Minor Powers — or instead choose a new Discipline and gain one power. Gain Psy Rating 6: roll up to 6d10 + Willpower Bonus when manifesting powers. Later increases to your Willpower Bonus do not retroactively grant additional powers.",
  "psychic-power": "Gain one Psychic Power from any Discipline you know.",
  "quick-draw": "Ready as a Free Action.",
  "rapid-reaction": "When Surprised or ambushed, test Agility to act normally.",
  "rapid-reload":
    "All reload times are halved (round down). A Half Action reload becomes a Free Action; a Full Action reload becomes a Half Action.",
  resistance:
    "+10 to Tests made to resist or avoid your chosen group. Groups: Cold, Fear, Heat, Poisons, Psychic Powers.",
  "rite-of-awe":
    "Recite an infrasonic liturgy over two minutes. All humans within 50m, regardless of their ability to hear, take –10 to their next Skill Test, resisted by a Willpower Test. You cannot speak on another frequency while reciting.",
  "rite-of-fear":
    "Recite an infrasonic dirge over two minutes. All humans within 50m, regardless of their ability to hear, treat you as having Fear Rating 1. You cannot speak on another frequency while reciting.",
  "rite-of-pure-thought":
    "The right half of your brain is replaced with a cogitator. Immune to Fear, Pinning, and effects that cause emotional disturbance. Your GM will remove any Mental Disorders no longer relevant and replace them with new ones of equal severity.",
  sharpshooter:
    "When making a Called Shot, do not incur the normal –20 penalty. Replaces Deadeye Shot.",
  "sound-constitution":
    "Gain one additional Wound. May be purchased multiple times if your advance scheme allows it.",
  sprint:
    "On a Full Move, gain extra metres equal to your Agility Bonus. On a Run, double your Movement for one Round. Using this Talent two turns in a row causes one level of Fatigue.",
  "step-aside":
    "Gain one additional Dodge per Round — a second Reaction usable only to Dodge. You may still only attempt a single Dodge against any one attack.",
  "street-fighting":
    "When dealing Critical Damage with an unarmed attack or a knife, deal +2 points of Damage.",
  "strong-minded":
    "Re-roll failed Willpower Tests to resist Psychic Powers that affect your mind. Powers with physical effects such as Telekinesis are unaffected.",
  "sure-strike":
    "When hitting in melee, you may use the dice as rolled or reverse their digits to select the hit location you prefer.",
  "swift-attack": "Full Action: make two melee attacks.",
  takedown:
    "Half Action: declare before making a Weapon Skill Test that you are attempting a Takedown. If you hit and deal at least 1 Damage, that Damage is ignored and your opponent must test Toughness or be Stunned for one Round.",
  talented: "Choose one Skill. Gain +10 to Tests when using that Skill.",
  "technical-knock": "Unjam any gun as a Half Action by touching it. One weapon per Round.",
  "thrown-weapon-training":
    "Use one group of thrown weapons without penalty. Groups: Primitive, Chain, Shock, Power.",
  "total-recall":
    "Automatically remember any trivial fact you might feasibly have picked up. For detailed or obscure information, the GM may require an Intelligence Test.",
  "true-grit": "Whenever you suffer Critical Damage, halve the result (rounding up).",
  "two-weapon-wielder":
    "Full Action: attack with both weapons, each at –20. Must be taken separately for Melee and Ballistic. Both versions are required to use a gun and hand weapon simultaneously.",
  unremarkable:
    "Attempts to notice you in a crowd, or to describe or recall details about you, suffer a –20 penalty.",
  "unshakeable-faith": "Re-roll any failed Willpower Test to avoid the effects of Fear.",
  "wall-of-steel":
    "Gain one additional Parry per Round — a second Reaction usable only to Parry. You may still only attempt a single Parry against any one attack.",

  // ─── Blood of Martyrs ───────────────────────────────────────────────────────
  "blessed-ignorance":
    "The faithful and allies up to his Fellowship Bonus cannot perceive anything that would force a Fear Test, inflict Insanity Points, or inflict Corruption Points — warp entities directed at them become effectively invisible, though the faithful must fight them blind. Can be combined with Master Orator to affect more allies. Burn: Used retroactively after an encounter, the faithful and affected allies completely forget the recent events and negate any Corruption Points, Insanity Points, or lasting Fear effects gained as a result of that encounter.",
  "burden-of-guilt":
    "Any character who can hear the faithful's voice, either face to face or remotely through a device such as a vox, and whose Willpower is no higher than the faithful's must win an Opposed Willpower Test against the faithful to tell a direct lie without coughing and choking. The GM may grant the target +10 to +30 depending on how far it bends the truth and the lie's severity. Clever characters may avoid lying directly by refusing to answer or changing the subject. Characters with higher Willpower are normally unaffected. Burn: The faithful automatically wins against an ordinary target and may attempt the Opposed Test against a target with higher Willpower.",
  "chain-weapon-expert":
    "When wielding a Chain weapon capable of striking its user, such as an Eviscerator, any hit against yourself deals Impact Damage equal to your unmodified Strength Bonus instead of the weapon's full Damage. Reduce this Damage normally with the location's Armour and your Toughness Bonus.",
  "daemon-trap":
    "The faithful draws a protective circle (any materials; up to Willpower Bonus in metres diameter; takes at least 5 minutes). Any daemon stepping into or crossing the circle must pass a Hard (–20) Willpower Test or become trapped and unable to leave. Trapped daemons can otherwise act normally but cannot disturb the circle; if they attempt to use a psychic power their Threshold increases by 10. The circle remains until broken. Burn: The faithful can construct circles up to 10× his Willpower Bonus in metres (takes at least 1 hour).",
  "divine-endurance":
    "The faithful and allies up to his Fellowship Bonus become immune to Fatigue — existing Fatigue levels and any gained during the ability are ignored. At the GM's discretion, the effect may last for the course of a journey undertaken for a suitably holy purpose. Can be combined with Master Orator to affect more allies. Burn: For the duration of the encounter, those affected gain the Unnatural Toughness (×2) Trait.",
  "divine-guidance":
    "The faithful and allies up to his Fellowship Bonus may ignore one penalty of any size on a ranged attack. If multiple penalties apply, only the largest may be ignored. After scoring and confirming Righteous Fury with a second attack roll, its effects may be sacrificed to ignore the target's Armour for that hit, leaving only Toughness Bonus to reduce Damage. Burn: All ranged attack penalties are ignored when their combined total is no worse than –60, and affected characters may fire blind without penalty if the target is in the path of fire.",
  "divine-ministration":
    "After succeeding on a Medicae Test, the faithful may add his Willpower Bonus once to the Damage healed; this may cover successive Tests and multiple targets. Alternatively, he may remove all Fatigue from allies who can see and hear him. All Medicae Tests become one step easier, such as Difficult (–10) becoming Challenging (+0), or Challenging (+0) becoming Ordinary (+10). Only subjects with 20 or fewer Corruption Points can benefit. Burn: Using Medicae restores all Wounds to one ally.",
  "divine-symbol":
    "The faithful inscribes a divine symbol on himself or an ally. The bearer is immune to possession, gains +30 on all Tests to resist psychic powers (from any source), and warp creatures suffer –10 to hit the bearer with natural weapons. Does not work on subjects with more than 20 Corruption Points. Burn: The faithful can inscribe symbols on himself and allies equal to his Willpower Bonus.",
  "divine-touch":
    "The faithful touches a psyker or creature with 20 or more Corruption Points on exposed skin (standard melee attack; this may be a Called Shot at –20 at the GM's discretion). On a failed Challenging (+0) Willpower Test, roll 1d5+2 and apply that Energy Critical Effect to the location touched without inflicting Wounds, though Stunning and Fatigue still apply. Against a daemon, directly force a Warp Instability Test at –30. Burn: The faithful may make Divine Touch attacks until the end of the encounter, rolling 1d10+2 for Critical Effects; daemons instead make the Instability Test at –60.",
  "drill-instruction":
    "Choose one Basic, Pistol, or Melee Weapon Training Talent the character possesses and make a Challenging (+0) Command Test to temporarily grant it to all those under the character's command (including other Acolytes) who obey. The effect lasts until the end of the encounter or until this Talent is used again.",
  "flame-weapon-expert":
    "When wielding a Flame Weapon, the character knows exactly when and how much promethium to use to operate it properly. The character may treat all Flame weapons as Reliable.",
  "flames-of-faith":
    "As a Full Action, the faithful blesses one burning fire up to twice his Fellowship Bonus in diameter, one clip of incendiary ammunition including a grenade or rocket, or one flame weapon; melta and plasma weapons cannot be blessed. The blessed source deals +1d10 Damage and imposes –10 on Agility Tests to avoid catching fire. Against daemons it deals a further +1d10 Damage and counts as a holy attack. Burn: The additional Damage becomes +2d10 and all Damage counts as Explosive rather than Energy.",
  grace:
    "The faithful can share Fate Points with allies, spending one to allow an ally he can see to re-roll a failed Test. Additionally, the faithful recovers any Fate Points spent this encounter (including the activation cost) on a 1d10 roll of 8, 9, or 10 — replacing Charmed if Void Born. Only works on humans with 20 or fewer Corruption Points. Burn: At the end of the encounter every visible ally regains one spent Fate Point and may regain another on a roll of 8, 9, or 10.",
  "hand-of-the-emperor":
    "The faithful and allies up to his Fellowship Bonus gain the Unnatural Strength (×2) trait, but their Agility Bonus is reduced by 2 for the duration due to lumbering slowness. Burn: The faithful and his allies gain Unnatural Strength (×3) rather than (×2).",
  "hit-and-run":
    "A Seraphim with this talent may make a Disengage action as a Half Action. If she takes a Full Action to disengage, she moves her full Jump Pack speed rather than half.",
  "holy-hatred":
    "Against any target that is not a true servant of the Imperium of Mankind (GM's discretion), the Celestian is treated as having the Hatred talent. If she already has Hatred appropriate to that target, she gains an additional +5 to WS Tests to hit. This bonus cannot be shared via Litany of Hate.",
  "holy-light":
    "The faithful burns with bright white inner light, illuminating 10 metres as daylight and the next 10 metres as twilight. Melee and Point Blank ranged attacks against him suffer –20, while ranged attacks at Long and Extreme Range gain +10. Creatures with 20 or more Corruption Points, daemons, and psykers within 5 metres suffer 1d10 Energy Damage each round to their least armoured location, reduced normally by Armour and Toughness Bonus, and must pass an Easy (+20) Willpower Test each round or catch fire. Burn: The effects last for the entire game session.",
  "holy-radiance":
    "All allies who can both see and hear the faithful gain immunity to Daemonic Presence as if they had the Pure Faith Talent, and +10 on all Fear Tests regardless of source. Burn: Allies are immediately freed from Fear and any ongoing psychic powers cast by daemons, and become immune to Fear for the remainder of the encounter.",
  "light-of-the-emperor":
    "The faithful and allies up to twice his Fellowship Bonus gain +20 to Fear Tests and need not test against Fear Rating 1. All affected characters suffer –20 on Interaction Skill Tests. Can be combined with Master Orator. Burn: The effects last for the entire game session.",
  "litany-of-battle":
    "The Sister of Battle may spend a Fate Point to allow an ally who can hear her to re-roll a failed Weapon Skill or Ballistic Skill test. Characters may still only re-roll a test once.",
  "martyrs-gift":
    "As a Full Action while the subject remains still, the faithful transfers Damage from a wounded creature to himself at a 1:1 ratio. Each Critical Effect healed costs the faithful 5 Wounds. If the faithful suffers Critical Damage through this healing, it counts as Energy Damage. Burn: The faithful may return a recently deceased creature whose body is relatively intact as if it had burned a Fate Point; doing so removes all of the faithful's Wounds and inflicts 1d10 Critical Damage that is not reduced by Armour or Toughness Bonus.",
  "mental-calm":
    "As a Full Action in the turn after the faithful or an ally gains Insanity Points, negate 1d5 Insanity Points gained by the faithful or one ally in the previous round. For the rest of the encounter, that character reduces each further gain of Insanity Points by 1. Burn: The Talent affects the faithful and allies up to twice his Fellowship Bonus.",
  "might-of-the-emperor":
    "The faithful increases Strength, Toughness, and Agility by +10, but decreases Perception, Intelligence, and Fellowship by –10; Willpower is unaffected. He speaks in religious riddles requiring a Hard (–20) Intelligence Test or Challenging (+0) Common Lore (Imperial Creed) Test to understand. Burn: The effects last for an entire game session.",
  "miraculous-recovery":
    "The faithful spends a night praying over a creature to remove one crippling injury (e.g. broken limb or missing nose) — but not missing limbs or eyes. Upon completion both the faithful and the subject suffer 1d5 Insanity Points which cannot be prevented by any means. Only subjects with 20 or fewer Corruption Points can benefit. Burn: Even missing limbs or eyes can be restored.",
  "miraculous-survival":
    "When the Sister of Battle burns a Fate Point to avoid death, she stands up at the beginning of her next action completely unharmed — full Wounds, no Fatigue, and cured of all critical effects, even those sustained before the death event.",
  "no-rest-for-the-faithful":
    "The faithful and allies up to his Fellowship Bonus ignore Critical Effects except limb loss and death. A character subject to a death effect may instead permanently lose 1d10 Toughness and suffer a lesser Critical Effect chosen by the GM from the same location and Damage type. At the encounter's end, everyone who benefited suffers 1d5 Fatigue. Burn: Limb-loss effects may also be ignored until the end of the encounter, when they take effect.",
  "only-in-death":
    "Once per encounter, the Repentia may add +1d10 damage to her next melee attack that hits. Whether or not damage is dealt, the Repentia then suffers 1d5 Wounds not reduced by armour or Toughness.",
  "pure-faith":
    "Completely immune to Daemonic Presence. May spend a Fate Point to ignore a Fear Test before rolling, or to avoid gaining any Insanity or Corruption Points for an encounter at the GM's discretion. To ignore one daemonic psychic attack, the faithful must burn a Fate Point before resistance rolls are made or the power takes effect.",
  "religious-hysteria":
    "After preaching for at least 10 minutes to a crowd of any size that can see and hear the faithful in person, without technology, and pays attention for the entire sermon, make an Opposed Willpower Test against the crowd. On success, hysteria spreads for 24 hours: each person the mob encounters must pass a Challenging (+0) Willpower Test or join it. The faithful may direct the mob against reasonable enemies, and it gains Hatred against the chosen foe. This is not mind control and cannot make people act recklessly or wildly out of character. Burn: Those affected also gain Righteous Frenzy.",
  "repel-daemon":
    "Any creature of the warp must win an Opposed Willpower Test to approach within 3× the faithful's Willpower Bonus in metres; on a second failure it cannot touch the faithful. Creatures within that radius are immediately pushed back to 3× Willpower Bonus distance. Protects only the faithful, not allies, and does not prevent ranged or psychic attacks. Burn: The effects last for the entire game session.",
  respite:
    "The faithful must spend a Full Action each Round praying so that one ally who can see and hear him may ignore Fatigue and Critical Effects. This does not heal: missing limbs remain missing, bleeding continues, and a fatal effect still kills. Burn: The Talent can affect allies up to twice the faithful's Fellowship Bonus.",
  resurrection:
    "Whenever the faithful or an ally (who can hear the faithful) dies and spends a Fate Point to avoid death, the faithful revitalises them: the target is restored to full Wounds, all Critical damage and Fatigue are removed, crippled limbs and blindness are healed (not lost limbs), and toxins are negated. Burn: For the duration of the encounter (provided the faithful is alive), whenever the faithful or any ally burns a Fate Point to avoid death, they automatically benefit from the full effects of Resurrection.",
  revelation:
    "As a Full Action, the faithful and allies up to his Fellowship Bonus who can see and hear him immediately overcome Fear and Shock and may act normally from their following Turn. Each may also make a Challenging (+0) Willpower Test to end detrimental ongoing psychic powers. Can be combined with Master Orator. Burn: Those affected automatically pass Fear Tests for the rest of the encounter.",
  "righteous-frenzy":
    "As a Full Action (chanting and screaming prayers), the faithful and allies up to his Fellowship Bonus who can see and hear him enter a frenzy identical to the Frenzy Talent, except those affected will never attack each other. If the faithful already has the Frenzy Talent, he may trigger it as a Free Action. Can be combined with Master Orator. Burn: Whenever a frenzied character kills a foe, he immediately recovers 1d5 Wounds (only the killing-blow character benefits).",
  "seal-of-purity":
    "The faithful takes at least 1 hour to create a sacred seal using chalk, bones, blood, or similar materials. No daemon or other creature of the warp can cross the seal or approach within 10 metres, directly disturb it, or project a psychic power across it. The seal lasts until broken; greater daemons are unaffected. Burn: The seal also repels creatures with 20 or more Corruption Points or Psy Rating 3 or higher.",
  "soul-decay":
    "The faithful speaks to a creature he can see and that can hear him. If its Willpower is no higher than his and its Wounds are no more than twice his Wounds, make an Opposed Willpower Test. On failure, the target is affected for the remainder of the encounter: a target with any Corruption Points suffers –10 to all Tests, while a daemon or psyker also suffers 1 unsoakable Damage each Round until it flees the faithful's sight. Burn: All creatures within the faithful's sight are affected.",
  "soul-storm":
    "As a Full Action, the faithful conjures holy energy in a radius of 10× his Willpower Bonus metres. Psykers and anyone with any Corruption Points suffer 1d10 unsoakable Energy Damage. A psyker who fails a Challenging (+0) Willpower Test suffers another 1d10 Damage and loses access to psychic powers for the rest of the encounter. A corrupted target suffers +1 Damage per Corruption Point. Daemons suffer 1d10 Damage and must pass a Challenging (+0) Willpower Test or lose their powers; daemons with Willpower 50 or higher are unaffected. The faithful gains Fatigue equal to his Toughness Bonus and cannot use Soul Storm again for 24 hours. Burn: All Damage is doubled.",
  "spirit-of-the-martyr":
    "The faithful and allies up to his Fellowship Bonus add the faithful's Willpower Bonus to Toughness Bonus when reducing Impact and Rending Damage, and reduce all Critical Damage by 1. Burn: The faithful alone ignores death effects until the end of the encounter, though he may still lose limbs; afterward he dies normally unless he burns a Fate Point.",
  "spiritual-cleansing":
    "As a Full Action (usable in the turn he or any ally gains Corruption Points), the faithful negates 1d5 Corruption Points gained by himself or one ally in the previous round. The warp protection invoked remains for the rest of the encounter, reducing any further Corruption Point gains by 1. Characters with 20+ Corruption Points cannot benefit. Burn: The Talent affects both the faithful and allies up to twice his Fellowship Bonus.",
  "spiritual-mirror":
    "The faithful and allies up to his Fellowship Bonus are protected. Whenever a protected character suffers a result from the Shock Table, the source of the Fear must pass a Challenging (+0) Willpower Test or suffer the identical Shock result. Creatures immune to Fear are unaffected. Burn: Protected characters still make Fear Tests and roll on the Shock Table but are not affected by the result.",
  "tests-of-faith":
    "Once per game session, the Battle Sister may activate an Emperor's Wrath Faith talent without spending a Fate Point. The effect activates as if a Fate Point had been spent, but not as if it had been burned.",
  "the-passion":
    "The faithful and allies up to his Fellowship Bonus gain the Unnatural Agility (×2) trait, +10 to both Dodge and Parry, and roll two dice for Initiative choosing the highest. Burn: The faithful and allies gain Unnatural Agility (×3) rather than (×2).",
  "the-unforgiving-blade":
    "The faithful blesses a single Rending melee weapon, granting it +1d10 extra damage and +2 Pen against daemons, psykers, and creatures with 20+ Corruption Points. Blows count as holy attacks against daemons. Any psyker or character with 20+ Corruption Points who grasps the weapon suffers 1d5 Energy Damage per round (not reduced by armour or Toughness). Burn: The faithful can bless weapons equal to twice his Fellowship Bonus (a Half Action per weapon).",
  "wrath-of-the-righteous":
    "The faithful and allies up to his Fellowship Bonus who can see and hear him add +1d5 to melee Damage. Righteous Fury triggers on a 9 or 10 on the initial Damage roll only, not on later open-ended rolls. Can be combined with Master Orator. Burn: The melee Damage bonus increases to +2d10.",

  // ─── Haarlock's Legacy III / Chaos Commandment ───────────────────────────────
  "touched-by-the-fates":
    "NPC only; cannot apply to Daemons or non-living creatures. The NPC has Fate Points equal to half its Willpower Bonus, rounded up, and may spend or burn them normally, with survival after burning occurring off-camera. A defeated NPC returns only when that defeat would resolve the scenario in the Acolytes' favour. Righteous Fury rules also apply to this NPC.",

  // ─── Disciples of the Dark Gods ─────────────────────────────────────────────
  "consumed-by-spite":
    "+10 to resist Fear and mind control; +30 to resist Intimidation and Interrogation. May ignore Stun effects with a Difficult (–10) WP Test.",
  sorcerer:
    "Count as having an effective Psy Rating of 2 for sorcery. The sorcerer may know Arcana slots equal to three times Willpower Bonus, with each Major Arcana counting as two slots, without requiring additional Talents. Arcana choices are not restricted by the normal Discipline framework, but the rituals must still be learned or researched independently. Characters who already have a normal Psy Rating use the special Disciples of the Dark Gods rules.",
  "master-sorcerer":
    "Count as having an effective Psy Rating of 4 for sorcery, gain +10 to Daemonic Mastery Tests, and become immune to Daemonic Presence. Characters who already have a normal Psy Rating use the special Disciples of the Dark Gods rules.",
  "minor-arcana":
    "Gain one additional Minor Arcana power beyond the normal amount allowed. The power must still be learned or researched as normal.",
  "major-arcana":
    "Gain one additional Major Arcana power beyond the normal amount allowed. The power must still be learned or researched as normal.",
  "sublime-arts":
    "May use sorcery without obvious vocalisations, gestures, or other outward signs, enacting the required patterns mentally through concentration and will, but the power's Threshold increases by 2.",
  "psychic-spite":
    "When using a damaging Psychic Power in conjunction with Corpus Conversion, that attack gains the Tearing quality.",
  "psychic-supremacy":
    "When using half or fewer of your maximum Power Dice for your chosen Discipline, ignore the first 9 rolled when checking for Psychic Phenomena, though it still counts toward the power's Threshold. Any later 9 triggers Psychic Phenomena normally. Attempts to detect or trace the power suffer –10.",
  "psychic-vampire":
    "When you directly kill an intelligent, self-willed, non-Warp creature with psychic energy, make a Challenging (+0) Willpower Test to heal 1d5–1 Wounds without exceeding your normal maximum. Daemons, servitors, animals, and machines do not qualify. Healing is a Free Action. Player Characters gain 1d5–2 Corruption Points and the effect is Addictive.",

  // ─── Inquisitor's Handbook ──────────────────────────────────────────────────
  "beast-hunter":
    "Many feral worlders were beast hunters long before they saw Imperial service. Of them, many come from cultures where, to survive their forbears, they had to become adept at bringing down the largest and most dangerous of prey. Such hard-won wisdom is rarely forgotten by their descendants. Whenever you score a Critical Effect against a creature with a Size class of Hulking or larger, increase your Damage by +3. This does not apply to artificial constructs such as servitors, warp creatures such as Daemons, entities with the From Beyond trait, or things with a completely unrecognisable anatomy.",
  "machinator-array":
    "The tech-priest’s cyber-mantle and potentia coil have been further upgraded to handle more powerful loads and heavy gear, as well as armour their vital organs against damage and reinforce their limbs to support the extra weight. This has an effect of increasing the Secutor’s size and bulk somewhat and adding to their strength and durability. Increase your Strength and Toughness Characteristics by +10 each and reduce your Agility and Fellowship both by −5. You now also weigh around three times as much as a normal person of your size and you may no longer swim. You also suffer a −10 to Move Silently Tests. Thanks to your additional augmetics any Ballistic Mechadendrite you possess may mount a single Pistol weapon or one-handed Melee weapon rather than the usual compact laser design (you must have the appropriate Talent to use it).",
  "the-reaping":
    "The deadly fighting arts of the Moritat teach a special manoeuvre only made possible by their near preternatural skill with a blade, allowing one great devastating cut with which several opponents can be despatched in a great effusion of sacred blood. By taking a Full Action in combat while using a sword or similarly edged weapon, you can make a single attack against every eligible target in close combat with you. You declare which target you attack first and then move in a clockwise or counter-clockwise direction (your choice) making an attack against each target in turn. Test Weapon Skill and roll Damage separately. These attacks can be Parried or Dodged as normal, but if an attack is successfully Parried, the Reaping blow is stopped and you can make no further attacks.",
  "duty-unto-death":
    "Such is the power of your faith that it can sustain you where mere flesh would fail. You may spend a Fate Point to ignore the effects of injury (including critical hits that do not kill outright), Fatigue and Stunning during an encounter. This Talent does not stop you being injured, and you may still be killed normally. It just allows you to temporarily ignore the effects of your injuries while a particular combat lasts.",
  "labyrinth-conditioning":
    "Your mind is a carefully constructed maze of shut-outs and thought-dams designed to thwart the attempts of others who would learn what you wish to keep secret. You gain a +10 bonus on Deceive Tests when being questioned and to resist anyone using the Intimidate skill on you. You also have a +10 bonus to Willpower to resist Interrogation and mind reading effects such as Mind Scan. In the case of a Psychic Power effect, this bonus can be combined with bonuses to resist Psychic Powers from other Talents.",

  // ─── Book of Judgement ──────────────────────────────────────────────────────
  legalese:
    "Use Scholastic Lore (Judgement) as Blather or Intimidate against targets for whom Imperial law holds some fear. At the GM's discretion, some targets — usually those outside the Imperium of Mankind — may be unaffected.",
  "pack-hunter":
    "+10 to Tracking Tests per cybermastiff you control participating in the hunt. Can use Heightened Senses or gear from one of your hounds.",
  "seen-this-before":
    "Make an Intelligence Test in place of any Skill Test with the Investigation descriptor.",
  "unparalleled-proficiency":
    "Add half your unaugmented Intelligence Bonus (round up) to degrees of success on any successful Scholastic Lore Test.",
  "wolf-pack-tactics":
    "When ganging up on an opponent with your cybermastiff, impose –20 to all of the target's Dodge or Parry Tests.",

  // ─── The Black Sepulchre ─────────────────────────────────────────────────────
  "emperors-tarot":
    "Once per session, make a psychic power roll with Threshold 12. On success, make one Common, Scholastic, or Forbidden Lore Test as if trained; if already trained, may reroll a failed Test instead. The GM may seed prophetic visions during use.",
  "malleus-conditioning":
    "Ignore the negative Willpower modifier from Daemonic Presence. Immune to Warp Shock: still gain Insanity normally, but do not gain Corruption from Warp Shock.",
  intellectualization:
    "When making a Test against Fear, Insanity, or Corruption caused by reading or hearing forbidden words or languages, reroll a failed Willpower Test using Intelligence instead of Willpower.",
  "speed-reading":
    "Make a Challenging (+0) Literacy Test to read at 20 pages per minute, plus 5 pages per minute per degree of success. Automatically passes Total Recall Tests for information within the read material.",
  "aura-of-faith":
    "Daemons within a radius equal to the Acolyte's Willpower Bonus in metres suffer 1d5 damage on a failed Warp Instability Test, plus 1d5 per degree of failure. Damage ignores Armour and Toughness Bonus.",
  "rite-of-banishment":
    "Spend 3 Rounds inscribing holy symbols in up to a 10m radius; the chosen daemon need not be present while the area is inscribed. That daemonic entity loses the Daemonic Trait within the area and cannot enter or leave unless it passes a Very Hard (–30) Willpower Test.",
  "cult-briefing":
    "Gain benefits based on cult infiltration type. Political: treat all Common Lore Skills as Basic and gain Total Recall when attempting to recall someone's name within one world's political or social elite. Heretek: receive one augmetic designed to appear questionable to Mechanicus observers, become trained in Tech-Use, and gain one of Autosanguine, Logis Implant, Orthoproxy, or Technical Knock. Pleasure: +5 Fellowship and Chem-Geld or Decadence. Infestation: Medicae trained and Hardy. Blood: Melee Weapon Training (any one) and Frenzy. Culture: choose one Home World other than the character's own and gain all its Traits.",
  "sicarius-tutoring":
    "Gain a career-based Ordo Sicarius benefit. Adept: use Intelligence for Deceive. Arbitrator: Talented (Shadowing). Assassin: Talented (Concealment). Battle Sister: Swift Attack. Cleric: Disturbing Voice. Guardsman: one Exotic Weapon Training. Imperial Psyker: +1 Wound. Scum: one Peer. Tech-Priest: use Intelligence for Inquiry.",
  "blessed-flame":
    "Flame weapons wielded by this character count as Sanctified. The character may also use an Astartes Incinerator without the normal penalty for not being Adeptus Astartes.",
  "dh-flames-of-faith":
    "When using weapons loaded with Psyflame Ammunition, the character is treated as having Psy Rating 3 for the purposes of that weapon's effects.",
  "mechadendrite-use-techsorcist":
    "One mechadendrite is modified with anti-corruption wards and a secure memory unit that wipes on removal or death. When using that mechadendrite, gain +10 to Forbidden Lore (Tech-Heresy) Tests and +10 to Tech-Use Tests when interfacing with corrupted machine spirits.",

  "into-the-breach":
    "When confronted by Daemonic foes with the Fear trait, treat the Fear Rating as 1 lower (minimum 1) if accompanied by at least two other characters with this talent.",

  // ─── Lathe Worlds ────────────────────────────────────────────────────────────
  "commune-with-cogs":
    "Make a Challenging (+0) Tech-Use Test when interfacing with a machine. On success, pre-set it to activate, deactivate, or follow a simple protocol within its usual capabilities at a chosen time within 24 hours or on remote command (within Int Bonus kilometres). Choose the action and make all associated Tests (Security, Forbidden Lore, etc.) at the time of programming.",
  "whisper-of-samadhi":
    "When dealing with other Tech-Priests, use Intelligence instead of Fellowship for the Deceive Skill. May use the Mimic Talent to copy the vocal codes and ciphers of any Tech-Priest being impersonated.",
  "all-seeing-eye":
    "Personally access the Praecursator Grid with a Hard (–20) Tech-Use Test. On success, access recently recorded information (usually no older than one day). On 3+ Degrees of Success, gain full access to the Grid on that planet — view any pict feed and access any archived data. GM has final say on Grid availability.",
  "metal-fatigue":
    "Make an Opposed Tech-Use Test against the subject's Toughness. Each Degree of Success deals 1 Damage and imposes –10 to the subject's Interrogation Test. If Damage equals the subject's Toughness Bonus, he permanently loses one randomly chosen cybernetic. Subject must have at least one cybernetic implant.",
  "the-power-within":
    "Gain the Resistance (Psychic Powers) Talent. Take Fear Tests caused by psychic powers at one level lower (Fear (1) is ignored). Once per session, automatically pass a Forbidden Lore (Psykers) or Forbidden Lore (Warp) Test with Degrees of Success equal to Intelligence Bonus.",
  "the-power-without":
    "Use all xenos weapons and wargear with only –10 to operation. Take Fear Tests caused by xenos at one level lower (Fear (1) is ignored). Once per session, automatically pass a Forbidden Lore (Archeotech) or Forbidden Lore (Xenos) Test with Degrees of Success equal to Intelligence Bonus.",
  "the-power-beyond":
    "Use all daemonic weapons, wargear, and Warp-corrupted equipment with only –10 to operation. Take Fear Tests caused by Daemons at one level lower (Fear (1) is ignored). Once per session, automatically pass a Forbidden Lore (Daemonology) or Forbidden Lore (Occult) Test with Degrees of Success equal to Intelligence Bonus.",
  "reformed-skin":
    "Replace one missing limb, sense, or organ (lost via Purity of Flesh or Critical Damage) with a vat-grown replacement. Treated as a Poor-Quality cybernetic of the appropriate type but is not actually a cybernetic — does not add to Toughness Bonus. Cannot replace Auger Arrays, Cortex Implants, Cranial Armour, Mechadendrites, Mechanicus Implants, MIUs, or similar. Fate Points gained from Purity of Flesh are lost when replacements are taken. May be taken multiple times and costs no XP. Except in life-threatening situations, the character is under no obligation to take a replacement.",
  "gift-of-purity":
    "May never accept cybernetic or bionic implants under any circumstances, even to prevent death. If implanted against will, must remove them as soon as possible and exchange this Talent for Purity of Flesh. Costs no XP; automatically granted to cybernetic-free Cult of the Pure Form members on taking the alternate rank.",
  "purity-of-flesh":
    "All cybernetics and bionics must be removed. If removal would cause death, instead permanently reduce Toughness by 1d5 and Wounds by 1 (take Reformed Skin immediately to survive). Apply Critical Damage rules for removal effects, and lose any additional benefits supplied by the removed implants. Gain 1 Fate Point per 2 bionics removed (excluding Mechadendrites). Character counts as having Gift of Purity for refusing future cybernetics. Costs no XP and is automatically granted to members of the Cult of the Pure Form who have cybernetics or bionics when they take the alternate rank.",
  "rite-of-ignition":
    "Substitute Strength for Intelligence when making a Tech-Use Test to start or activate machinery. GM has final say over which objects this applies to.",
  "strength-of-the-lathes":
    "When gaining Fatigue (except from psychic powers), make a Challenging (+0) Toughness Test — on success, do not gain the level. Also recover from Fatigue in half the normal time.",
  "luminen-barrier":
    "Full Action: activate a barrier with Rating equal to the base Willpower Characteristic, lasting base Willpower Bonus Rounds. Before each incoming Ranged or Melee attack and before reductions for Armour and Toughness Bonus, roll 1d100 — if ≤ Rating the attack is stopped. On a roll of 01–05 the barrier stops the hit but collapses (Challenging (+0) Toughness or 1 Fatigue). Use up to Willpower Bonus times per 24 hours; each activation after the first causes 1 Fatigue. Prerequisites: Luminen Shield, Electoo Inductors, Potentia Coil. Available to Tech-Priests at Rank 6 (Technomancer or Mech-Deacon) and above for 400 XP.",
  "luminen-flare":
    "On a successful BS Test, direct a blast at one target within 20m dealing 1d10+WPB Energy damage with Blast (WPB). Half Action. Each use requires a Challenging (+0) Toughness Test or gain 1 Fatigue. Prerequisites: Luminen Blast, Electoo Inductors, Potentia Coil. Available to Tech-Priests at Rank 5 (Tech-Priest) and above for 300 XP.",
  "luminen-shield":
    "Full Action: activate a shield with Rating equal to half the base Willpower Characteristic (round up), lasting base Willpower Bonus Rounds. Before each incoming Ranged or Melee attack and before reductions for Armour and Toughness Bonus, roll 1d100 — if ≤ Rating the attack is stopped. On a roll of 01–04 the shield stops the triggering attack but then collapses (Challenging (+0) Toughness or 1 Fatigue). Use up to Willpower Bonus times per 24 hours; each activation after the first causes 1 Fatigue. Prerequisites: Electoo Inductors, Potentia Coil. Available to Tech-Priests at Rank 4 (Enginseer) and above for 200 XP.",
  "luminen-surge":
    "Must touch the enemy — make a Challenging (+0) WS Test or be Grappling to deliver. On hit, deals 2d10+3 Energy damage. Half Action. Each use requires a Challenging (+0) Toughness Test or gain 1 Fatigue. Prerequisites: Luminen Shock, Electoo Inductors, Potentia Coil. Available to Tech-Priests at Rank 4 (Enginseer) and above for 200 XP.",
  "the-flesh-is-weak":
    "Grants the Machine Trait with Armour Points equal to the number of times this Talent has been taken. May be purchased multiple times; note the total in parentheses, for example The Flesh is Weak (3). Available to Tech-Priests at Ranks 2 and 4 for 100 XP, Rank 6 for 200 XP, and Rank 8 for 300 XP.",
  "inspire-wrath":
    "Gain +20 to Interaction Skill Tests when trying to inspire hate or anger against a particular target of your words. Under these circumstances, double the number of individuals affected; with Master Orator, affect 20 times the normal number.",
};
