import type { InsanityDisorderSeverity } from "../../types/Character";

export interface InsanityTrackEntry {
  min: number;
  max?: number;
  pointsLabel: string;
  degree: string;
  traumaModifier: string;
  disorder?: InsanityDisorderSeverity;
  disorderLabel: string;
  terminal?: boolean;
}

export interface MentalTraumaEntry {
  roll: string;
  effect: string;
}

export interface InsanityDisorderRef {
  id: string;
  type: string;
  name: string;
  severityOptions: InsanityDisorderSeverity[];
  description: string;
  typeDescription?: string;
  custom?: boolean;
}

export const INSANITY_TRACK: InsanityTrackEntry[] = [
  { min: 0, max: 9, pointsLabel: "0-9", degree: "Stable", traumaModifier: "n/a", disorderLabel: "No Disorder" },
  { min: 10, max: 19, pointsLabel: "10-19", degree: "Unsettled", traumaModifier: "+10", disorderLabel: "No Disorder" },
  { min: 20, max: 29, pointsLabel: "20-29", degree: "Unsettled", traumaModifier: "+10", disorderLabel: "No Disorder" },
  { min: 30, max: 39, pointsLabel: "30-39", degree: "Unsettled", traumaModifier: "+10", disorderLabel: "No Disorder" },
  { min: 40, max: 49, pointsLabel: "40-49", degree: "Disturbed", traumaModifier: "+0", disorder: "Minor", disorderLabel: "Minor Disorder" },
  { min: 50, max: 59, pointsLabel: "50-59", degree: "Disturbed", traumaModifier: "+0", disorderLabel: "No New Disorder" },
  { min: 60, max: 69, pointsLabel: "60-69", degree: "Unhinged", traumaModifier: "-10", disorder: "Severe", disorderLabel: "Severe Disorder" },
  { min: 70, max: 79, pointsLabel: "70-79", degree: "Unhinged", traumaModifier: "-10", disorderLabel: "No New Disorder" },
  { min: 80, max: 89, pointsLabel: "80-89", degree: "Deranged", traumaModifier: "-20", disorder: "Acute", disorderLabel: "Acute Disorder" },
  { min: 90, max: 99, pointsLabel: "90-99", degree: "Deranged", traumaModifier: "-20", disorderLabel: "No New Disorder" },
  { min: 100, pointsLabel: "100+", degree: "Terminally Insane", traumaModifier: "n/a", disorderLabel: "Retired from Play", terminal: true },
];

export const MENTAL_TRAUMAS: MentalTraumaEntry[] = [
  { roll: "01-40", effect: "The character becomes withdrawn and quiet. The character is at -10 to all Fellowship-based Tests. This lasts for 3d10 hours." },
  { roll: "41-70", effect: "The character must compulsively perform an action such as fevered praying, frantically cleaning a weapon, reciting verse, and so on, and pays little attention to anything else. All Tests that are based on Intelligence, Fellowship or Perception suffer a -10 penalty. This effect lasts for 3d10 hours." },
  { roll: "71-100", effect: "The character is constantly fearful, seeing danger everywhere and extremely jumpy. The character gains a +10 bonus to all Perception-based Tests and is at -10 penalty to his Willpower for the next 1d5 days." },
  { roll: "101-120", effect: "The character suffers from a temporary severe phobia. This effect lasts for 1d5 days." },
  { roll: "121-130", effect: "The character reacts to the slightest stress or pressure by becoming extremely agitated. When performing any task that involves a Test, the character must first pass a Willpower Test or suffer a -10 modifier to the Test. If the character gets into combat, all Tests during combat automatically suffer a -10 modifier. This effect lasts for 1d5 days." },
  { roll: "131-140", effect: "The character suffers vivid and extreme nightmares whenever they try to sleep. The next day and for the next 1d10 days the character will be exhausted by lack of sleep and gains a level of Fatigue. This effect lasts for 1d5 days." },
  { roll: "141-150", effect: "The character is struck dumb and is unable to speak. This lasts for 1d5 days." },
  { roll: "151-160", effect: "Extremely distressed and unfocused, the character refuses to eat or drink and looks in a terrible state. The character takes a -10 penalty to all Characteristics (no Characteristic can be reduced below 1) for 1d10 days." },
  { roll: "161-170", effect: "The character temporarily becomes hysterically blind or deaf. This effect lasts for 1d10 days." },
  { roll: "171+", effect: "The character becomes completely traumatised and virtually unresponsive. He can't initiate actions but may be gently led. This effect lasts for 1d10 days." },
];

export const INSANITY_RULE_TEXT = {
  trauma: "Mental Trauma represents the relatively short-term damage to a character's state of mind that he suffers after experiencing a horrific or supernatural event. Each time the character gains 10 Insanity Points he must make a Trauma Test. This is a Willpower Test, modified by how many Insanity Points the character has accrued in total. If the Test is failed, roll d100 and add 10 for every degree of failure, then compare the result to the Mental Traumas table.",
  recovery: "With the GM's permission, a character may use xp to remove Insanity Points. It costs 100 xp to remove a single Insanity Point. A character may never go down a degree of madness and so will never lose their disorders. Buying back Insanity Points should be represented as time and effort spent by the character in game.",
};

export const INSANITY_RECOVERY_EXAMPLES = [
  "Prayer, fasting, penance and mortification of the flesh.",
  "Long-term palliative care.",
  "Recuperation in quiet and pleasant surroundings.",
  "Contemplation of the great holy works or other articles of faith.",
];

export const INSANITY_SEVERITIES: Array<{ severity: InsanityDisorderSeverity; description: string }> = [
  { severity: "Minor", description: "The effects of the disorder manifest rarely or are experienced only to a small degree. Any Test to overcome the effects of the disorder gains a +10 bonus." },
  { severity: "Severe", description: "The effects of the disorder are stronger and may occur regularly. There is no modifier to Tests made to overcome the effects of the disorder." },
  { severity: "Acute", description: "The effects of the disorder are very strong and occur at the slightest stimulation. Any Test to overcome the effects of the disorder takes a -10 penalty." },
];

const PHOBIA_TEXT =
  "The character has a deep dislike and fear for a particular thing or circumstance. A phobic character must succeed on a Willpower Test to interact with the focus of his phobia. Enforced or gratuitous exposure to the focus may incur Fear Tests.";
const OBSESSION_TEXT =
  "The character has a compulsion to perform a particular action or is obsessed with a particular thing. A character must make a Willpower Test not to act in a compulsive way or not pursue his obsession when the opportunity arises.";
const VISIONS_TEXT =
  "The character sees things that are not there and hears things that others do not. Acute sufferers may experience visions into which they are totally immersed.";
const DELUSION_TEXT =
  "The character suffers from a particular false belief that he has to act on as if it were the truth, despite his better judgement or evidence to the contrary.";

export const INSANITY_DISORDER_REFERENCE: InsanityDisorderRef[] = [
  { id: "flesh-is-weak", type: "The Flesh is Weak", name: "The Flesh is Weak", severityOptions: ["Severe", "Acute"], description: "The character sees his flesh as weak and will constantly blame it for his failures and problems. He will also try to change and/or remove his flesh, becoming increasingly obsessed with surgical modification as well as bionic replacement." },
  { id: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: PHOBIA_TEXT, description: "The character has an abiding fear and loathing of corpses and the dead, possibly due to the fact that sometimes they don't stay dead." },
  { id: "phobia-fear-of-insects", type: "Phobia", name: "Fear of Insects", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: PHOBIA_TEXT, description: "Scuttling things with many legs are the character's waking nightmare: faceless, numberless and hungry, forever hungry." },
  { id: "phobia-custom", type: "Phobia", name: "Custom Phobia", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: PHOBIA_TEXT, description: "Define a custom focus for the character's phobia.", custom: true },
  { id: "obsession-kleptomania", type: "Obsession/Compulsion", name: "Kleptomania", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: OBSESSION_TEXT, description: "The character compulsively steals small objects if he has the opportunity. Often the character attaches no value to such objects." },
  { id: "obsession-self-mortification", type: "Obsession/Compulsion", name: "Self-Mortification", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: OBSESSION_TEXT, description: "The character must scourge and whip his flesh on a regular basis, or after a particular event such as killing, in order to purge away the sin of his actions through pain." },
  { id: "obsession-custom", type: "Obsession/Compulsion", name: "Custom Obsession/Compulsion", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: OBSESSION_TEXT, description: "Define a custom obsession or compulsive action for the character.", custom: true },
  { id: "visions-dead-comrade", type: "Visions and Voices", name: "Dead Comrade", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: VISIONS_TEXT, description: "The character hears the voice of an old friend now long-dead. At a Severe level, he may even have visions of his friend or converse with them, if his condition becomes Acute." },
  { id: "visions-flashbacks", type: "Visions and Voices", name: "Flashbacks", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: VISIONS_TEXT, description: "The character relives traumatic moments from his life. The length and vividness of these episodes vary according to the seriousness of his condition." },
  { id: "visions-custom", type: "Visions and Voices", name: "Custom Visions and Voices", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: VISIONS_TEXT, description: "Define a custom vision, voice, or intrusive hallucination for the character.", custom: true },
  { id: "delusion-invulnerability", type: "Delusion", name: "Invulnerability", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: DELUSION_TEXT, description: "The character believes that he will never get severely injured, either through luck or divine providence." },
  { id: "delusion-righteousness", type: "Delusion", name: "Righteousness", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: DELUSION_TEXT, description: "The character believes his choices are right and justified, no matter what the cost." },
  { id: "delusion-custom", type: "Delusion", name: "Custom Delusion", severityOptions: ["Minor", "Severe", "Acute"], typeDescription: DELUSION_TEXT, description: "Define a custom false belief for the character.", custom: true },
  { id: "horrific-nightmares", type: "Horrific Nightmares", name: "Horrific Nightmares", severityOptions: ["Minor", "Severe"], description: "The character suffers from vivid and reoccurring nightmares. After any stressful day, the character must pass a Willpower Test in order not to succumb to his terrors while asleep. If he fails, the character suffers a single level of Fatigue on the following day." },
];

export function getInsanityTrackEntry(points: number): InsanityTrackEntry {
  const safePoints = Math.max(0, Math.floor(points || 0));
  return (
    INSANITY_TRACK.find((entry) =>
      entry.max === undefined ? safePoints >= entry.min : safePoints >= entry.min && safePoints <= entry.max
    ) ?? INSANITY_TRACK[0]
  );
}

export function getNextInsanityTrackEntry(points: number): InsanityTrackEntry | undefined {
  const safePoints = Math.max(0, Math.floor(points || 0));
  return INSANITY_TRACK.find((entry) => entry.min > safePoints);
}

export function getNextInsanityDegreeEntry(points: number): InsanityTrackEntry | undefined {
  const safePoints = Math.max(0, Math.floor(points || 0));
  const currentDegree = getInsanityTrackEntry(safePoints).degree;
  return INSANITY_TRACK.find((entry) => entry.min > safePoints && entry.degree !== currentDegree);
}

export function getInsanityDisorderRef(referenceId?: string): InsanityDisorderRef | undefined {
  if (!referenceId) return undefined;
  return INSANITY_DISORDER_REFERENCE.find((disorder) => disorder.id === referenceId);
}

export function getMentalTraumaRef(roll?: string): MentalTraumaEntry | undefined {
  if (!roll) return undefined;
  return MENTAL_TRAUMAS.find((entry) => entry.roll === roll);
}
