import type { CharacteristicModifier } from "./characteristicModifiers";

export interface MutationRef {
  id: string;
  roll: string;
  name: string;
  effect: string;
  modifiers?: CharacteristicModifier[];
}

export const MUTATIONS_RULE_TEXT = {
  gaining:
    "Characters, creatures and so on, acquire mutations in a variety of ways, but the most common cause is through physical corruption. Warped environments, chemicals, illegal drugs and so on, can all result in mutation and there are few safeguards to prevent a mutation once it takes root. Mutations function as Traits, meaning that characters cannot purchase them with Experience Points.",
  rolling:
    "Whenever a mutation occurs, roll either for a Minor Mutation on Table 12-3: Minor Mutations, or Major Mutations on Table 12-4: Major Mutations to discover what type of mutation is gained. Always re-roll duplicate results.",
};

export const MINOR_MUTATIONS: MutationRef[] = [
  {
    id: "grotesque",
    roll: "01-20",
    name: "Grotesque",
    effect:
      "The mutant is either badly deformed, scarred or bestial, marking it as accursed and impure, Fellowship Tests with 'normals' are made at -20, but the mutant has a +10 bonus to Intimidate Tests.",
  },
  {
    id: "tough-hide",
    roll: "21-30",
    name: "Tough Hide",
    effect: "The mutant has 1 AP worth of Natural Armour thanks to dense skin and scar tissue.",
  },
  {
    id: "misshapen",
    roll: "31-40",
    name: "Misshapen",
    effect:
      "The mutant's spine and/or limbs are horribly twisted, giving it a penalty of -1d10 to its Agility.",
    modifiers: [{ characteristic: "ag", kind: "roll1d10", sign: -1 }],
  },
  {
    id: "feels-no-pain",
    roll: "41-50",
    name: "Feels No Pain",
    effect: "The mutant cares little for injury or harm and gains +1 Wound.",
  },
  {
    id: "brute",
    roll: "51-60",
    name: "Brute",
    effect:
      "The mutant is physically powerful with deformed masses of muscle. Apply +10 Strength, +10 Toughness and -10 Agility.",
    modifiers: [
      { characteristic: "s", kind: "flat", sign: 1, value: 10 },
      { characteristic: "t", kind: "flat", sign: 1, value: 10 },
      { characteristic: "ag", kind: "flat", sign: -1, value: 10 },
    ],
  },
  {
    id: "nightsider",
    roll: "61-70",
    name: "Nightsider",
    effect:
      "The mutant gains the Dark Sight trait, but suffers a -10 penalty to all Actions in bright light or daylight conditions unless its eyes are shielded.",
  },
  {
    id: "big-eyes",
    roll: "71-80",
    name: "Big Eyes",
    effect:
      "The mutant's eyes are virtually lidless and watery. Apply +10 Perception and -10 Fellowship.",
    modifiers: [
      { characteristic: "per", kind: "flat", sign: 1, value: 10 },
      { characteristic: "fel", kind: "flat", sign: -1, value: 10 },
    ],
  },
  {
    id: "malformed-hands",
    roll: "81-85",
    name: "Malformed Hands",
    effect:
      "Apply -10 to WS and BS and the mutant suffers a -20 penalty to all tasks involving fine physical manipulation.",
    modifiers: [
      { characteristic: "ws", kind: "flat", sign: -1, value: 10 },
      { characteristic: "bs", kind: "flat", sign: -1, value: 10 },
    ],
  },
  {
    id: "tox-blood",
    roll: "86-89",
    name: "Tox Blood",
    effect:
      "The mutant's system is saturated with toxic pollutants and poisonous chemicals. As a result it has a +10 resistance to toxins and poisons, however it suffers a -1d10 penalty to its Intelligence and Fellowship.",
    modifiers: [
      { characteristic: "int", kind: "roll1d10", sign: -1 },
      { characteristic: "fel", kind: "roll1d10", sign: -1 },
    ],
  },
  {
    id: "wyrdling",
    roll: "90-99",
    name: "Wyrdling",
    effect:
      "The mutant has Minor Psychic Powers that it has so far been able to conceal. The mutant has a Psy Rating of 1. See Chapter VI: Psychic Powers.",
  },
  {
    id: "roll-major",
    roll: "100",
    name: "Roll on Major Mutations",
    effect: "Roll on Table 12-4: Major Mutations.",
  },
];

export const MAJOR_MUTATIONS: MutationRef[] = [
  {
    id: "vile-deformity",
    roll: "01-25",
    name: "Vile Deformity",
    effect:
      "The mutant is marked by some terrible deformity that shows the touch of the warp and should not exist in a rational universe. There is no end to the dire forms this might take such as writhing tentacles in place of arms, skinless glistening flesh, re-arranged facial features or thousands of restless eyes studding the body, to name but a few. The mutant gains the Disturbing trait.",
  },
  {
    id: "aberration",
    roll: "26-35",
    name: "Aberration",
    effect:
      "The mutant has become a weird hybrid of man and animal (or reptile, insect, etc.) Apply +10 Strength, +10 Agility, -1d10 Intelligence, -10 Fellowship and the Sprint talent.",
    modifiers: [
      { characteristic: "s", kind: "flat", sign: 1, value: 10 },
      { characteristic: "ag", kind: "flat", sign: 1, value: 10 },
      { characteristic: "int", kind: "roll1d10", sign: -1 },
      { characteristic: "fel", kind: "flat", sign: -1, value: 10 },
    ],
  },
  {
    id: "degenerate-mind",
    roll: "36-40",
    name: "Degenerate Mind",
    effect:
      "The mutant's mind is warped and inhuman. Apply -1d10 Intelligence, +10 Fellowship, roll 1d10 and apply the following Talents or Trait: 1-3: Frenzy, 4-7: Fearless, 8-0: From Beyond.",
    modifiers: [
      { characteristic: "int", kind: "roll1d10", sign: -1 },
      { characteristic: "fel", kind: "flat", sign: 1, value: 10 },
    ],
  },
  {
    id: "ravaged-body",
    roll: "41-50",
    name: "Ravaged Body",
    effect:
      "The mutant's body has been entirely re-made by the warp. Roll 1d5 times on Table 12-3: Minor Mutations, re-rolling duplicate rolls. Such mutations, regardless of their nature, still show the obvious taint of Chaos.",
  },
  {
    id: "clawed-fanged",
    roll: "51-60",
    name: "Clawed/Fanged",
    effect:
      "The mutant gains razor claws, a fanged maw, barbed flesh or some other form of Natural Weapon that inflicts 1d10 R or I Primitive damage in close combat.",
  },
  {
    id: "necrophage",
    roll: "61-65",
    name: "Necrophage",
    effect:
      "The mutant gains +10 Toughness and the Regeneration trait, but must sustain itself on copious quantities of raw meat or starve.",
    modifiers: [{ characteristic: "t", kind: "flat", sign: 1, value: 10 }],
  },
  {
    id: "corrupted-flesh",
    roll: "66-70",
    name: "Corrupted Flesh",
    effect:
      "Beneath the mutant's skin a blasphemous transformation has taken place, exchanging living organs for writhing creatures and blood for ichorous, maggot-ridden filth. If the mutant suffers Critical Damage, those witnessing it must take a Fear Test at -10.",
  },
  {
    id: "vile-alacrity",
    roll: "71-75",
    name: "Vile Alacrity",
    effect:
      "The mutant is constantly juddering and shaking unnaturally and can move almost faster than sight. It gains the Unnatural Agility (x2) trait and the Sprint talent, with a penalty of -10 to Weapon Skill and Ballistic Skill.",
    modifiers: [
      { characteristic: "ws", kind: "flat", sign: -1, value: 10 },
      { characteristic: "bs", kind: "flat", sign: -1, value: 10 },
    ],
  },
  {
    id: "hideous-strength",
    roll: "76-80",
    name: "Hideous Strength",
    effect: "The mutant gains the Unnatural Strength (x2) trait.",
  },
  {
    id: "multiple-appendages",
    roll: "81-85",
    name: "Multiple Appendages",
    effect:
      "The mutant has sprouted additional functioning limbs in the shape of arms, tentacles or a prehensile tail, or tails. Gain the Ambidextrous and Two-Weapon Wielder talents and +10 bonus on Climb Tests and Grapple attacks.",
  },
  {
    id: "worm",
    roll: "86-90",
    name: "Worm",
    effect:
      "The mutant's lower limbs have fused together to form a worm or snake-like tail. They gain the Crawler trait, +5 Wounds and the Disturbing trait.",
  },
  {
    id: "nightmarish",
    roll: "91-92",
    name: "Nightmarish",
    effect:
      "So warped and horrific is the mutant's appearance, it can cause enemies to flee in fear. It gains the Frightening trait.",
  },
  {
    id: "malleable",
    roll: "93-94",
    name: "Malleable",
    effect:
      "The mutant possesses a sickeningly liquid flexibility and is able to distend and flatten its body. Apply +10 Agility and +20 to Climb Tests, and Grappling attacks. They may also fit through spaces only one-quarter its usual body dimensions.",
    modifiers: [{ characteristic: "ag", kind: "flat", sign: 1, value: 10 }],
  },
  {
    id: "winged",
    roll: "95-96",
    name: "Winged",
    effect:
      "The mutant's body has warped to accommodate a pair of leathery wings or the like. They gain the Flyer trait (1d10+5).",
  },
  {
    id: "corpulent",
    roll: "97-98",
    name: "Corpulent",
    effect:
      "The mutant's huge and bloated frame gives them +5 Wounds and the Unnatural Toughness (x2) trait. This mutation means that the mutant may not run.",
  },
  {
    id: "corrosive-bile",
    roll: "99",
    name: "Corrosive Bile",
    effect:
      "The mutant may vomit burning bile, flesh-eating grubs or some other horrific substance instead of attacking normally in close combat. The attack uses the mutant's BS, is a Full Action and can be Dodged but not Parried. This attack inflicts 1d10+5 R (or E) Tearing Damage.",
  },
  {
    id: "hellspawn",
    roll: "00",
    name: "Hellspawn",
    effect:
      "Saturated with the energies of the warp, the mutant is imbued with Daemonic energies and gains the From Beyond, Frightening and Daemonic traits and a Psy Rating of 2.",
  },
];

export function getMutationRef(referenceId?: string): MutationRef | undefined {
  if (!referenceId) return undefined;
  return (
    MINOR_MUTATIONS.find((mutation) => mutation.id === referenceId) ??
    MAJOR_MUTATIONS.find((mutation) => mutation.id === referenceId)
  );
}
