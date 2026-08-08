// src/data/reference/drugsReference.ts
// Reference data for drugs and combat stimulants from the Core Rulebook.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DrugRef {
  id: string;
  name: string;
  source: SkillSource;
  /** Weight per dose */
  weight?: string;
  /** Cost per dose */
  value: string;
  availability: string;
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
    availability: "Rare",
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
    availability: "Very Rare",
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
    availability: "Rare",
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
    availability: "Scarce",
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
    availability: "Rare",
    effect:
      "Without Psy Rating: Willpower Test or gain 1d5 Insanity Points. On a success, gain a random " +
      "minor psychic power (Table 5–15) for 1d5 hours, manifested via a Hard (–20) Willpower Test. " +
      "With Psy Rating 1+: Willpower Test — failure = 2 Insanity Points; success = +2 to all Power " +
      "Rolls for 1 hour.",
    duration: "1d5 hours (powers)",
    sideEffect: "Characters with Psy Rating add +25 to any rolls on the Psychic Phenomena table.",
    notes: "Random power determined by Table 5–15: Random Psychic Powers in the Core Rulebook.",
  },

  {
    id: "cr-stimm",
    name: "Stimm",
    source: SkillSource.CR,
    value: "20 Thrones",
    availability: "Average",
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

  // ── Inquisitor's Handbook ────────────────────────────────────────────────
  {
    id: "ih-night-dust",
    name: "Night Dust",
    source: SkillSource.IH,
    weight: "—",
    value: "25 Thrones",
    availability: "Very Rare",
    effect:
      "A single dose imposes a −20 penalty on all Tests, while the imbiber experiences mild hallucinations and becomes disassociated from their emotions. After 2d10 minutes, the afflicted character slips into a deep feverish slumber filled with vivid and often violent dreams reflecting the darkest facets of their own mind. This state lasts for 1d10 hours and upon wakening the character must succeed on an Ordinary (+10) Willpower Test or gain 1d5 Insanity Points from the experience. Drinking the dust is far more potent and dangerous: the effects last 4d10 hours and the Willpower Test to avoid Insanity Points is Difficult (−10).",
    notes:
      "The predatory Nightwings of Dusk produce a potent narcotic dust that they use to subdue their victims, lulling them into a nightmarish stupor, while the haemovoric Nightwing quickly sucks them dry. This substance, harvested from captured or slain creatures and rendered down into a concentrated form, is a powerful and prohibited drug. Usually burned as incense or, for a more powerful effect, dissolved in amasec, the dream-racked stupor that night dust induces can last for days, and the term “dusk dream” has long since become local parlance on Malfi for an unexpected disappearance or bout of madness.",
  },
  {
    id: "ih-panimune",
    name: "Panimune",
    source: SkillSource.IH,
    weight: "—",
    value: "40 Thrones",
    availability: "Average",
    duration: "1d5+1 hours",
    effect:
      "The dose is usually applied by pressure-hypo directly to the neck and provides a +30 bonus on Toughness Tests made to resist toxins and diseases. As well, this bonus also applies to all Carouse Tests. The effects of a single dose lasts 1d5+1 hours.",
    sideEffect:
      "After the dose expires, the subject becomes Fatigued until he rests. The subject may immediately re-dose himself (which also negates the Fatigue), but each time this is done without a period of 8 hours rest, he must pass a Toughness Test or take a −10 penalty on Strength and Toughness Tests for 1 hour and permanently reduce Willpower by 1d5.",
    notes:
      "This highly potent medicinal compound serves to greatly enhance resistance to most forms of toxins, contaminations, micro-parasites and infection for a period of hours after its application, although repeated use can cause physiological damage. Panimune is found in the med-kits of many enforcer squads, tech-priests and other parties wishing to descend into the underhive or travel through hazard zones.",
  },
  {
    id: "ih-slam",
    name: "Slam",
    source: SkillSource.IH,
    weight: "—",
    value: "100 Thrones",
    availability: "Common (Volg), Very Rare (elsewhere)",
    duration: "1d5 Rounds",
    effect:
      "A character who consumes a dose of slam gains the benefits of the Unnatural Strength (× 2) and Unnatural Toughness (× 2) traits for 1d5 Rounds.",
    sideEffect:
      "Once the drug has run its course, a user permanently reduces their Strength and Agility Characteristics by 1d5.",
    notes:
      "Originating in the infamous Hive Volg on Fenksworld, slam is the worst kind of combat drug imaginable. Harvested from the chemical residue found in the intestinal tracts of the man-sized corpse roaches infesting the meat-sumps, it is first crystallised and then ground into a bile-yellow dust. Slam triggers a biological reaction, causing a massive boost in pain resistance and physical power. The user’s muscles and veins visibly spasm and pulse under its influence. Though the effects are short-lived, it is highly sought after despite the long-term damage to the nervous system that even the smallest dose induces.",
  },

  {
    id: "ih-somna",
    name: "Somna",
    source: SkillSource.IH,
    weight: "—",
    value: "500 Thrones",
    availability: "Scarce",
    effect:
      "Safely using somna, (the exact dosage must be calculated for each subject), requires a successful Difficult (−10) Medicae Test. A failed Test leads to unpredictable results, such that a failure by four degrees or more results in death. A successful Test places the subject into a death-like trance for a period of time between one to ten days. The subject can be roused before this predetermined time by applying a stimm directly to the heart, but this is risky, and the subject must succeed on a Toughness Test or die from cardiac arrest.",
    notes:
      "An unusual and powerful drug to say the least, somna is a synthesised extract taken from the pollen of the Nephyis Orchid of Iocanthos. In its refined form, it is capable of producing a powerful coma-like effect in the subject, shutting down the metabolism and life processes, almost to the verge of death, and plunging the mind into a bottomless oblivion beyond the deepest sleep. The subject of somna appears to all but the most probing medical examination to be dead and can survive in this state for days or weeks without food or water and with almost no air. Aside from its medical uses, somna has been put to numerous nefarious purposes in the past from kidnapping, feigning death to evade capture and even as a particularly cruel murder weapon (with the victim waking up to find themselves buried alive). In recent years, the more vicious narco-gangs of the Sibillan underhive have also used heavily adulterated somna to create “spiral black”, a highly potent and extremely dangerous variant of obscura.",
  },
  {
    id: "ih-verita",
    name: "Verita",
    source: SkillSource.IH,
    weight: "—",
    value: "500 Thrones",
    availability: "Very Rare",
    duration: "3d10 minutes",
    effect:
      "Consuming verita imposes a −10 penalty on Willpower Tests and a −20 penalty on Perception Tests for 3d10 minutes. While affected, the imbiber experiences visions and altered perceptions as determined by the GM. The user is always convinced of the truth of these visions and indeed, the contents of their “waking dream” can be valuable for overcoming some challenge or difficulty.",
    sideEffect:
      "Once the drug has run its course, the imbiber must succeed on a Willpower Test or gain 1d5 Insanity Points. Those victims who gain at least 1 Insanity Point also have a 20% chance of gaining 1d5 Corruption Points as well.",
    notes:
      "The existence of verita is largely a secret and the Ordos Calixis are very happy to keep it that way. A powerful and singular hallucinogenic, once taken, the drinker’s perceptions shift slowly to reveal the seeming interplay of distant realms, past, present and future; leading its addicts to claim that they can “see through time” to uncover unknown truths and witness incredible visions. Whether verita’s gifts are mere illusions or a sudden immersive vision unfettered by the mortal perceptions of time, is a matter that remains unresolved, but its effects alone are enough to have the Ordos declare it a Moral Threat. The substance’s composition is unknown with many of its trace constituents completely defying analysis. When encountered, it usually takes the form of a viscous deep blue liquid, with a scent suggestive both of flower blossoms and subtle rot. Verita is a drug restricted by its rarity and cost to the very wealthy.",
  },
  {
    id: "ih-dryas",
    name: "Dryas",
    source: SkillSource.IH,
    weight: "—",
    value: "200 Thrones",
    availability: "Rare",
    duration: "Three days",
    effect:
      "A single dose of dryas lasts for three days. During that time, the character taking it receives a +20 bonus to Survival Tests made in arid environments and he requires only half of his usual water intake. However, he suffers a −10 penalty to all Strength and Perception based Tests while under its influence. In addition, those under its effects also suffer a −5 penalty to all Fellowship based Tests due to their slurred speech and vacant manner.",
    sideEffect: "Dryas is not addictive, but extended use can cause permanent systemic damage.",
    notes:
      "Dryas is a compound originally derived from a series of desert dwelling lizards native to the agri-world of Dreah, synthesized by Mechanicus explorators and available commercially as an emergency survival tool. Dryas causes biochemical changes in the human body enabling extended periods of survival in arid atmospheres or when there is no fresh water. Side effects of taking dryas include atrophied taste and smell, and a very unpleasant sense of weakness and lassitude. Few take dryas without an extreme need to do so.",
  },

  {
    id: "ih-ghostfire-pollen-extract",
    name: "Ghostfire Pollen Extract",
    source: SkillSource.IH,
    weight: "—",
    value: "300 Thrones",
    availability: "Very Rare",
    duration: "2d10 minutes",
    effect:
      "A dose of Ghostfire pollen extract grants the Fearless and Frenzy talents and the Unnatural Agility (×2) trait. The effects last for 2d10 minutes.",
    sideEffect:
      "As a side effect, however, the user takes 1 point of Damage (ignoring Armour and Toughness Bonus) as he bleeds through his pores.",
    notes:
      "An incredibly dangerous liquid distilled from the condensed pollen of the Ghostfire flowers of Iocanthos, Ghostfire extract is the material from which the bulk of the Segmentum Obscurus’s versions of Frenzon are actually derived. The potency of the extract is such that the Imperium long ago concluded it was a far better idea to create a “lesser version” than lose soldiers to the overwhelming effects of a pure dose.",
  },
  {
    id: "ih-halo",
    name: "Halo",
    source: SkillSource.IH,
    weight: "—",
    value: "100 Thrones",
    availability: "Common",
    duration: "1d10 hours",
    effect:
      "A dose of Halo adds +10 on all tests to resist Fear and Pinning, but reduces Perception by −10, effects lasts for 1d10 hours.",
    notes:
      "Commonly given to Penal Legionnaires, Halo creates a compliant state suitable for combat prisoner indoctrination. Users can be better readied and even made enthusiastic to meet their coming fate on the battlefield. Other heavily stressed troopers use it to forcibly induce a calmer frame of mind.",
  },
  {
    id: "ih-kick",
    name: "Kick",
    source: SkillSource.IH,
    weight: "—",
    value: "75 Thrones",
    availability: "Average",
    duration: "2d10 Rounds",
    effect: "A single dose of Kick removes all Fatigue levels and provides immunity to Fatigue for 2d10 Rounds.",
    sideEffect: "Once it wears off, the user takes 1d5 levels of Fatigue.",
    notes:
      "A potent combination of neural accelerants and stimulants, Kick makes the user feel supercharged with energy. It is ideal for short-term assaults as the effects burn off rapidly inducing profound fatigue and listlessness for the next several hours.",
  },
  {
    id: "ih-torpor",
    name: "Torpor",
    source: SkillSource.IH,
    weight: "—",
    value: "500 Thrones",
    availability: "Very Rare",
    effect:
      "A single dose of torpor lasts for 1d10 minus the subject’s Toughness Bonus in hours, during which time the subject is overcome by a grey anxiety-ridden haze in which he counts as Fatigued and must succeed in a Difficult (−20) Willpower Test to perform any Actions of his own volition. In addition, psychic characters have their Psy-Rating reduced by 4 while under this drug’s effects.",
    notes:
      "Long used by the masters of the Black Ships to control their harvest of charges, torpor is a chemical cocktail of neural-inhibitors and narcotics deigned to render the subject docile and, more importantly, negate their ability to use Psychic Powers. Likewise the Holy Ordos maintains it own supplies of Torpor for prisoner control and other uses, while hereteks and some cults have been known to manufacture their somewhat unreliable version for their own dark purposes.",
  },

  {
    id: "boj-sandstone",
    name: "Sandstone",
    source: SkillSource.BoJ,
    value: "95 Thrones",
    availability: "Scarce",
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
    availability: "Rare",
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
    availability: "Very Rare",
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
    availability: "Very Rare",
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
    availability: "Scarce",
    effect:
      "Thickens skin to a rubbery texture. Grants Resistance (Cold, Heat) and inflicts 1 Fatigue.",
    duration: "Ongoing — one dose per week required to maintain the effect.",
    notes: "Must be taken at least a dozen times over as many days before it takes effect.",
  },

  {
    id: "boj-karrikian-red-eye",
    name: "Karrikian Red-Eye",
    source: SkillSource.BoJ,
    value: "185 Thrones",
    availability: "Rare",
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
    availability: "Scarce",
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
    availability: "Rare",
    effect:
      "-30 to any tracking attempts by scent against the user. Gain the Concealment and Shadowing " +
      "skills when attempting to hide from or track animals.",
    duration: "1d10 hours",
    notes: "Injected chemical that eliminates all scent and pheromone output.",
  },

  {
    id: "boj-scraper-ripper",
    name: "Scraper-Ripper",
    source: SkillSource.BoJ,
    value: "90 Thrones",
    availability: "Scarce",
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
    availability: "Scarce",
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
    availability: "Rare",
    effect:
      "–50 to all Tests made to resist Interrogation or other attempts to extract information.",
    duration: "3d5 hours minus Toughness Bonus",
    notes: "Powerful serum that depresses resistance to questioning. Also known as Verity or Veal.",
  },

  {
    id: "boj-zumthorian-greyve",
    name: "Zumthorian Greyve",
    source: SkillSource.BoJ,
    value: "125 Thrones",
    availability: "Rare",
    effect:
      "Ignore Fatigue for the duration. +40 to all Toughness-based Tests and to resist Interrogation.",
    duration: "2d5 hours",
    sideEffect:
      "Must pass a Very Hard (–30) Toughness Test or gain 2 Fatigue when the effect wears off.",
  },

  // ── Daemon Hunter ─────────────────────────────────────────────────────────

  {
    id: "dh-dreamjuice",
    name: "Dreamjuice",
    source: SkillSource.DH,
    value: "75 Thrones",
    availability: "Scarce",
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
    availability: "Scarce",
    effect:
      "Fear Tests reduced by one degree of severity. Insanity Points gained are reduced by 2 " +
      "(minimum 1). –10 to Perception Tests while active.",
    duration: "24 hours (12 hours if taken orally)",
    sideEffect:
      "Memories of events during the effect become hazy — Hard (–20) Intelligence Test to recall; " +
      "Very Hard after one month.",
    notes:
      "Users are prone to acts of insane courage and have little instinct for self-preservation.",
  },
];
