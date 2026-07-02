export interface CorruptionTrackEntry {
  min: number;
  max?: number;
  pointsLabel: string;
  degree: string;
  malignancyModifier: string;
  mutation: string;
  terminal?: boolean;
}

export interface MoralThreatEntry {
  title: string;
  description: string;
}

export interface CorruptionMalignancyRef {
  id: string;
  roll: string;
  name: string;
  effect: string;
}

export const CORRUPTION_TRACK: CorruptionTrackEntry[] = [
  { min: 1, max: 30, pointsLabel: "01-30", degree: "Tainted", malignancyModifier: "+0", mutation: "-" },
  { min: 31, max: 60, pointsLabel: "31-60", degree: "Soiled", malignancyModifier: "-10", mutation: "First Test" },
  { min: 61, max: 90, pointsLabel: "61-90", degree: "Debased", malignancyModifier: "-20", mutation: "Second Test" },
  { min: 91, max: 99, pointsLabel: "91-99", degree: "Profane", malignancyModifier: "-30", mutation: "Third Test" },
  {
    min: 100,
    pointsLabel: "100+",
    degree: "Damned",
    malignancyModifier: "Character removed from play",
    mutation: "",
    terminal: true,
  },
];

export const CORRUPTION_RULE_TEXT = {
  points:
    "All Acolytes sooner or later gain Corruption Points (CP). Corruption Points operate almost exactly like Insanity Points, except that they are gained through exposure to the warp, dark rituals, cursed artefacts and Daemonic influence. The more Corruption Points a character has, the more afflicted he becomes; this is reflected in the rules below by the risk of Malignancies and Mutation as shown on Table 8-7: The Corruption Track.",
  commonCitizen:
    "The rules for Corruption presented here are for use with Player Characters; Acolytes are men and women of destiny and purpose, exactly the sort of people that the Ruinous Powers seek to slowly corrupt and toy with. For most, the touch of Chaos brings summary destruction, madness, mutation and death.",
  malignancyTest:
    "For every 10 Corruption Points a character gains, he must Test Willpower to see if his corruption has manifested as literal damage to his body and soul. This roll is modified depending on the number of CPs the character already possesses as noted on Table 8-7: The Corruption Track. If the Test is failed, the character's corruption of spirit is given form. These metaphysical and psychosomatic scars are called Malignancies, and are randomly rolled on Table 8-8: Malignancies. If a player rolls a result that he has previously suffered for failing a previous Malignancy Test, he must roll again.",
  mutation:
    "A character's Corruption Points total is also used to determine the warping effects of Chaos upon his body. As his Corruption builds, his flesh may revolt, twisted by the Dark Gods. Of course, such is the insidious nature of Chaos that it is constantly hunting for weakness in mind and body, testing a character's defences until it can find a way into his soul. For every 30 Corruption Points a character gains, he must make a Test against two Characteristics of his choice or suffer a random Minor Mutation (see Chapter XII: Aliens, Heretics & Antagonists). He may not Test against the same Characteristics twice to resist mutation. A player should make a note on his Character Sheet of which Characteristics he has already Tested to resist mutation.",
};

export const MORAL_THREATS: MoralThreatEntry[] = [
  {
    title: "Warp Shock",
    description:
      "If a character suffers Insanity Points resulting from a failed Fear Test involving entities from the warp, the number of Corruption Points inflicted on him are equal to the being's Fear Rating score (i.e. Frightening 2 equals 2 CP).",
  },
  {
    title: "Rending the Veil",
    description:
      "Characters caught in a full-blown intrusion of the warp into corporeal reality gain Corruption Points from the experience. Just how many depends on what occurs and the severity of the breach. This might be anywhere from a single point to several d10s in value.",
  },
  {
    title: "Sorcery",
    description:
      "The practice of sorcery, witnessing dread rituals and invoking Daemons are all causes of Corruption, regardless of the reason. Normally minor rituals cause 1d10 Corruption Points and major ceremonies can cause many more.",
  },
  {
    title: "Blasphemous Lore",
    description:
      "Knowledge itself can corrupt, and the study of certain tomes, pict-logs and even some debased artwork can cause Corruption in the viewer.",
  },
  {
    title: "Dark Deeds",
    description:
      "Evil acts done in the furtherance of a malignancy, or in pursuit of forbidden lore, or done to appease a Daemon always cause Corruption Points.",
  },
  {
    title: "Vile Persuasion",
    description:
      "Many Daemons and cult leaders are masters of insidious temptation and of sowing the seeds of doubt in a faithful heart. Their words and arguments can corrupt where force alone would fail.",
  },
];

export const CORRUPTION_MALIGNANCIES: CorruptionMalignancyRef[] = [
  {
    id: "palsy",
    roll: "01-10",
    name: "Palsy",
    effect:
      "The character suffers from numerous minor tics, shakes and tremors with no medical cause. Reduce his Agility by 1d10.",
  },
  {
    id: "dark-hearted",
    roll: "11-15",
    name: "Dark-hearted",
    effect:
      "The character grows increasingly cruel, callous and vindictive. Reduce his Fellowship by 1d10.",
  },
  {
    id: "ill-fortuned",
    roll: "16-20",
    name: "Ill-fortuned",
    effect:
      "Whenever the character uses a Fate Point roll a d10. On a score of 7, 8, 9 or 10 it has no effect but is lost anyway.",
  },
  {
    id: "skin-afflictions",
    roll: "21-22",
    name: "Skin Afflictions",
    effect:
      "The character is plagued by boils, scabs, weeping sores and the like. He takes a -20 penalty to all Charm Tests.",
  },
  {
    id: "night-eyes",
    roll: "23-25",
    name: "Night Eyes",
    effect:
      "Light pains the character, and unless he shields his eyes, he suffers a -10 penalty on all Tests when in an area of bright light.",
  },
  {
    id: "morbid",
    roll: "26-30",
    name: "Morbid",
    effect:
      "The character finds it hard to concentrate as his mind is filled with macabre visions and tortured, gloom-filled trains of thought. The character's Intelligence is reduced by 1d10.",
  },
  {
    id: "witch-mark",
    roll: "31-33",
    name: "Witch-mark",
    effect:
      "The character develops some minor physical deformity or easily concealable mutation. It is small, but perhaps enough to consign him to the stake if found out by a fanatical witch hunter. He must hide it well!",
  },
  {
    id: "fell-obsession",
    roll: "34-45",
    name: "Fell Obsession",
    effect:
      "This is the same as the Obsession Disorder. However, in this case the character is obsessed by a sinister or malign focus, such as collecting finger-bone trophies, ritual scarification, carrying out meaningless vivisections, etc.",
  },
  {
    id: "hatred",
    roll: "46-50",
    name: "Hatred",
    effect:
      "The character develops an implacable hatred of a single group, individual or social class. The character will never side with or aid them without explicit orders or other vital cause, and even then grudgingly.",
  },
  {
    id: "irrational-nausea",
    roll: "51-55",
    name: "Irrational Nausea",
    effect:
      "The character feels sick at the sight or sound of some otherwise innocuous thing such as prayer books and holy items, bare flesh, human laughter, fresh food, shellfish, etc. When he encounters the object of his revulsion, he must Test Toughness or suffer a -10 penalty to all Tests as long as he remains in its presence.",
  },
  {
    id: "wasted-frame",
    roll: "56-60",
    name: "Wasted Frame",
    effect:
      "The character's pallor becomes corpse-like and his muscles waste away. The character's Strength is reduced by 1d10.",
  },
  {
    id: "night-terrors",
    roll: "61-63",
    name: "Night Terrors",
    effect: "The character is plagued by Daemonic visions in his sleep. See Horrific Nightmares for details.",
  },
  {
    id: "poor-health",
    roll: "64-70",
    name: "Poor Health",
    effect:
      "The character constantly suffers petty illnesses and phantom pains, and his wounds never seem to heal fully. The character's Toughness is reduced by 1d10.",
  },
  {
    id: "distrustful",
    roll: "71-75",
    name: "Distrustful",
    effect:
      "The character cannot conceal the distrust and antipathy he has for others. He must take a -10 penalty to Fellowship Tests when dealing with strangers.",
  },
  {
    id: "malign-sight",
    roll: "76-80",
    name: "Malign Sight",
    effect:
      "The world seems to darken, tarnish and rot if the character looks too long at anything. The character's Perception is reduced by 1d10.",
  },
  {
    id: "ashen-taste",
    roll: "81-83",
    name: "Ashen Taste",
    effect:
      "Food and drink hold disgusting tastes and little sustenance for the character, and he can barely stomach eating. The character doubles the negative effects for levels of Fatigue.",
  },
  {
    id: "bloodlust",
    roll: "84-90",
    name: "Bloodlust",
    effect:
      "Murderous rage is never far from the character's mind. After being wounded in combat, he must Test Willpower to incapacitate or allow his enemies to flee, rather than kill them outright, even if his intent is otherwise.",
  },
  {
    id: "blackouts",
    roll: "91-93",
    name: "Blackouts",
    effect:
      "The character suffers from inexplicable blackouts. When they occur and what happens during them is up to the GM.",
  },
  {
    id: "strange-addiction",
    roll: "94-00",
    name: "Strange Addiction",
    effect:
      "The character is addicted to some bizarre and unnatural substance, such as eating rose petals, drinking blood, the taste of widows' tears etc. This acts like a Minor Compulsion but is freakish enough to cause serious suspicion if found out.",
  },
];

export function getCorruptionTrackEntry(points: number): CorruptionTrackEntry {
  const safePoints = Math.max(0, Math.floor(points || 0));
  if (safePoints <= 0) {
    return CORRUPTION_TRACK[0];
  }

  return (
    CORRUPTION_TRACK.find((entry) =>
      entry.max === undefined ? safePoints >= entry.min : safePoints >= entry.min && safePoints <= entry.max
    ) ?? CORRUPTION_TRACK[0]
  );
}

export function getNextCorruptionTrackEntry(points: number): CorruptionTrackEntry | undefined {
  const safePoints = Math.max(0, Math.floor(points || 0));
  return CORRUPTION_TRACK.find((entry) => entry.min > safePoints);
}

export function getCorruptionMalignancyRef(referenceId?: string): CorruptionMalignancyRef | undefined {
  if (!referenceId) return undefined;
  return CORRUPTION_MALIGNANCIES.find((malignancy) => malignancy.id === referenceId);
}
