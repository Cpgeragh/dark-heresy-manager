import { describe, expect, it } from "vitest";
import { CAREER_LIST, findCareerByName } from "../../src/data/reference/careerData";
import {
  getCareerRankProgression,
  getRankXpBand,
  getReachedCareerRanks,
} from "../../src/mechanics/experience/careerRankProgression";

describe("career rank progression", () => {
  it("uses numeric XP bands rather than formatted display strings", () => {
    expect(getRankXpBand(1)).toEqual({ min: 0, max: 499 });
    expect(getRankXpBand(6)).toEqual({ min: 6_000, max: 7_999 });
    expect(getRankXpBand(8)).toEqual({ min: 10_000, max: 14_999 });
  });

  it("matches every Career rank's displayed XP band", () => {
    const format = (value: number) => value.toLocaleString("en-US");
    for (const career of CAREER_LIST) {
      for (const rank of career.ranks) {
        const band = getRankXpBand(rank.tier)!;
        expect(rank.xpLevel, `${career.name}: ${rank.name}`).toBe(
          `${format(band.min)}–${format(band.max)}`
        );
      }
    }
  });

  it("requires the next band's minimum Spent XP", () => {
    expect(getCareerRankProgression("Guardsman", "Conscript", 499)?.canRankUp).toBe(false);
    expect(getCareerRankProgression("Guardsman", "Conscript", 500)?.canRankUp).toBe(true);
  });

  it("offers every valid branch at the point where Guardsman splits", () => {
    const progression = getCareerRankProgression("Guardsman", "Veteran", 6_000);
    expect(progression?.nextRanks.map((rank) => rank.id)).toEqual([
      "assault-veteran",
      "lieutenant",
      "scout",
    ]);
    expect(progression?.requiresBranchChoice).toBe(true);
  });

  it("keeps only the selected branch in reached and future ranks", () => {
    const progression = getCareerRankProgression("Guardsman", "Marksman", 10_000, "Scout");
    expect(progression?.reachedRanks.map((rank) => rank.id)).toEqual([
      "conscript",
      "guard",
      "armsman",
      "sergeant",
      "veteran",
      "scout",
      "marksman",
    ]);
    expect(progression?.nextRanks.map((rank) => rank.id)).toEqual(["sniper"]);
    expect(progression?.requiresBranchChoice).toBe(false);
  });

  it("preserves Adept's chosen path through the shared Scholar rank", () => {
    const career = findCareerByName("Adept")!;
    const scholar = career.ranks.find((rank) => rank.id === "scholar")!;
    expect(getReachedCareerRanks(career, scholar, "Chirurgeon").map((rank) => rank.id)).toEqual([
      "archivist",
      "scrivener",
      "scribe",
      "chirurgeon",
      "scholar",
    ]);
    expect(
      getCareerRankProgression("Adept", "Scholar", 6_000, "Chirurgeon")?.nextRanks.map(
        (rank) => rank.id
      )
    ).toEqual(["comptroller"]);
  });

  it("requires the branch to be recovered when a shared rank has no stored path", () => {
    const progression = getCareerRankProgression("Adept", "Scholar", 6_000);
    expect(progression?.nextRanks.map((rank) => rank.id)).toEqual(["lexographer", "comptroller"]);
    expect(progression?.requiresBranchChoice).toBe(true);
  });

  it("does not offer a rank beyond the Career's final tier", () => {
    const progression = getCareerRankProgression("Guardsman", "Sniper", 20_000, "Scout");
    expect(progression?.nextRanks).toEqual([]);
    expect(progression?.canRankUp).toBe(false);
  });
});
