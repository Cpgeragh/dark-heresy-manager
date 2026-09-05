import { describe, expect, it } from "vitest";
import type { CharacterHeader, ExperienceBlock } from "../../src/types/Character";
import {
  applyCareerRankUp,
  applyXpTransaction,
  clearRankUpXpCost,
  setRankUpXpCost,
} from "../../src/mechanics/experience/xpTransactions";

const experience: ExperienceBlock = { total: 700, spent: 500, ranks: [] };

describe("XP transactions", () => {
  it("adds awarded XP to Total without changing Spent", () => {
    expect(
      applyXpTransaction(experience, {
        id: "award-1",
        type: "add",
        amount: 200,
        reason: "  Session award  ",
        rankId: "guard",
      })
    ).toEqual({
      total: 900,
      spent: 500,
      ranks: [],
      transactions: [
        {
          id: "award-1",
          type: "add",
          amount: 200,
          reason: "Session award",
          rankId: "guard",
        },
      ],
    });
  });

  it("adds manual spending to Spent without changing Total", () => {
    expect(
      applyXpTransaction(experience, {
        id: "spend-1",
        type: "spend",
        amount: 150,
        reason: "Elite advance",
        rankId: "guard",
      })
    ).toEqual({
      total: 700,
      spent: 650,
      ranks: [],
      transactions: [
        {
          id: "spend-1",
          type: "spend",
          amount: 150,
          reason: "Elite advance",
          rankId: "guard",
        },
      ],
    });
  });

  it("removes unspent XP from Total without changing Spent", () => {
    expect(
      applyXpTransaction(experience, {
        id: "remove-1",
        type: "remove",
        amount: 150,
        reason: "  Accidental award  ",
        rankId: "guard",
      })
    ).toEqual({
      total: 550,
      spent: 500,
      ranks: [],
      transactions: [
        {
          id: "remove-1",
          type: "remove",
          amount: 150,
          reason: "Accidental award",
          rankId: "guard",
        },
      ],
    });
  });

  it("rejects invalid and unaffordable spending", () => {
    expect(() =>
      applyXpTransaction(experience, {
        id: "spend-1",
        type: "spend",
        amount: 201,
        rankId: "guard",
      })
    ).toThrow("Cannot spend more XP");
    expect(() =>
      applyXpTransaction(experience, {
        id: "spend-2",
        type: "spend",
        amount: 1.5,
        rankId: "guard",
      })
    ).toThrow("positive whole number");
  });

  it("does not remove XP that has already been spent", () => {
    expect(() =>
      applyXpTransaction(experience, {
        id: "remove-1",
        type: "remove",
        amount: 201,
        rankId: "guard",
      })
    ).toThrow("Cannot remove XP that has already been spent");
  });

  it("replaces the existing Rank Up XP cost instead of adding a second cost", () => {
    const withCost = setRankUpXpCost(experience, {
      id: "cost-1",
      amount: 100,
      reason: "First cost",
      rankId: "guard",
    });
    expect(
      setRankUpXpCost(withCost, {
        id: "cost-2",
        amount: 150,
        reason: "Changed cost",
        rankId: "guard",
      })
    ).toEqual({
      total: 700,
      spent: 650,
      ranks: [],
      transactions: [
        {
          id: "cost-1",
          type: "spend",
          amount: 150,
          reason: "Changed cost",
          rankId: "guard",
        },
      ],
    });
  });

  it("clears an unconfirmed Rank Up XP cost from the still-current rank", () => {
    const withCost = setRankUpXpCost(experience, {
      id: "cost-1",
      amount: 100,
      reason: "Draft cost",
      rankId: "guard",
    });
    expect(clearRankUpXpCost(withCost, "guard")).toEqual(experience);
  });
});

describe("Career rank-up", () => {
  const guardsman: CharacterHeader = {
    characterName: "Vex",
    career: "Guardsman",
    rank: "Veteran",
  };

  it("advances exactly one valid rank and stores the chosen branch", () => {
    expect(applyCareerRankUp(guardsman, 6_000, "scout")).toEqual({
      ...guardsman,
      rank: "Scout",
      careerPath: "Scout",
    });
  });

  it("rejects an invalid branch and insufficient Spent XP", () => {
    expect(() => applyCareerRankUp(guardsman, 6_000, "captain")).toThrow("not a valid next step");
    expect(() => applyCareerRankUp(guardsman, 5_999, "scout")).toThrow("not spent enough XP");
  });

  it("preserves an Adept branch through the shared Scholar rank", () => {
    const adept: CharacterHeader = {
      characterName: "Lex",
      career: "Adept",
      rank: "Inditor",
      careerPath: "Inditor",
    };
    expect(applyCareerRankUp(adept, 3_000, "scholar")).toEqual({
      ...adept,
      rank: "Scholar",
    });
  });
});
