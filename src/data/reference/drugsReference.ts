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
];
