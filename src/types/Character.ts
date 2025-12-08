export interface Characteristics {
  ws: number;
  bs: number;
  str: number;
  tou: number;
  agi: number;
  int: number;
  per: number;
  wp: number;
  fel: number;

  wsAdvance: number;
  bsAdvance: number;
  strAdvance: number;
  touAdvance: number;
  agiAdvance: number;
  intAdvance: number;
  perAdvance: number;
  wpAdvance: number;
  felAdvance: number;
}

export interface Skill {
  rank: number; // 0–4
}

export interface Weapon {
  id: string;
  name: string;
  class: string;
  damage: string;
  type: string;
  pen: number;
  range: string;
  rof: string;
  clip: number;
  reload: string;
  special: string;
}

export interface ArmourSection {
  head: number;
  body: number;
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
}

export interface PsychicPower {
  id: string;
  name: string;
  threshold: number | null;
  focus: string | null;
  sustained: string | null;
  range: string | null;
  description: string;
}

export interface XP {
  total: number;
  spent: number;
}

export interface CharacterSheet {
  name: string;
  playerName: string | null;
  career: string | null;
  rank: string | null;
  homeWorld: string | null;
  divination: string | null;
  description: string | null;

  characteristics: Characteristics;

  skills: Record<string, Skill>;  // flexible

  wounds: {
    current: number;
    max: number;
  };

  fate: {
    current: number;
    max: number;
  };

  armour: ArmourSection;

  rangedWeapons: Weapon[];
  meleeWeapons: Weapon[];

  talents: string[];
  gear: string[];

  advances: {
    rank1: string[];
    rank2: string[];
    rank3: string[];
    rank4: string[];
    rank5: string[];
    rank6: string[];
    rank7: string[];
    rank8: string[];
    elite: string[];
  };

  psychicPowers: PsychicPower[];

  // System-level fields
  userId: string | null;
  recoveryCode: string;
  isEditableByPlayer: boolean;

  createdAt: any;
}