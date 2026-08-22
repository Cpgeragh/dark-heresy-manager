import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SKILLS } from "../../src/data/defaultSkills";
import { TALENT_LIST } from "../../src/data/talentData";
import {
  getAvailablePsychicTalentPurchases,
  getAvailableTalentChoices,
  getPsyRatingAcquisitionGrants,
  getTalentBehaviour,
  hasTalentChoice,
  isTalentAvailableInPicker,
  linkPowerToTalentPurchase,
  makeTalentEntry,
} from "../../src/pages/characterSheet/talentUtils";
import type {
  PsychicBlock,
  TalentEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";

vi.stubGlobal("crypto", { randomUUID: () => "generated-uid" });

function talent(id: string) {
  const found = TALENT_LIST.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing Talent ${id}`);
  return found;
}

function purchase(uid: string, talentId: string, specialisation?: string): TalentEntry {
  const reference = talent(talentId);
  return {
    uid,
    talentId,
    name: specialisation ? `${reference.name} (${specialisation})` : reference.name,
    ...(specialisation ? { specialisation } : {}),
  };
}

const emptyPsychic: PsychicBlock = {
  psyRating: 0,
  minorPowers: [],
  majorPowers: [],
};

function block(entries: TalentEntry[]): TalentsAndTraitsBlock {
  return { homeworld: "", talents: entries, traits: [] };
}

describe("Talent behaviour metadata", () => {
  it("marks every Weapon Training Talent as managed elsewhere", () => {
    for (const id of [
      "basic-weapon-training",
      "heavy-weapon-training",
      "melee-weapon-training",
      "pistol-training",
      "thrown-weapon-training",
      "exotic-weapon-training",
    ]) {
      expect(getTalentBehaviour(talent(id))).toEqual({ kind: "managed-elsewhere" });
      expect(isTalentAvailableInPicker(talent(id), [])).toBe(false);
    }
  });

  it.each([
    ["peer", ["Academics", "Adeptus Arbites", "Adeptus Mechanicus", "Administratum", "Astropaths", "Ecclesiarchy", "Feral Worlders", "Government", "Hivers", "Imperial Navy", "Inquisition", "Middle Classes", "Military", "Nobility", "The Insane", "Underworld", "Void Born", "Workers"]],
    ["good-reputation", ["Administratum", "Ecclesiarchy", "Imperial Guard", "Imperial Navy", "Inquisition", "Underworld"]],
    ["heightened-senses", ["Sight", "Sound", "Smell", "Taste", "Touch"]],
    ["mechadendrite-use", ["Gun", "Manipulator", "Medicae", "Optical", "Utility"]],
    ["resistance", ["Cold", "Fear", "Heat", "Poisons", "Psychic Powers", "Insanity"]],
    ["two-weapon-wielder", ["Melee", "Ballistic"]],
    ["discipline-focus", ["Biomancy", "Divination", "Pyromancy", "Telekinetics", "Telepathy"]],
    ["psychic-supremacy", ["Biomancy", "Divination", "Pyromancy", "Telekinetics", "Telepathy"]],
    ["cult-briefing", ["Political", "Heretek", "Pleasure", "Infestation", "Blood", "Culture"]],
    ["sicarius-tutoring", ["Adept", "Arbitrator", "Assassin", "Battle Sister", "Cleric", "Guardsman", "Imperial Psyker", "Scum", "Tech-Priest"]],
  ])("contains the exact approved choices for %s", (id, expected) => {
    const behaviour = getTalentBehaviour(talent(id as string));
    expect("options" in behaviour ? behaviour.options : []).toEqual(expected);
  });

  it("derives Talented choices from the current Skills reference list", () => {
    const behaviour = getTalentBehaviour(talent("talented"));
    expect("options" in behaviour ? behaviour.options : []).toEqual(
      DEFAULT_SKILLS.map((skill) => skill.name)
    );
  });

  it("defines the approved Hatred fixed and specific paths", () => {
    const behaviour = getTalentBehaviour(talent("hatred"));
    expect(behaviour.kind).toBe("hybrid");
    if (behaviour.kind !== "hybrid") return;
    expect(behaviour.options.map((option) => option.label)).toEqual([
      "Criminals",
      "Cult (specific)",
      "Daemons",
      "Xeno (specific)",
      "Psykers",
      "Heretics",
      "Mutants",
    ]);
  });
});

describe("Talent purchase calculations", () => {
  it("keeps unlimited ranked Talents available and caps The Flesh is Weak at four", () => {
    const sound = talent("sound-constitution");
    const powerWell = talent("power-well");
    const flesh = talent("the-flesh-is-weak");
    expect(isTalentAvailableInPicker(sound, Array.from({ length: 12 }, (_, i) => purchase(`s${i}`, sound.id)))).toBe(true);
    expect(getTalentBehaviour(powerWell)).toEqual({ kind: "ranked" });
    expect(isTalentAvailableInPicker(powerWell, Array.from({ length: 12 }, (_, i) => purchase(`pw${i}`, powerWell.id)))).toBe(true);
    const fleshEntries = Array.from({ length: 4 }, (_, i) => purchase(`f${i}`, flesh.id));
    expect(isTalentAvailableInPicker(flesh, fleshEntries.slice(0, 3))).toBe(true);
    expect(isTalentAvailableInPicker(flesh, fleshEntries)).toBe(false);
  });

  it("removes owned choices case-insensitively and hides exhausted finite Talents", () => {
    const resistance = talent("resistance");
    const entries = [purchase("r1", resistance.id, "fear")];
    expect(hasTalentChoice(entries, "Fear")).toBe(true);
    expect(getAvailableTalentChoices(resistance, entries)).not.toContain("Fear");
    const all = ["Cold", "Fear", "Heat", "Poisons", "Psychic Powers", "Insanity"].map((choice, index) =>
      purchase(`r${index}`, resistance.id, choice)
    );
    expect(isTalentAvailableInPicker(resistance, all)).toBe(false);
  });

  it("removes every remaining option after a fixed-single Talent is purchased", () => {
    const cultBriefing = talent("cult-briefing");
    expect(getAvailableTalentChoices(cultBriefing, [])).toContain("Blood");
    expect(getAvailableTalentChoices(cultBriefing, [purchase("cb1", cultBriefing.id, "Blood")])).toEqual([]);
  });

  it("trims and formats a purchase without changing the one-entry-per-purchase model", () => {
    expect(makeTalentEntry(talent("reformed-skin"), "  Left arm  ")).toEqual({
      uid: "generated-uid",
      talentId: "reformed-skin",
      name: "Reformed Skin (Left arm)",
      specialisation: "Left arm",
    });
  });
});

describe("Psychic Talent purchase links", () => {
  it("calculates availability from unreferenced purchase UIDs", () => {
    const entries = [
      purchase("minor-1", "minor-psychic-power"),
      purchase("minor-2", "minor-psychic-power"),
    ];
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      minorPowers: [{ id: "p1", name: "Power", known: true, talentEntryUid: "minor-1" }],
    };
    expect(getAvailablePsychicTalentPurchases(block(entries), psychic, "minor").map((entry) => entry.uid)).toEqual(["minor-2"]);
    const afterRemoval = { ...psychic, minorPowers: [] };
    expect(getAvailablePsychicTalentPurchases(block(entries), afterRemoval, "minor")).toHaveLength(2);
  });

  it("links only a matching, unused purchase to one unlinked power", () => {
    const talents = block([
      purchase("minor-1", "minor-psychic-power"),
      purchase("major-1", "psychic-power"),
    ]);
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      minorPowers: [
        { id: "p1", name: "One", known: true },
        { id: "p2", name: "Two", known: true },
      ],
    };
    const linked = linkPowerToTalentPurchase(psychic, talents, "p1", "minor-1");
    expect(linked.minorPowers[0].talentEntryUid).toBe("minor-1");
    expect(linkPowerToTalentPurchase(linked, talents, "p2", "minor-1")).toBe(linked);
    expect(linkPowerToTalentPurchase(psychic, talents, "p1", "major-1")).toBe(psychic);
  });
});

describe("Psy Rating acquisition grants", () => {
  it("matches the exact Psy Rating 3–6 grant table", () => {
    expect(getPsyRatingAcquisitionGrants(3, 5, "new")).toEqual({
      minor: 3,
      major: 1,
      newDiscipline: true,
    });
    expect(getPsyRatingAcquisitionGrants(4, 5, "known")).toEqual({
      minor: 3,
      major: 3,
      newDiscipline: false,
    });
    expect(getPsyRatingAcquisitionGrants(4, 5, "new")).toEqual({
      minor: 0,
      major: 1,
      newDiscipline: true,
    });
    expect(getPsyRatingAcquisitionGrants(5, 5, "known")).toEqual({
      minor: 0,
      major: 3,
      newDiscipline: false,
    });
    expect(getPsyRatingAcquisitionGrants(5, 5, "new")).toEqual({
      minor: 0,
      major: 1,
      newDiscipline: true,
    });
    expect(getPsyRatingAcquisitionGrants(6, 5, "known")).toEqual({
      minor: 3,
      major: 3,
      newDiscipline: false,
    });
    expect(getPsyRatingAcquisitionGrants(6, 5, "new")).toEqual({
      minor: 0,
      major: 1,
      newDiscipline: true,
    });
  });
});
