import { describe, expect, it } from "vitest";
import { getAlternateRankTitles, getRankDisplayName } from "shared-rules";

const secutor = {
  alternateRankId: "mechanicus-secutor",
  replacedRankId: "enginseer",
  takenAtTier: 4,
};

const enginseer = { id: "enginseer", tier: 4, name: "Enginseer" };
const techPriest = { id: "tech-priest", tier: 5, name: "Tech-Priest" };
const cyberSeer = { id: "cyber-seer", tier: 7, name: "Cyber-Seer" };
const omniprophet = { id: "omniprophet", tier: 7, name: "Omniprophet" };

describe("getAlternateRankTitles", () => {
  it("lists the titles for a rank", () => {
    expect(getAlternateRankTitles("mechanicus-secutor", 5)).toEqual(["Myrmidon"]);
    expect(getAlternateRankTitles("mechanicus-secutor", 7)).toEqual(["Tribune", "Magnus"]);
    expect(getAlternateRankTitles("templar-calix", 4)).toEqual(["Templar Tertius"]);
  });

  it("returns nothing for a rank without titles or an alternate rank without title data", () => {
    expect(getAlternateRankTitles("mechanicus-secutor", 3)).toEqual([]);
    expect(getAlternateRankTitles("black-priest-of-maccabeus", 4)).toEqual([]);
    expect(getAlternateRankTitles("unknown", 4)).toEqual([]);
  });
});

describe("getRankDisplayName", () => {
  it("uses the alternate title automatically at the rank where the alternate rank is taken", () => {
    expect(getRankDisplayName([secutor], enginseer)).toBe("Secutor");
  });

  it("keeps the normal career name at later ranks until a title is chosen", () => {
    expect(getRankDisplayName([secutor], techPriest)).toBe("Tech-Priest");
  });

  it("uses a chosen alternate title at a later rank", () => {
    const chosen = { ...secutor, titleChoices: { "5": "Myrmidon" } };
    expect(getRankDisplayName([chosen], techPriest)).toBe("Myrmidon");
  });

  it("applies a rank 7 title on either path", () => {
    const chosen = { ...secutor, titleChoices: { "7": "Magnus" } };
    expect(getRankDisplayName([chosen], cyberSeer)).toBe("Magnus");
    expect(getRankDisplayName([chosen], omniprophet)).toBe("Magnus");
  });

  it("ignores a stored title that does not belong to that rank", () => {
    const chosen = { ...secutor, titleChoices: { "5": "Magnus" } };
    expect(getRankDisplayName([chosen], techPriest)).toBe("Tech-Priest");
  });

  it("uses the first title when the alternate rank is taken at a rank with two titles", () => {
    const takenAtSeven = {
      alternateRankId: "mechanicus-secutor",
      replacedRankId: "cyber-seer",
      takenAtTier: 7,
    };
    expect(getRankDisplayName([takenAtSeven], cyberSeer)).toBe("Tribune");
    expect(
      getRankDisplayName([{ ...takenAtSeven, titleChoices: { "7": "Magnus" } }], cyberSeer)
    ).toBe("Magnus");
  });

  it("falls back to the alternate rank name when it has no title data", () => {
    const blackPriest = {
      alternateRankId: "black-priest-of-maccabeus",
      replacedRankId: "preacher",
      takenAtTier: 4,
    };
    expect(getRankDisplayName([blackPriest], { id: "preacher", tier: 4, name: "Preacher" })).toBe(
      "Black Priest of Maccabeus"
    );
  });

  it("does not rename ranks below the rank where the alternate rank was taken", () => {
    const chosen = { ...secutor, titleChoices: { "5": "Myrmidon" } };
    expect(
      getRankDisplayName([chosen], { id: "electro-priest", tier: 3, name: "Electro-Priest" })
    ).toBe("Electro-Priest");
  });
});
