import { describe, expect, it } from "vitest";
import {
  getCurrentCareerRank,
  makeCurrentRankPurchase,
  makeSourceRankPurchase,
} from "../../src/mechanics/experience/purchaseAttribution";

describe("XP purchase attribution", () => {
  it("resolves stable Career and Rank ids from their display names", () => {
    expect(getCurrentCareerRank("Guardsman", "Conscript")).toEqual({
      careerId: "guardsman",
      rankId: "conscript",
    });
  });

  it("records a real purchase against its Career-table source rank", () => {
    expect(makeSourceRankPurchase("Guardsman", "scout", 100)).toEqual({
      cost: 100,
      careerId: "guardsman",
      sourceRankId: "scout",
    });
  });

  it("records a non-table purchase against the current named rank", () => {
    expect(makeCurrentRankPurchase("Guardsman", "Sergeant", 250)).toEqual({
      cost: 250,
      careerId: "guardsman",
      purchasedAtRankId: "sergeant",
    });
  });
});
