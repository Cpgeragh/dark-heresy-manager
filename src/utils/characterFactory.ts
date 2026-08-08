// src/utils/characterFactory.ts

import type { Character, CharField } from "../types/Character";
import { DEFAULT_SKILLS } from "../data/defaultSkills";

function char(base = 0, advances = 0): CharField {
  return { base, advances };
}

/**
 * Create an empty character payload suitable for Firestore,
 * matching the full 5-page Dark Heresy sheet structure.
 *
 * NOTE: This returns Omit<Character, "id"> because Firestore
 * typically generates the id when you call addDoc().
 */
export function createEmptyCharacterData(params: {
  campaignId: string;
  recoveryCode: string;
  userId?: string | null;
  characterName?: string;
  playerName?: string;
}): Omit<Character, "id"> {
  const {
    campaignId,
    recoveryCode,
    userId = null,
    characterName = "New Acolyte",
    playerName = "",
  } = params;

  return {
    campaignId,
    userId,
    recoveryCode,
    isEditableByPlayer: false,

    header: {
      characterName,
      playerName,
      career: "",
      rank: "",
      homeWorld: "",
      divination: "",
      description: "",
    },

    characteristics: {
      ws: char(),
      bs: char(),
      s: char(),
      t: char(),
      ag: char(),
      int: char(),
      per: char(),
      wp: char(),
      fel: char(),
    },

    skills: DEFAULT_SKILLS,

    wounds: {
      total: 0,
      current: 0,
      criticalDamage: 0,
      fatigue: 0,
    },

    fate: {
      total: 0,
      current: 0,
    },

    insanity: {
      points: 0,
      disorders: [],
      currentTrauma: [],
    },

    corruption: {
      points: 0,
      malignancies: [],
    },

    movement: {
      half: 0,
      full: 0,
      charge: 0,
      run: 0,
    },

    rangedWeapons: [],
    meleeWeapons: [],

    armour: [],

    talentsAndTraits: {
      homeworld: "feral-world",
      homeworldNotes: "",
      talents: [],
      traits: [],
    },

    gear: [],
    companions: [],

    weaponTraining: {
      trained: [],
      exoticWeapons: [],
    },

    experience: {
      ranks: [],
      total: 0,
      spent: 0,
    },

    psychic: {
      psyRating: 0,
      disciplines: [],
      minorPowers: [],
      majorPowers: [],
    },

    notes: "",
  };
}
