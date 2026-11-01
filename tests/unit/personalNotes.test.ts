import { describe, expect, it } from "vitest";
import {
  buildPersonalNotesChange,
  keepPersonalNotes,
  type PersonalNotesCollection,
} from "../../src/utils/personalNotes";
import type { Character } from "../../src/types/Character";

const character = {
  id: "char-1",
  skills: [
    { id: "dodge", name: "Dodge", level: "trained", personalNotes: "Old note" },
    { id: "awareness", name: "Awareness", level: "trained" },
  ],
  talentsAndTraits: {
    homeworld: "hive-world",
    talents: [{ uid: "t1", talentId: "ambidextrous", name: "Ambidextrous" }],
    traits: [{ uid: "r1", talentId: "unnatural-strength", name: "Unnatural Strength" }],
    eliteAdvances: [{ uid: "e1", eliteAdvanceId: "iron-jaw", name: "Iron Jaw" }],
  },
  corruption: {
    points: 3,
    malignancies: [{ id: "m1", name: "Malignancy" }],
    minorMutations: [{ id: "n1", name: "Minor" }],
    majorMutations: [{ id: "j1", name: "Major" }],
  },
  insanity: {
    points: 2,
    disorders: [{ id: "d1", type: "Phobia", name: "Fear of Heights", severity: "Minor" }],
    currentTrauma: [{ id: "tr1", name: "Shell Shock" }],
  },
  gear: [{ id: "g1", name: "Auspex" }],
  consumables: [{ id: "c1", name: "Ration Pack", quantity: 2 }],
  drugs: [{ id: "u1", name: "Stimm", quantity: 1 }],
  cybernetics: [{ id: "y1", name: "Mechadendrite" }],
  armour: [{ id: "a1", name: "Flak Vest" }],
  archeotech: [{ id: "x1", name: "Relic" }],
  rangedWeapons: [{ id: "w1", name: "Lasgun" }],
  meleeWeapons: [{ id: "m1", name: "Chainsword" }],
  grenades: [{ id: "g1", name: "Frag", quantity: 1 }],
  shields: [{ id: "s1", name: "Buckler" }],
  companions: [{ id: "k1", referenceId: "ih-cyber-mastiff", name: "Cyber-Mastiff" }],
  psychic: {
    psyRating: 2,
    minorPowers: [{ id: "p1", name: "Smite" }],
    majorPowers: [{ id: "p2", name: "Telepathy" }],
  },
} as unknown as Character;

const cases: [PersonalNotesCollection, string][] = [
  ["skills", "awareness"],
  ["talents", "t1"],
  ["traits", "r1"],
  ["eliteAdvances", "e1"],
  ["mutations", "n1"],
  ["mutations", "j1"],
  ["malignancies", "m1"],
  ["disorders", "d1"],
  ["trauma", "tr1"],
  ["gear", "g1"],
  ["consumables", "c1"],
  ["drugs", "u1"],
  ["cybernetics", "y1"],
  ["armour", "a1"],
  ["archeotech", "x1"],
  ["ranged", "w1"],
  ["melee", "m1"],
  ["grenades", "g1"],
  ["shields", "s1"],
  ["companions", "k1"],
  ["powers", "p1"],
  ["powers", "p2"],
];

function noteOf(value: unknown, id: string): unknown {
  const found = JSON.stringify(value).match(
    new RegExp(`"(?:id|uid)":"${id}"[^}]*?"personalNotes":"([^"]*)"`)
  );
  return found?.[1];
}

describe("buildPersonalNotesChange", () => {
  it.each(cases)("sets the note on a %s entry", (collection, id) => {
    const change = buildPersonalNotesChange(character, collection, id, "  Keep it dry  ");

    expect(change).not.toBeNull();
    expect(noteOf(change!.value, id)).toBe("Keep it dry");
  });

  it("returns the whole field that holds the entry", () => {
    expect(buildPersonalNotesChange(character, "skills", "dodge", "New")?.field).toBe("skills");
    expect(buildPersonalNotesChange(character, "eliteAdvances", "e1", "New")?.field).toBe(
      "talentsAndTraits"
    );
    expect(buildPersonalNotesChange(character, "mutations", "j1", "New")?.field).toBe("corruption");
    expect(buildPersonalNotesChange(character, "trauma", "tr1", "New")?.field).toBe("insanity");
    expect(buildPersonalNotesChange(character, "ranged", "w1", "New")?.field).toBe("rangedWeapons");
    expect(buildPersonalNotesChange(character, "melee", "m1", "New")?.field).toBe("meleeWeapons");
    expect(buildPersonalNotesChange(character, "powers", "p2", "New")?.field).toBe("psychic");
  });

  it("leaves every other entry and every other part of the block as it was", () => {
    const change = buildPersonalNotesChange(character, "traits", "r1", "New");

    expect(change?.field).toBe("talentsAndTraits");
    const value = change!.value as Character["talentsAndTraits"];
    expect(value.homeworld).toBe("hive-world");
    expect(value.talents).toBe(character.talentsAndTraits.talents);
    expect(value.eliteAdvances).toBe(character.talentsAndTraits.eliteAdvances);
  });

  it("changes only the matching skill", () => {
    const change = buildPersonalNotesChange(character, "skills", "awareness", "New");
    const value = change!.value as Character["skills"];

    expect(value[0]).toBe(character.skills[0]);
    expect(value[1].personalNotes).toBe("New");
  });

  it("removes the note when the text is blank", () => {
    const change = buildPersonalNotesChange(character, "skills", "dodge", "   ");
    const value = change!.value as Character["skills"];

    expect("personalNotes" in value[0]).toBe(false);
  });

  it("replaces an earlier note", () => {
    const change = buildPersonalNotesChange(character, "skills", "dodge", "Newer");
    const value = change!.value as Character["skills"];

    expect(value[0].personalNotes).toBe("Newer");
  });

  it("returns null when the entry is not on the character", () => {
    expect(buildPersonalNotesChange(character, "gear", "missing", "Note")).toBeNull();
    expect(buildPersonalNotesChange(character, "mutations", "missing", "Note")).toBeNull();
  });

  it("returns null for the old text form of malignancies and disorders", () => {
    const legacy = {
      ...character,
      corruption: { points: 1, malignancies: "Notes in text" },
      insanity: { points: 1, disorders: "Notes in text" },
    } as unknown as Character;

    expect(buildPersonalNotesChange(legacy, "malignancies", "m1", "Note")).toBeNull();
    expect(buildPersonalNotesChange(legacy, "disorders", "d1", "Note")).toBeNull();
  });

  it("copes with lists the character does not have", () => {
    const bare = { ...character, consumables: undefined, archeotech: undefined } as Character;

    expect(buildPersonalNotesChange(bare, "consumables", "c1", "Note")).toBeNull();
    expect(buildPersonalNotesChange(bare, "archeotech", "x1", "Note")).toBeNull();
  });
});

describe("keepPersonalNotes", () => {
  it("copies the earlier note onto a rebuilt entry", () => {
    expect(keepPersonalNotes({ name: "New" }, { personalNotes: "Mine" })).toEqual({
      name: "New",
      personalNotes: "Mine",
    });
  });

  it("returns the rebuilt entry untouched when there was no note", () => {
    const rebuilt = { name: "New" };

    expect(keepPersonalNotes(rebuilt, {})).toBe(rebuilt);
  });
});
