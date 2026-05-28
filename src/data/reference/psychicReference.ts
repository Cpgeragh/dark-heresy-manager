// src/data/reference/psychicReference.ts
// Reference data for psychic powers from the Core Rulebook (CR).
// Feeds into the PowerPicker modal on the Psychic Tab.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PsychicDiscipline =
  | "Minor"
  | "Biomancy"
  | "Divination"
  | "Pyromancy"
  | "Telekinetics"
  | "Telepathy";

export const PSYCHIC_DISCIPLINES: PsychicDiscipline[] = [
  "Minor",
  "Biomancy",
  "Divination",
  "Pyromancy",
  "Telekinetics",
  "Telepathy",
];

export interface PsychicPowerRef {
  id: string;
  name: string;
  source: SkillSource;
  discipline: PsychicDiscipline;
  threshold: number;
  focusTime: string;
  sustained: boolean;
  range: string;
  /** Full description text; Overbleed rules appended inline where applicable. */
  description: string;
}

// ─── Psychic Power Reference ─────────────────────────────────────────────────

export const PSYCHIC_POWER_REFERENCE: PsychicPowerRef[] = [

  // ── Minor Powers ──────────────────────────────────────────────────────────
  {
    id: "call-creatures",
    name: "Call Creatures",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 9,
    focusTime: "Full Action",
    sustained: false,
    range: "1 km radius",
    description:
      "You call a number of simple-minded creatures within range to travel to your location. " +
      "Creatures depend on the environment; types may include rats, ash slugs and other vermin. " +
      "If no such creatures are likely in the area, the power has no effect. " +
      "Under most circumstances, 1d10 creatures appear after 2d10 minutes. " +
      "They are not compelled to serve the Psyker — they simply appear and behave normally for their species. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 1km.",
  },
  {
    id: "call-item",
    name: "Call Item",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 5,
    focusTime: "Half Action",
    sustained: false,
    range: "Unlimited",
    description:
      "You summon a specially prepared item to instantly appear in your hand. " +
      "To prepare an object, spend one hour in deep meditation, infusing it with your psychic imprint and marking it with glyphs and runes. " +
      "The object must be small and light enough to be carried in one hand. " +
      "You may only have one prepared item at a time.",
  },
  {
    id: "chameleon",
    name: "Chameleon",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 7,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You cause reality to blur around you, distorting your image and allowing you to blend with your surroundings. " +
      "You gain a +30 bonus to Concealment Tests. " +
      "In addition, all opponents using ranged weapons to attack you suffer a -20 penalty to their Ballistic Skill Tests.",
  },
  {
    id: "deja-vu",
    name: "Déjà Vu",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: false,
    range: "30m",
    description:
      "You create a brief memory loop in the mind of the target, causing their thoughts to slip back several seconds. " +
      "You must be able to see the target and they must be within range. " +
      "They are permitted a Willpower Test to resist. " +
      "On a failed Test, they must repeat the same Action they took last Round in their next Turn. " +
      "Any action obviously harmful to the target (such as running off a cliff) automatically allows them to resist.",
  },
  {
    id: "distort-vision",
    name: "Distort Vision",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Free Action",
    sustained: false,
    range: "You",
    description:
      "You disappear and your image reappears in another space no more than 10 metres away. " +
      "Until the start of your next Turn, you are effectively invisible to all other creatures, defeating even sensory equipment. " +
      "All attacks against you (if your position is discovered via Psyniscience) are Very Hard (-30). " +
      "Creatures and sensors that do not rely on sight are unaffected.",
  },
  {
    id: "dull-pain",
    name: "Dull Pain",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You nullify the pain of any creature within Range, including yourself. " +
      "The target reduces their levels of Fatigue by one step. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, remove an additional level of Fatigue.",
  },
  {
    id: "fearful-aura",
    name: "Fearful Aura",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 7,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "You twist reality to make yourself appear more sinister and dangerous. " +
      "While this power is active, you have a Fear Rating of 2. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, your Fear Rating increases by 1.",
  },
  {
    id: "flash-bang",
    name: "Flash Bang",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Half Action",
    sustained: false,
    range: "20m",
    description:
      "You create a bright flash of light and a deafening bang. " +
      "Anyone within Range must succeed on a Routine (+20) Willpower Test or become Stunned for 1 Round. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, the Difficulty worsens by one step " +
      "(Routine to Ordinary, Ordinary to Challenging, and so on).",
  },
  {
    id: "float",
    name: "Float",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You focus your concentration and slowly lift off the ground. " +
      "You can only move up and down while under this effect, and cannot rise higher than 5 metres. " +
      "You can use this power to stop yourself from falling, but must succeed on a Difficult (-10) Willpower Test in addition to beating the Threshold.",
  },
  {
    id: "forget-me",
    name: "Forget Me",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You become instantly forgettable to a single creature within range, suppressing all memories of your previous encounters. " +
      "The target is entitled to an Ordinary (+10) Willpower Test to resist. " +
      "Their memory returns after 1d10 minutes. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, you may extend the effects to one additional target, " +
      "add an extra 1d10 minutes to the duration, or worsen the Willpower Test Difficulty by one step.",
  },
  {
    id: "healer",
    name: "Healer",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 7,
    focusTime: "Full Action",
    sustained: false,
    range: "10m",
    description:
      "You channel your power to knit flesh and mend bones in a single willing target within Range (including yourself). " +
      "The target removes 1d5 points of Damage (Critical Damage first). " +
      "If a person is the subject of this power more than once in a 6-hour period, they must Test Toughness or take 1d5 points of Damage " +
      "(ignoring Toughness Bonus and Armour) rather than being healed.",
  },
  {
    id: "inflict-pain",
    name: "Inflict Pain",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: true,
    range: "100m",
    description:
      "You cause a person to be wracked with agony. " +
      "The target is entitled to a Willpower Test to resist. " +
      "On a failed Test, the target suffers -10 to all their Tests as they struggle to control their pain. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, extend the effects to affect another target.",
  },
  {
    id: "inspiring-aura",
    name: "Inspiring Aura",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "You seem to glow with an inner light and all those around you are filled with confidence. " +
      "While this power is active, all allies that can see you gain a +20 bonus to Tests made to resist Fear and Pinning.",
  },
  {
    id: "knack",
    name: "Knack",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 7,
    focusTime: "Half Action",
    sustained: false,
    range: "You",
    description:
      "You tap into your unconscious to awaken a deeper understanding of your capabilities. " +
      "Until the end of your next Turn, you may gain a +10 bonus to any one non-combat Test.",
  },
  {
    id: "lucky",
    name: "Lucky",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Half Action",
    sustained: false,
    range: "You",
    description:
      "Luck acts strangely around Psykers. " +
      "When you manifest this power, any time before the end of your next Turn, " +
      "you may re-roll any one roll of your dice (including Damage rolls).",
  },
  {
    id: "precognition",
    name: "Precognition",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You get a fuzzy picture of what will occur a few moments into the future. " +
      "For as long as this power is active, you gain a +10 bonus to Dodge Tests and to Weapon Skill Tests made to Parry incoming blows.",
  },
  {
    id: "psychic-stench",
    name: "Psychic Stench",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 5,
    focusTime: "Half Action",
    sustained: false,
    range: "Touch",
    description:
      "By momentarily handling an item you imbue it with an unnatural psychic smell. " +
      "Anyone coming within five metres of the tainted item will smell it, regardless of barriers or other smells. " +
      "The aroma varies per observer, and as the smell exists only in the mind, it affects even creatures without a sense of smell. " +
      "Psychic stench remains in effect for 1d10 days.",
  },
  {
    id: "resist-possession",
    name: "Resist Possession",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Reaction",
    sustained: false,
    range: "You",
    description:
      "You create mental wards to shield your mind from the malign denizens of the warp. " +
      "Any time in the next hour you may re-roll any failed Test to resist being possessed by a Daemon.",
  },
  {
    id: "sense-presence",
    name: "Sense Presence",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 7,
    focusTime: "Half Action",
    sustained: true,
    range: "50m (see text)",
    description:
      "Reaching out with your mind, you get a vague inkling of other life forms within range. " +
      "You automatically detect all living creatures in the area. " +
      "Walls in excess of 1 metre thick block this power. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by an additional 10 metres.",
  },
  {
    id: "spasm",
    name: "Spasm",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 7,
    focusTime: "Half Action",
    sustained: false,
    range: "50m",
    description:
      "You cause a target's muscles to spasm. " +
      "The target is entitled to a Willpower Test to resist. " +
      "On a failure, the target twitches uncontrollably. " +
      "If carrying a ballistic weapon, it fires — make a Ballistic Skill Test to hit the closest creature. " +
      "The target also falls to the ground and must use a Stand Action to regain their feet. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, affect an additional target or worsen the Willpower Test Difficulty by one step.",
  },
  {
    id: "spectral-hands",
    name: "Spectral Hands",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 10,
    focusTime: "Full Action",
    sustained: false,
    range: "30m",
    description:
      "You create an invisible force to manipulate any object within 30 metres. " +
      "The force has a Strength Characteristic equal to your Willpower and lasts until the end of your next Turn. " +
      "You can knock over objects, push buttons, pull levers, and similar tasks, " +
      "but cannot perform actions requiring precision (typing, pulling a pin, pulling a trigger, etc.). " +
      "Spectral Hands has no effect on living targets.",
  },
  {
    id: "staunch-bleeding",
    name: "Staunch Bleeding",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You cause yourself or another creature within Range to halt Blood Loss. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, you may affect another target.",
  },
  {
    id: "torch",
    name: "Torch",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 5,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You create a ball of glowing psy-flame equivalent in light to a glow-lamp. " +
      "The flame may issue from any point on your body and can be coloured according to your whim. It produces no heat. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, you may double or halve the size of the light, " +
      "or cause it to float up to one metre from your body in any direction.",
  },
  {
    id: "touch-of-madness",
    name: "Touch of Madness",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 11,
    focusTime: "Full Action",
    sustained: false,
    range: "100m",
    description:
      "You reach into the mind of a target within Range and force them to believe something untrue. " +
      "The target is entitled to a Willpower Test to resist. " +
      "On a failed Test, they must roll 1d100 and consult Table 8-6: Mental Traumas. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, you may affect an additional target.",
  },
  {
    id: "trick",
    name: "Trick",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 5,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You subtly influence the fields of probability, making you especially good at cheating at games of chance. " +
      "If you do not have the Gamble skill, you gain it at two levels of mastery for as long as this power is sustained. " +
      "If you have Gamble, you gain an additional +20 bonus to Gamble Tests. " +
      "If you already have Skill Mastery in Gamble, this power has no effect.",
  },
  {
    id: "unnatural-aim",
    name: "Unnatural Aim",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: false,
    range: "You",
    description:
      "You draw upon the power of the warp to guide your aim. " +
      "Before the end of your next Turn, any ranged attacks you make count as being made at Point Blank Range (+30 to hit).",
  },
  {
    id: "wall-walk",
    name: "Wall Walk",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You bend gravity to your will, negating all penalties from low- or high-gravity worlds. " +
      "You can walk on walls or ceilings for as long as this power is active, moving at half normal rate. " +
      "You must Test Agility to transition between a wall and ceiling, unless you take a Full Action to ease yourself onto the new surface.",
  },
  {
    id: "warp-howl",
    name: "Warp Howl",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Full Action",
    sustained: false,
    range: "50m",
    description:
      "You send out a long, keening screech throughout the warp that tears into reality in a cacophonous burst. " +
      "This power drowns out all sound within Range for 1 Round. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 10 metres.",
  },
  {
    id: "weaken-veil",
    name: "Weaken Veil",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 9,
    focusTime: "Full Action",
    sustained: true,
    range: "30m",
    description:
      "You weaken the fabric of space by drawing the immaterium closer. " +
      "Anyone within Range who uses Psychic Powers gains a +2 bonus on Power Rolls. " +
      "However, as the veil is weakened, Psychic Phenomena occur on a roll of 8, 9 or 10. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by an additional 10 metres.",
  },
  {
    id: "weapon-jinx",
    name: "Weapon Jinx",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Full Action",
    sustained: false,
    range: "50m",
    description:
      "You reach into nearby machines to scramble their circuitry. " +
      "All mechanical devices within range cease to function for 1 Round. " +
      "In addition, you may Test Willpower to force a single weapon within range to jam (cleared as normal). " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 10 metres, or affect an additional weapon.",
  },
  {
    id: "white-noise",
    name: "White Noise",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 8,
    focusTime: "Full Action",
    sustained: true,
    range: "10m",
    description:
      "You fill the warp with static, fouling psychic detection and making tech sensors less reliable. " +
      "While active, any Tests to detect your presence or anyone within range (by psychic or technological means) count as Hard (-20). " +
      "If detection would not normally require a Test, the user must make an Ordinary (+10) Willpower Test (psychic) " +
      "or Ordinary (+10) Intelligence Test (technological). " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 10 metres.",
  },
  {
    id: "wither",
    name: "Wither",
    source: SkillSource.CR,
    discipline: "Minor",
    threshold: 6,
    focusTime: "Full Action",
    sustained: false,
    range: "3d10m",
    description:
      "You cause a vile wave of invisible pestilence to emerge from your body, extending to the Range of the power. " +
      "The wave withers all normal plant life in the area in moments, leaving it barren and utterly dead. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 1d10 metres.",
  },

  // ── Biomancy ──────────────────────────────────────────────────────────────
  {
    id: "seal-wounds",
    name: "Seal Wounds",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 10,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You focus your power to repair your damaged flesh or that of any character within Range. " +
      "Ragged wounds fuse, cuts vanish, broken bone knits together, and burnt skin sloughs away as fresh tissue grows beneath. " +
      "The target removes 1d10 points of Damage plus your Willpower Bonus. " +
      "This power can remove Critical Damage as well as normal Damage. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, heal one additional point of Damage.",
  },
  {
    id: "bio-lightning",
    name: "Bio-Lightning",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 14,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You channel your life force through the meridians of your body, causing your form to crackle with living energy. " +
      "You may direct this energy against a single target within Range. " +
      "The target takes 1d10 plus your Willpower Bonus in Energy Damage. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 10 metres. " +
      "For every 10 points you exceed the Threshold, launch another bolt of energy against the same or a different target.",
  },
  {
    id: "blood-boil",
    name: "Blood Boil",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 19,
    focusTime: "Half Action",
    sustained: true,
    range: "10m",
    description:
      "You tune into an enemy's body, exhorting their heart muscles to accelerate their pulse until blood pressure reaches lethal levels, " +
      "causing haemorrhaging across the target's body. " +
      "Each Round (including the Round the power manifests), you may spend a Half Action to make an Opposed Test " +
      "pitting your Willpower against the target's Toughness. " +
      "If you win, the opponent takes one level of Fatigue plus one per degree of success until unconscious. " +
      "Each level of Fatigue beyond those the target can take deals 5 Damage instead; " +
      "should Damage equal the target's Wounds, their heart and brain explode. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, gain a +10 bonus on your Opposed Willpower Tests.",
  },
  {
    id: "cellular-control",
    name: "Cellular Control",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 16,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You transcend your body's natural limitations by modifying cellular structure. " +
      "Choose one of the following effects: gain immunity to all poisons; ignore the effects of extremes of temperature; " +
      "increase any Characteristic except WS and BS by +10; gain immunity to Fatigue; " +
      "count as wearing a void suit in a vacuum (though you still need to breathe). " +
      "Each Round you sustain this power, you must succeed on a Toughness Test or take 1d5 Damage ignoring Toughness Bonus and Armour. " +
      "Unlike most powers, you can manifest this power multiple times, choosing a different effect each time.",
  },
  {
    id: "constrict",
    name: "Constrict",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 13,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "With a word, thought or gesture, you command the flesh of your target to sharply contract. " +
      "The target's windpipe closes, choking them — they begin to Suffocate. " +
      "Each Round, the target must spend a Full Action to Test Toughness. " +
      "On success, they regain control and clear their windpipe. " +
      "On failure, they continue to suffocate. The target is considered to be engaged in strenuous activity. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, the Difficulty of the Toughness Test worsens by one step.",
  },
  {
    id: "enhanced-senses",
    name: "Enhanced Senses",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 10,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You force your senses into impossible feats of perception. " +
      "Choose one of your five senses — you gain a +30 bonus to all Tests made with that sense. " +
      "The sense organ becomes strained as you push it past all normal human limits. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, you may enhance an additional sense.",
  },
  {
    id: "hammerhand",
    name: "Hammerhand",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 15,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "You channel the fierce power of the warp into your limbs, phenomenally increasing your fighting capabilities. " +
      "Your body becomes a lethal engine capable of shredding flesh and bone. " +
      "While this power is in effect, your Strength Bonus is multiplied by 4 and you gain the Improved Natural Weapons trait. " +
      "However, you can wield no weapons save for your bare hands.",
  },
  {
    id: "regenerate",
    name: "Regenerate",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 23,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "One of the pinnacles of a biomancer's abilities, this power allows you to knit your flesh back together at a phenomenal rate. " +
      "Each Round this power is active, you remove 1d5 points of Damage (Critical Damage first) and have all levels of Fatigue removed. " +
      "Once all Damage is removed, you begin to regrow organs and limbs. " +
      "Limbs and organs replaced by cybernetics do not regrow unless the bionic is first removed.",
  },
  {
    id: "shape-flesh",
    name: "Shape Flesh",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 19,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "Shape Flesh allows you to twist your physical frame in nearly any way you can imagine. " +
      "Each manifestation produces one of the following effects: " +
      "gain any one trait — Burrower (1), Crawler, Dark Sight, Flier, Hoverer, Natural Armour (2), Natural Weapons or Quadruped; " +
      "assume the appearance of any one creature, gaining Disguise at +10 (or +20 if already trained); " +
      "gain Natural Weapons to deal 1d10+SB Damage. " +
      "Unlike most powers, you can manifest this power multiple times, choosing a different effect each time.",
  },
  {
    id: "toxic-siphon",
    name: "Toxic Siphon",
    source: SkillSource.CR,
    discipline: "Biomancy",
    threshold: 11,
    focusTime: "Half Action",
    sustained: false,
    range: "Touch",
    description:
      "You draw poisons from the flesh. " +
      "This has the same effect as taking a dose of de-tox, except the target must lose a Full Action " +
      "as the toxin expels itself from the body naturally. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, draw poison from an additional target " +
      "who must be touching you or another person being purged by you.",
  },

  // ── Divination ────────────────────────────────────────────────────────────
  {
    id: "divine-shot",
    name: "Divine Shot",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 15,
    focusTime: "Free Action",
    sustained: false,
    range: "You",
    description:
      "You concentrate on a single firearm or missile weapon in your possession, " +
      "casting your psychic gaze into the warp to search down the near-infinite paths of potential future trajectories. " +
      "In effect, you automatically hit any one target you can see regardless of Range. " +
      "Only one shot automatically hits even if using a semi-automatic or automatic weapon. " +
      "All other shots require Tests as normal.",
  },
  {
    id: "dowsing",
    name: "Dowsing",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 11,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "You single out a specific object or person — the subject must be specific (the key to this lock, not just a key; " +
      "a person you've seen or know by name). Make a Psyniscience Test modified by: intimately familiar with subject (+10), " +
      "possess a piece of them (+5), subject within 100m (+5), subject over 500m away (-10), " +
      "subject surrounded by others of its kind (-10). " +
      "If the subject is within a number of kilometres equal to your Perception Bonus: " +
      "0 degrees = rough direction; 1 = specific direction and rough distance; 2 = specific direction and exact distance; " +
      "4 = visual image of their current location. " +
      "While sustained, spend a Full Action each Round to gain updated information.",
  },
  {
    id: "far-sight",
    name: "Far Sight",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 17,
    focusTime: "Full Action",
    sustained: true,
    range: "1km × Willpower Bonus",
    description:
      "You open your inner eye to perceive events at places far away, becoming aware of a single space anywhere within Range " +
      "(you need not know the destination, only direction and distance). " +
      "If the point is inside a solid object, the power fails. " +
      "You can see up to normal vision range from that point; you may change your facing 90 degrees by spending a Half Action. " +
      "Far Sight does not grant special forms of vision and does not pick up sound. " +
      "While using this power, you can spend no more than a Half Action each Round and take a -30 penalty to all Tests. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, double the Range.",
  },
  {
    id: "glimpse",
    name: "Glimpse",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 18,
    focusTime: "Half Action",
    sustained: false,
    range: "You",
    description:
      "You peer into the future, sensing the manifold web of different possible pathways and potential outcomes. " +
      "Until the end of your next Turn, you gain a +30 bonus to any single Skill Test.",
  },
  {
    id: "precognitive-dodge",
    name: "Precognitive Dodge",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 11,
    focusTime: "Free Action",
    sustained: false,
    range: "You",
    description:
      "The threads of your immediate future appear clearly in your mind — you have the power to Dodge projectiles before they've been fired. " +
      "Until the end of your next Turn, all Ballistic Skill Tests made to hit you with ranged weapons suffer a -30 penalty.",
  },
  {
    id: "precognitive-strike",
    name: "Precognitive Strike",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 17,
    focusTime: "Free Action",
    sustained: false,
    range: "You",
    description:
      "Like a spider on a web, you sense disturbances to your immediate future. " +
      "This ability to read possible outcomes lets you anticipate the movement of your opponents. " +
      "Until the end of your next Turn, you gain a +20 bonus to all Weapon Skill and Ballistic Skill Tests.",
  },
  {
    id: "preternatural-awareness",
    name: "Preternatural Awareness",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 9,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "Your eyes roll white within their sockets and your senses roam about you, glancing above, behind, before and sideways. " +
      "You also gain impressions of future events. " +
      "You gain a +20 bonus on all Awareness Tests and add your Willpower Bonus to your Initiative count. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, you may add your Willpower Bonus to your Initiative again.",
  },
  {
    id: "psychometry",
    name: "Psychometry",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 16,
    focusTime: "Full Action",
    sustained: true,
    range: "You (see text)",
    description:
      "You read the psychic traces that others leave on objects and places, receiving images connected to the place or object. " +
      "Use this power while handling an object, or to sense impressions within an area equal to your Willpower Bonus in metres. " +
      "You derive a new piece of information for every 10 Rounds: at 10 Rounds — strongest recent emotion; " +
      "20 — general features of the person; 30 — clear image of the person; 40 — occupation; 50 — name; " +
      "+10 Rounds per additional fact (as determined by the GM). " +
      "Overbleed: For every 10 points by which you exceed the Threshold, cut the time required by half.",
  },
  {
    id: "personal-augury",
    name: "Personal Augury",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 14,
    focusTime: "Full Action",
    sustained: false,
    range: "Touch",
    description:
      "You clasp the hands of a willing target and they specify a question — as detailed or as vague as they choose. " +
      "Over the next 30 minutes using your Psychic-foci (Tarot, runes, entrails, etc.), " +
      "you make a Psyniscience Test. Each degree of success reveals more: " +
      "0 = Doom (symbolic warning of the greatest peril); " +
      "1 = Malign Influences (two further negative influences the client will face); " +
      "2 = Benign Factors (greatest advantage or weapon the client possesses); " +
      "3+ = Fate (all previous effects plus a single sentence of mystical advice).",
  },
  {
    id: "soul-sight",
    name: "Soul Sight",
    source: SkillSource.CR,
    discipline: "Divination",
    threshold: 23,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "You read the shifting aura others project into the warp. " +
      "As a Full Action, make a Psyniscience Test against any person you can see. Each degree reveals more: " +
      "0 (Hue) = three dominant emotions, race, whether they have Psychic Disciplines, rough physical/mental health, " +
      "whether they are an Untouchable; " +
      "1 (Flow) = all current feelings, habitual emotional tides (+10 to Fellowship Tests while active), " +
      "biological feedback (hunger, fatigue, pain), current Wounds and Fatigue levels, " +
      "which Disciplines they have if any; " +
      "2 (Shape) = longstanding emotions, Corruption Point presence (not amount), " +
      "major emotions of the past 12 hours, Insanity Points, madness/addictions, precise Psy Rating if applicable; " +
      "3 (Pattern) = exact Corruption Points, whether they have Minor Psychic Powers, " +
      "and whether their aura is genuine or artificially produced.",
  },

  // ── Pyromancy ─────────────────────────────────────────────────────────────
  {
    id: "blinding-flash",
    name: "Blinding Flash",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 11,
    focusTime: "Half Action",
    sustained: false,
    range: "12m",
    description:
      "You focus blazing mental energy into a single point before releasing it in a burst of searing bright light, " +
      "blinding anyone within Range who sees you. " +
      "Those with appropriate glare shielding and beings without visual sensory organs are immune. " +
      "All those affected must make an Agility Test or be blinded for a number of Rounds equal to 1d10 times the Psyker's Psy Rating. " +
      "Blinded targets automatically fail vision-based Tests, move at half speed, " +
      "and take a -20 penalty on Tests involving fighting, movement or reactions. " +
      "Note: Any Pyromancy power that inflicts Damage may also set the target on fire. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, extend the Range by 4 metres.",
  },
  {
    id: "burning-fist",
    name: "Burning Fist",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 10,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You wreathe your hands in waves of shimmering flame. " +
      "Your unarmed attacks deal 1d10+SB Energy Damage. " +
      "In addition, your unarmed strikes do not count as having the Primitive special quality. " +
      "Note: Any Pyromancy power that inflicts Damage may also set the target on fire.",
  },
  {
    id: "call-flame",
    name: "Call Flame",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 8,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You conjure a small flame (about the size and intensity of a burning torch) into your palm. " +
      "The primary purpose is not to attack — though it adds 2 points of Damage to unarmed attacks and makes them Energy attacks — " +
      "but rather to set things alight or fuel other Pyrokinetic powers such as Sculpt Flame. " +
      "While this power is in effect, you cannot use your hand for anything else.",
  },
  {
    id: "douse-flames",
    name: "Douse Flames",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 16,
    focusTime: "Half Action",
    sustained: true,
    range: "5m × Willpower Bonus",
    description:
      "You instantly extinguish all fires within range and prevent fire-based weapons such as flamers from functioning " +
      "for as long as they are within Range (their fuel may still spray forth depending on weapon design). " +
      "Chemically flammable substances that burn continuously once exposed to air burst back into flame " +
      "the moment the power's effect ends or as soon as the substance moves outside Range. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 5 metres.",
  },
  {
    id: "fire-bolt",
    name: "Fire Bolt",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 11,
    focusTime: "Half Action",
    sustained: false,
    range: "100m",
    description:
      "You create bolts of flame with your mind and hurl them at your foes. " +
      "Make a Challenging (+0) Willpower Test to strike the target. On a hit, the bolt deals 1d10+5 Energy Damage. " +
      "Note: Any Pyromancy power that inflicts Damage may also set the target on fire. " +
      "Overbleed: For every 5 points by which the Power Roll exceeds the Threshold, you generate an additional Fire Bolt " +
      "directed at any target within Range (Test Willpower separately for each target).",
  },
  {
    id: "fire-storm",
    name: "Fire Storm",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 16,
    focusTime: "Half Action",
    sustained: false,
    range: "50m",
    description:
      "You instantly create an intense conflagration about your target as the air itself ignites. " +
      "You can call a Fire Storm anywhere within range you have line of sight to. " +
      "The Fire Storm has a 6-metre radius from the targeted point and deals 1d10+5 Energy Damage to all creatures and objects in the area. " +
      "Note: Any Pyromancy power that inflicts Damage may also set the target on fire. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, deal an additional 1d10 points of Damage.",
  },
  {
    id: "holocaust",
    name: "Holocaust",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 23,
    focusTime: "Full Action",
    sustained: true,
    range: "6m",
    description:
      "Holocaust calls forth a raging white-hot firestorm ignited by the Psyker's own soul. " +
      "The flames burn across dimensions, affecting warp entities as well as material beings. " +
      "The fires always burn outward from you, dealing 1d10 Energy Damage per point of your Willpower Bonus " +
      "to all creatures and objects in the area, bypassing Toughness Bonus and Armour. " +
      "You take 1d10+1 Energy Damage (ignoring Toughness Bonus and Armour) each Round you sustain this power. " +
      "There is no immunity — Warp Entities are burned as readily as the fleshbound. " +
      "Those slain by Holocaust are killed forever.",
  },
  {
    id: "incinerate",
    name: "Incinerate",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 19,
    focusTime: "Full Action",
    sustained: true,
    range: "—",
    description:
      "Threshold 19, Full Action, Sustained. " +
      "Note: Any Pyromancy power that inflicts Damage may also set the target on fire. " +
      "Consult the Core Rulebook for full rules.",
  },
  {
    id: "sculpt-flame",
    name: "Sculpt Flame",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 13,
    focusTime: "Half Action",
    sustained: true,
    range: "5m × Willpower Bonus",
    description:
      "You control the shape of fires burning around you. With an existing fire you may: " +
      "double a fire's area; diminish a fire's area by half; spread fire into a number of 1-metre squares equal to your Willpower Bonus; " +
      "create crude shapes (creatures, people, objects); cause a fire to burst (adjacent targets Test Agility or catch fire); " +
      "cause a fire to spew smoke (filling three times the fire's area). " +
      "Each Round you may choose a new effect or apply the same one. " +
      "Overbleed: For every 5 points over the Threshold, create easily recognisable images; " +
      "for 10 points, near life-like figures. " +
      "The distance of spreading fire also increases: +5 points = double Willpower Bonus distance; " +
      "+10 points = four times Willpower Bonus distance.",
  },
  {
    id: "wall-of-fire",
    name: "Wall of Fire",
    source: SkillSource.CR,
    discipline: "Pyromancy",
    threshold: 17,
    focusTime: "Full Action",
    sustained: true,
    range: "60m",
    description:
      "You place an immobile barrier of flame anywhere within Range. " +
      "The wall is 3 metres high, 1 metre thick, and up to 10 metres long for every point of your Willpower Bonus. " +
      "Foes can be placed on top, though they may make an Easy (+20) Agility Test to get out of the way. " +
      "Foes crossing the wall or failing the Test take 1d10+5 Energy Damage (ignoring Armour) " +
      "and must Test Agility again or catch fire.",
  },

  // ── Telekinetics ──────────────────────────────────────────────────────────
  {
    id: "catch-projectiles",
    name: "Catch Projectiles",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 16,
    focusTime: "Reaction",
    sustained: false,
    range: "1m × Willpower Bonus",
    description:
      "You use your telekinetic abilities to catch incoming projectiles. " +
      "This power only works against solid projectiles — energy attacks get through normally. " +
      "Until the end of your next Turn, you automatically discount a number of hits from incoming missiles " +
      "equal to your Willpower Bonus, causing them to stop and hang in the air. " +
      "When this power ends, they fall harmlessly to the ground.",
  },
  {
    id: "fling",
    name: "Fling",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 14,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You telekinetically lift an unattended object and fling it at a target. " +
      "You may lift up to 5 kilograms per point of your Willpower Bonus, " +
      "throwing it a number of metres equal to your Willpower Bonus ×3. " +
      "Test Willpower to hit — on a success, resolve as a normal attack. " +
      "The object deals 1d10 Impact Damage plus 1 point per 5 kilograms of weight. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, " +
      "you may lift an additional 5 kilograms per point of your Willpower Bonus.",
  },
  {
    id: "force-barrage",
    name: "Force Barrage",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 21,
    focusTime: "Full Action",
    sustained: false,
    range: "10m × Willpower Bonus",
    description:
      "This power functions as Force Bolt except you create one bolt per point of your Willpower Bonus, " +
      "firing all bolts when you manifest this power. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, you generate an additional bolt.",
  },
  {
    id: "force-bolt",
    name: "Force Bolt",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 13,
    focusTime: "Half Action",
    sustained: false,
    range: "10m × Willpower Bonus",
    description:
      "You hurl a burst of tangible mental force at your opponent. " +
      "Test Willpower to hit the target. If you succeed, your attack deals 1d10 Impact Damage +1 per point of your Willpower Bonus. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, deal 1 additional point of Impact Damage.",
  },
  {
    id: "precision-telekinesis",
    name: "Precision Telekinesis",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 23,
    focusTime: "Half Action",
    sustained: true,
    range: "10m",
    description:
      "If Telekinesis is a sledgehammer, Precision Telekinesis is a scalpel. " +
      "This power achieves far more subtle effects with telekinetic force. " +
      "You can pull the pins on grenades, press buttons, jog triggers, undo latches, and direct small projectiles to deadly effect — " +
      "essentially manipulating objects as if physically handling them. " +
      "In any situation where the task would call for a Characteristic Test, substitute your Willpower instead.",
  },
  {
    id: "psychic-blade",
    name: "Psychic Blade",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 19,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You project your will as a blade of psychic force formed almost impossibly thin. " +
      "Because the blade is formed of psychic energy, it can shear through almost any physical object " +
      "and cut through most forms of armour as if they were cloth. " +
      "Treat the Psychic Blade as a sword that requires no Melee Training to use, but cannot Parry. " +
      "To strike, use your Willpower Characteristic rather than Weapon Skill. " +
      "On a successful hit, the weapon deals 1d10 Rending Damage plus 2 additional points per point of your Willpower Bonus. " +
      "The weapon has Penetration equal to twice your Willpower Bonus.",
  },
  {
    id: "psychic-crush",
    name: "Psychic Crush",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 17,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You direct your Telekinetic power directly against your opponents, wrapping them in bands of force. " +
      "Make an Opposed Test, pitting your Willpower against the opponent's Toughness. " +
      "If you beat your opponent, you deal 1d10 Impact Damage plus 1 per point of your Willpower Bonus. " +
      "For each degree of success, deal an additional 2 points of Damage. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, extend the Range by 10 metres.",
  },
  {
    id: "push",
    name: "Push",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 13,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You gather a ball of telekinetic energy and direct it against any single target within range. " +
      "Make an Opposed Test, pitting your Willpower against the target's Strength. " +
      "If you beat your opponent, you knock them to the ground. " +
      "For each degree of success, deal one level of Fatigue. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, " +
      "extend the Range by 10 metres or gain a +10 bonus to your Willpower Test.",
  },
  {
    id: "telekinesis",
    name: "Telekinesis",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 11,
    focusTime: "Half Action",
    sustained: true,
    range: "10m",
    description:
      "You use the strength of your will to move physical inanimate objects. " +
      "You may lift or move any object within Range whose weight does not exceed 5 kilograms times your Willpower Bonus. " +
      "You may move the object slowly anywhere within Range. " +
      "This power cannot affect living creatures and you cannot make attacks with objects you manipulate. " +
      "Once you cease concentrating on the object, it falls slowly to the ground.",
  },
  {
    id: "telekinetic-shield",
    name: "Telekinetic Shield",
    source: SkillSource.CR,
    discipline: "Telekinetics",
    threshold: 17,
    focusTime: "Half Action",
    sustained: true,
    range: "You",
    description:
      "You erect a field of telekinetic energy about you, functioning as a force shield granting 1 Armour Point " +
      "on every location in addition to any other armour you are wearing. " +
      "By spending a Full Action to activate, you may cause the shield to vibrate at a colour frequency of your choosing. " +
      "The shield produces only a gentle shimmer in the air and is not opaque. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, increase the Armour Point by 1.",
  },

  // ── Telepathy ─────────────────────────────────────────────────────────────
  {
    id: "beastmaster",
    name: "Beastmaster",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 13,
    focusTime: "Half Action",
    sustained: true,
    range: "8m",
    description:
      "You stretch out your thoughts to animals, becoming able to perceive their emotions and establish rudimentary communication. " +
      "The relative simplicity of an animal's mind allows you to dominate them. " +
      "Each Round you sustain the power, you may spend a Reaction to give the animal a simple command " +
      "(come, guard, flee, heel, attack, and so on). " +
      "If the animal feels threatened or is ordered to act against its nature, it may Test Willpower to break your control.",
  },
  {
    id: "compel",
    name: "Compel",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 17,
    focusTime: "Half Action",
    sustained: false,
    range: "8m",
    description:
      "You force others into brief action against their own will. " +
      "Make an Opposed Test, pitting your Willpower against the target's. " +
      "If you succeed, the target must follow your command — simple and accomplishable in a single Round " +
      "(flee, attack that target, drop your weapon, and so on). " +
      "If the command would result in a suicidal act, the target gets a +20 bonus to its Willpower Test. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, gain a +10 bonus on your Opposed Willpower Test.",
  },
  {
    id: "dominate",
    name: "Dominate",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 24,
    focusTime: "Half Action",
    sustained: true,
    range: "8m",
    description:
      "You reach out with your mind to seize control of another's body. " +
      "Make an Opposed Test, pitting your Willpower against the target's. " +
      "If you succeed, you control the target's body as a puppet. " +
      "While active, you may divide your Actions between yourself and your target. " +
      "The dominated target uses its own Characteristics but takes a -10 penalty to all Tests. " +
      "Any action deemed suicidal grants the target a new Willpower Test to break your hold. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, gain a +10 bonus on your Opposed Willpower Test.",
  },
  {
    id: "inspire",
    name: "Inspire",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 9,
    focusTime: "Half Action",
    sustained: true,
    range: "6m",
    description:
      "You bolster your comrades by subtly implanting images of great courage and masking negative emotional stimuli. " +
      "A number of targets equal to your Willpower Bonus immediately overcome the effects of Pinning and Fear, " +
      "and remain impervious to these effects for as long as they stay within Range and you sustain the power.",
  },
  {
    id: "mind-scan",
    name: "Mind Scan",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 23,
    focusTime: "Extended Action",
    sustained: false,
    range: "Touch",
    description:
      "You read a target's mind, probing whatever secrets are hidden therein. " +
      "You must touch the target (requiring a Weapon Skill Test unless other methods are used). " +
      "Over five Rounds, you and the target make Opposed Willpower Tests each Round; " +
      "if the target succeeds, the Mind Scan ends. Each Round you succeed reveals more: " +
      "Round 1 (Contact) = name, mood, Insanity Level, physical health; " +
      "Round 2 (Surface Thoughts) = uppermost thoughts, immediate fears, conscious lies, " +
      "one significant location/object/event/person, Corruption Level; " +
      "Round 3 (Short Term Memory) = last 12 hours of memories, two further significant items, simple passwords and routines; " +
      "Round 4 (Subconscious) = why significant items matter, beliefs, motivations, contacts, ciphers, pivotal life moments; " +
      "Round 5 (Soul Baring) = complete access to the target's psyche. " +
      "A covert scan requires a -10 penalty to your Test; success leaves the target with only a faint sense of unease.",
  },
  {
    id: "projection",
    name: "Projection",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 21,
    focusTime: "Full Action",
    sustained: true,
    range: "You",
    description:
      "You send out your disembodied mind and spirit, allowing you to touch other minds from a great distance. " +
      "You project a mental self you can shape to look like whatever you choose, travelling at the speed of thought. " +
      "This power lets you communicate with any creature you know well (a companion or your Inquisitor) " +
      "anywhere within the same solar system. " +
      "Unwilling targets may make an Opposed Willpower Test to force you back into your body. " +
      "While using this power, your physical body functions as if unconscious, " +
      "and creatures native to the immaterium or other Psykers may be able to directly attack your mind.",
  },
  {
    id: "psychic-shriek",
    name: "Psychic Shriek",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 18,
    focusTime: "Half Action",
    sustained: false,
    range: "10m",
    description:
      "You gather your will and launch it as a blast of screaming mental energy designed to overload nervous systems. " +
      "All creatures within Range that you specify must succeed on a Willpower Test or suffer a number of levels of Fatigue " +
      "equal to your Willpower Bonus. " +
      "Overbleed: For every 10 points by which you exceed the Threshold, extend the Range by 10 metres.",
  },
  {
    id: "see-me-not",
    name: "See Me Not",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 14,
    focusTime: "Half Action",
    sustained: true,
    range: "20m",
    description:
      "You erase your presence from the minds of others — targets literally cannot perceive you at all. " +
      "They may suspect someone is present, but can only react to the effects of what you do. " +
      "Select a number of targets within Range equal to your Willpower Bonus. " +
      "Each must succeed on a Willpower Test or lose all perception of you for as long as you sustain the power. " +
      "This power has no effect on creatures with an Intelligence of 10 or less. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, add another target " +
      "or impose a -10 penalty on one target's Willpower Test.",
  },
  {
    id: "telepathy-power",
    name: "Telepathy",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 11,
    focusTime: "Free Action",
    sustained: true,
    range: "1km / Willpower Bonus",
    description:
      "You can send your thoughts into the minds of those around you. " +
      "You can choose to send a message to one or more persons in a select group ('placed sending'), " +
      "or transmit your thoughts to anyone within Range ('broadcasting').",
  },
  {
    id: "terrify",
    name: "Terrify",
    source: SkillSource.CR,
    discipline: "Telepathy",
    threshold: 13,
    focusTime: "Half Action",
    sustained: false,
    range: "8m",
    description:
      "You dredge up a person's worst nightmare and project it directly into their mind. " +
      "You may affect a number of targets within Range up to your Willpower Bonus. " +
      "Each target must pass a Willpower Test or roll on the Shock Table. " +
      "Overbleed: For every 5 points by which you exceed the Threshold, the target adds +10 to their roll on the Shock Table.",
  },
];
