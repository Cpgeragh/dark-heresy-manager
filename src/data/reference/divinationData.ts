import { SkillSource } from "../../types/SkillSource";

export interface DivinationData {
  id: string;
  roll: string;
  result: string;
  effect: string;
  source: SkillSource;
}

export const DIVINATION_LIST: readonly DivinationData[] = [
  {
    id: "01",
    roll: "01",
    result: "Mutation without, corruption within.",
    effect: "Begin play with one Minor Mutation (see page 334).",
    source: SkillSource.CR,
  },
  {
    id: "02-03",
    roll: "02–03",
    result:
      "Only the insane have strength enough to prosper. Only those who prosper may judge what is sane.",
    effect: "Begin play with 2 Insanity Points.",
    source: SkillSource.CR,
  },
  {
    id: "04-07",
    roll: "04–07",
    result: "Sins hidden in the heart turn all to decay.",
    effect: "Begin play with 3 Corruption Points.",
    source: SkillSource.CR,
  },
  {
    id: "08",
    roll: "08",
    result: "Innocence is an illusion.",
    effect: "Begin play with 1 Insanity Point and 1 Corruption Point.",
    source: SkillSource.CR,
  },
  {
    id: "09-11",
    roll: "09–11",
    result: "Dark dreams lie upon the heart.",
    effect: "Begin play with 2 Corruption Points.",
    source: SkillSource.CR,
  },
  {
    id: "12-15",
    roll: "12–15",
    result: "The pain of the bullet is ecstasy compared to damnation.",
    effect: "Increase Toughness by +1.",
    source: SkillSource.CR,
  },
  {
    id: "16-18",
    roll: "16–18",
    result: "Kill the alien before it can speak its lies.",
    effect: "Increase Agility by +2.",
    source: SkillSource.CR,
  },
  {
    id: "19-21",
    roll: "19–21",
    result: "Truth is subjective.",
    effect: "Increase Intelligence by +3. Begin play with 3 Corruption Points.",
    source: SkillSource.CR,
  },
  {
    id: "22-26",
    roll: "22–26",
    result: "Know the mutant; kill the mutant.",
    effect: "Increase Perception by +2.",
    source: SkillSource.CR,
  },
  {
    id: "27-30",
    roll: "27–30",
    result: "Even a man who has nothing can still offer his life.",
    effect: "Increase Strength by +2.",
    source: SkillSource.CR,
  },
  {
    id: "31-33",
    roll: "31–33",
    result: "If a job is worth doing it is worth dying for.",
    effect: "Gain the Frenzy talent.",
    source: SkillSource.CR,
  },
  {
    id: "34-38",
    roll: "34–38",
    result: "Only in death does duty end.",
    effect: "Gain 1 Wound.",
    source: SkillSource.CR,
  },
  {
    id: "39-42",
    roll: "39–42",
    result: "A mind without purpose will wander in dark places.",
    effect: "Gain 1 Fate Point.",
    source: SkillSource.CR,
  },
  {
    id: "43-46",
    roll: "43–46",
    result: "There are no civilians in the battle for survival.",
    effect: "Increase Toughness by +2 and gain 1 Wound.",
    source: SkillSource.CR,
  },
  {
    id: "47-50",
    roll: "47–50",
    result: "Violence solves everything.",
    effect: "Increase Weapon Skill by +3.",
    source: SkillSource.CR,
  },
  {
    id: "51-54",
    roll: "51–54",
    result: "To war is human.",
    effect: "Increase Agility by +3.",
    source: SkillSource.CR,
  },
  {
    id: "55-58",
    roll: "55–58",
    result: "Die if you must, but not with your spirit broken.",
    effect: "Increase Willpower by +3.",
    source: SkillSource.CR,
  },
  {
    id: "59-62",
    roll: "59–62",
    result: "The gun is mightier than the sword.",
    effect: "Increase Ballistic Skill by +3.",
    source: SkillSource.CR,
  },
  {
    id: "63-66",
    roll: "63–66",
    result: "Be a boon to your brothers and bane to your enemies.",
    effect: "Increase Fellowship by +3.",
    source: SkillSource.CR,
  },
  {
    id: "67-70",
    roll: "67–70",
    result: "Men must die so that Man endures.",
    effect: "Increase Toughness by +3.",
    source: SkillSource.CR,
  },
  {
    id: "71-74",
    roll: "71–74",
    result: "In the darkness, follow the light of Terra.",
    effect: "Increase Willpower by +3.",
    source: SkillSource.CR,
  },
  {
    id: "75-79",
    roll: "75–79",
    result: "The only true fear is of dying with your duty not done.",
    effect: "Gain 2 Wounds.",
    source: SkillSource.CR,
  },
  {
    id: "80-85",
    roll: "80–85",
    result: "Thought begets Heresy; Heresy begets Retribution.",
    effect: "Increase Strength by +3.",
    source: SkillSource.CR,
  },
  {
    id: "86-90",
    roll: "86–90",
    result: "The wise man learns from the deaths of others.",
    effect: "Increase Intelligence by +3.",
    source: SkillSource.CR,
  },
  {
    id: "91-94",
    roll: "91–94",
    result: "A suspicious mind is a healthy mind.",
    effect: "Increase Perception by +3.",
    source: SkillSource.CR,
  },
  {
    id: "95-97",
    roll: "95–97",
    result: "Trust in your fear.",
    effect: "Increase Agility by +2 and gain 1 Fate Point.",
    source: SkillSource.CR,
  },
  {
    id: "98-99",
    roll: "98–99",
    result: "There is no substitute for zeal.",
    effect: "Increase Toughness and Willpower each by +2.",
    source: SkillSource.CR,
  },
  {
    id: "00",
    roll: "00",
    result: "Do not ask why you serve. Only ask how.",
    effect: "Increase Weapon Skill and Ballistic Skill each by +2.",
    source: SkillSource.CR,
  },
] as const;

function normalizeResult(value: string): string {
  return value
    .trim()
    .replace(/^[“”"]+|[“”"]+$/g, "")
    .toLowerCase();
}

export function findDivinationByResult(result?: string): DivinationData | undefined {
  if (!result) return undefined;
  const normalized = normalizeResult(result);
  return DIVINATION_LIST.find((entry) => normalizeResult(entry.result) === normalized);
}
