// src/utils/defaultCharacter.ts

export interface CharField {
  base: number;
  advances: number; // 0–4
}

export interface DefaultCharacter {
  name: string;
  userId: string | null;
  recoveryCode: string;
  isEditableByPlayer: boolean;

  characteristics: {
    ws: CharField;
    bs: CharField;
    s: CharField;
    t: CharField;
    ag: CharField;
    int: CharField;
    per: CharField;
    wp: CharField;
    fel: CharField;
  };

  // You can expand this later with skills, talents, etc.
  notes: string;

  createdAt: Date;
}

function makeCharField(): CharField {
  return { base: 0, advances: 0 };
}

export function createDefaultCharacter(
  name: string,
  recoveryCode: string,
  userId: string | null
): DefaultCharacter {
  return {
    name,
    userId,
    recoveryCode,
    isEditableByPlayer: false,

    characteristics: {
      ws: makeCharField(),
      bs: makeCharField(),
      s: makeCharField(),
      t: makeCharField(),
      ag: makeCharField(),
      int: makeCharField(),
      per: makeCharField(),
      wp: makeCharField(),
      fel: makeCharField(),
    },

    notes: "",

    createdAt: new Date(),
  };
}