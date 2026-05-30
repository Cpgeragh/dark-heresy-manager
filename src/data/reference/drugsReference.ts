// src/data/reference/drugsReference.ts
// Reference data for drugs and combat stimulants from the Core Rulebook.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DrugRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Cost per dose */
  value: string;
  rarity: string;
  /** Primary mechanical effect when taken */
  effect: string;
  /** How long the effect lasts */
  duration?: string;
  /** Crash / negative effects after the drug wears off */
  sideEffect?: string;
  /** Flavour text and additional notes */
  notes?: string;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export const DRUGS_REFERENCE: DrugRef[] = [

  // ── Core Rulebook ─────────────────────────────────────────────────────────

  {
    id: "cr-de-tox",
    name: "De-Tox",
    source: SkillSource.CR,
    value: "65 Thrones",
    rarity: "Rare",
    effect:
      "Immediately ends the ongoing effects, both positive and negative, of any drugs, toxins or " +
      "gases affecting the character (unless the effect states that de-tox is not effective against them).",
    sideEffect:
      "Stunned for a number of Rounds equal to 1d10 minus Toughness Bonus (a result of 0 or less " +
      "means no ill effects). Side effects include vomiting, nosebleeds and a great voiding of the bowels.",
  },

  {
    id: "cr-frenzon",
    name: "Frenzon",
    source: SkillSource.CR,
    value: "95 Thrones",
    rarity: "Very Rare",
    effect: "Gains the Frenzy talent and immunity to Fear.",
    duration: "1d10 minutes",
    notes:
      "A generic name for a variety of combat drugs most often used within penal legion units. " +
      "Once administered, the subject becomes fearless and fanatical in combat.",
  },

  {
    id: "cr-obscura",
    name: "Obscura",
    source: SkillSource.CR,
    value: "285 Thrones",
    rarity: "Rare",
    effect:
      "User enters a dream-like state. If required to engage in combat, treat as under the " +
      "effects of a hallucinogen grenade.",
    duration: "1d5 hours",
    sideEffect:
      "For 1d10 hours after the effects wear off, the user enters a deep depression — " +
      "unless another dose of obscura is taken.",
    notes:
      "Prohibited and the subject of widespread crackdowns, yet remains widely used among many " +
      "Imperial subjects. Smugglers can often make a good living importing and selling it.",
  },

  {
    id: "cr-slaught",
    name: "Slaught",
    source: SkillSource.CR,
    value: "75 Thrones",
    rarity: "Scarce",
    effect: "Increases the user's Agility Bonus and Perception Bonus by 3.",
    duration: "2d10 minutes",
    sideEffect:
      "When the drug runs its course, the user must Test Toughness or take a –20 penalty to " +
      "Agility Tests and Perception Tests for 1d5 hours.",
    notes:
      "Also known as onslaught. Heightens awareness and improves reaction time, literally speeding " +
      "up the user — but causes Fatigue and neural damage with prolonged use.",
  },

  {
    id: "cr-spook",
    name: "Spook",
    source: SkillSource.CR,
    value: "395 Thrones",
    rarity: "Rare",
    effect:
      "Without Psy Rating: Willpower Test or gain 1d5 Insanity Points. On a success, gain a random " +
      "minor psychic power (Table 5–15) for 1d5 hours, manifested via a Hard (–20) Willpower Test. " +
      "With Psy Rating 1+: Willpower Test — failure = 2 Insanity Points; success = +2 to all Power " +
      "Rolls for 1 hour.",
    duration: "1d5 hours (powers)",
    sideEffect:
      "Characters with Psy Rating add +25 to any rolls on the Psychic Phenomena table.",
    notes: "Random power determined by Table 5–15: Random Psychic Powers in the Core Rulebook.",
  },

  {
    id: "cr-stimm",
    name: "Stimm",
    source: SkillSource.CR,
    value: "20 Thrones",
    rarity: "Average",
    effect:
      "Ignores all negative effects to Characteristics from Damage or Critical Damage. " +
      "Cannot be Stunned.",
    duration: "3d10 Rounds",
    sideEffect:
      "When the stimm wears off, the character takes a –20 penalty to Strength, Toughness and " +
      "Agility Tests for one hour.",
    notes:
      "A powerful drug that works to mask pain and drive fighters on when their bodies would " +
      "otherwise give up.",
  },

  // ── Book of Judgement ─────────────────────────────────────────────────────

  {
    id: "boj-sandstone",
    name: "Sandstone",
    source: SkillSource.BoJ,
    value: "95 Thrones",
    rarity: "Scarce",
    effect: "+30 to all Willpower-based Tests and +10 to resist Interrogation.",
    duration: "1d5+3 hours",
    sideEffect:
      "Must pass a Difficult (–10) Toughness Test or gain 1 Fatigue when the drug wears off.",
    notes: "Yellowish granules rubbed into the gums or injected.",
  },

  {
    id: "boj-clear",
    name: "Clear",
    source: SkillSource.BoJ,
    value: "110 Thrones",
    rarity: "Rare",
    effect:
      "Grants the Decadence Talent and +30 to Toughness-based Tests vs passing out or poison effects.",
    sideEffect:
      "Causes a powerful migraine approximately 3 hours after use; must refrain from strenuous work for 1d5 hours.",
    notes: "Tar-like bitter gum, chewed to resist alcohol and common poisons.",
  },

  {
    id: "boj-eazille",
    name: "Eazille",
    source: SkillSource.BoJ,
    value: "230 Thrones",
    rarity: "Very Rare",
    effect:
      "Powerful inhibition reducer. User ignores moral constraints and must pass an Ordinary (+10) " +
      "Willpower Test to resist baser instincts.",
    duration: "1d5 hours (+1 per dose taken that week)",
    sideEffect: "Repeated use increases the effects permanently over time.",
    notes: "Possibly alien in origin.",
  },

  {
    id: "boj-holdfast",
    name: "Holdfast",
    source: SkillSource.BoJ,
    value: "165 Thrones",
    rarity: "Very Rare",
    effect: "Neurological drugs are at –30 to their normal effects.",
    duration: "2d5 hours",
    sideEffect: "–20 to all Willpower-based Tests while under effect.",
    notes: "Greasy bluish liquid, injected to stiffen the mind.",
  },

  {
    id: "boj-hyperexia",
    name: "Hyperexia",
    source: SkillSource.BoJ,
    value: "80 Thrones",
    rarity: "Scarce",
    effect: "Thickens skin to a rubbery texture. Grants Resistance (Cold, Heat) and inflicts 1 Fatigue.",
    duration: "Ongoing — one dose per week required to maintain the effect.",
    notes:
      "Must be taken at least a dozen times over as many days before it takes effect.",
  },

  {
    id: "boj-karrikian-red-eye",
    name: "Karrikian Red-Eye",
    source: SkillSource.BoJ,
    value: "185 Thrones",
    rarity: "Rare",
    effect:
      "Extends vision into the infra-red spectrum. +20 to Awareness Tests to detect heat-based images.",
    duration: "1d5 hours",
    sideEffect:
      "If used more than once per day, must pass a Difficult (–10) Toughness Test or suffer –20 to " +
      "all vision-based Tests for that day.",
  },

  {
    id: "boj-leatherwort",
    name: "Leatherwort",
    source: SkillSource.BoJ,
    value: "115 Thrones",
    rarity: "Scarce",
    effect:
      "Treated areas count as having 2 additional AP (stacks with regular armour) and +10 to " +
      "Toughness-based Tests.",
    duration: "Until treated areas return to normal colour.",
    notes:
      "Dried fungal powder rubbed into skin. Treated areas turn mottled dark green then slowly " +
      "return to normal.",
  },

  {
    id: "boj-scav-glysten",
    name: "Scav-Glysten",
    source: SkillSource.BoJ,
    value: "155 Thrones",
    rarity: "Rare",
    effect:
      "–30 to any tracking attempts by scent against the user. Grants Concealment and Shadowing " +
      "bonuses when hiding from or tracking animals.",
    duration: "1d10 hours",
    notes: "Injected chemical that eliminates all scent and pheromone output.",
  },

  {
    id: "boj-scraper-ripper",
    name: "Scraper-Ripper",
    source: SkillSource.BoJ,
    value: "90 Thrones",
    rarity: "Scarce",
    effect: "+30 to all Agility-based Tests.",
    duration: "1d5 hours",
    sideEffect:
      "Must pass a Hard (–20) Willpower Test to avoid reacting violently when surprised by any stimuli.",
    notes: "Rendered underhive fish paste, injected or inhaled.",
  },

  {
    id: "boj-sisk-ash",
    name: "Sisk Ash",
    source: SkillSource.BoJ,
    value: "80 Thrones",
    rarity: "Scarce",
    effect:
      "Induces calm; user may need an Easy (+30) Willpower Test to perform reluctant tasks. " +
      "Smoke interferes with Cybermastiff scent-tracking.",
    duration: "1d5 hours",
    notes:
      "Burnt bush-plant mixed with lho, smoked. Pure (unmixed) version causes unconsciousness for " +
      "1 hour on a failed Hard (–20) Toughness Test.",
  },

  {
    id: "boj-truth-revealed",
    name: "The Truth Revealed",
    source: SkillSource.BoJ,
    value: "135 Thrones",
    rarity: "Rare",
    effect: "–50 to all Tests made to resist Interrogation or other attempts to extract information.",
    duration: "3d5 hours minus Toughness Bonus",
    notes: "Powerful serum that depresses resistance to questioning. Also known as Verity or Veal.",
  },

  {
    id: "boj-zumthorian-greyve",
    name: "Zumthorian Greyve",
    source: SkillSource.BoJ,
    value: "125 Thrones",
    rarity: "Rare",
    effect: "Ignore Fatigue for the duration. +40 to all Toughness-based Tests and to resist Interrogation.",
    duration: "2d5 hours",
    sideEffect: "Must pass a Very Hard (–30) Toughness Test or gain 2 Fatigue when the effect wears off.",
  },

  // ── Daemon Hunter ─────────────────────────────────────────────────────────

  {
    id: "dh-dreamjuice",
    name: "Dreamjuice",
    source: SkillSource.DH,
    value: "75 Thrones",
    rarity: "Scarce",
    effect: "+10 to all Intelligence Tests.",
    duration: "30 minutes",
    sideEffect:
      "–20 to all Willpower Tests while under effect. After the effect wears off: –10 to all " +
      "Perception Tests.",
    notes: "Not physically addictive.",
  },

  {
    id: "dh-imperiums-fervour",
    name: "Imperium's Fervour",
    source: SkillSource.DH,
    value: "20 Thrones",
    rarity: "Scarce",
    effect:
      "Fear Tests reduced by one degree of severity. Insanity Points gained are reduced by 2 " +
      "(minimum 1). –10 to Perception Tests while active.",
    duration: "24 hours (12 hours if taken orally)",
    sideEffect:
      "Memories of events during the effect become hazy — Hard (–20) Intelligence Test to recall; " +
      "Very Hard after one month.",
  },
];
