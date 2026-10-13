// tests/unit/chatTarget.test.ts
import { describe, it, expect } from "vitest";
import { getChatId } from "../../src/components/chat/chatTarget";

describe("getChatId", () => {
  it("builds the shared chat id from the campaign, character and player account", () => {
    expect(
      getChatId({ campaignId: "c1", characterId: "char-1", playerAccountId: "player-1" })
    ).toBe("c1__char-1__player-1");
  });

  it("returns null when nobody has claimed the character", () => {
    expect(
      getChatId({ campaignId: "c1", characterId: "char-1", playerAccountId: null })
    ).toBeNull();
  });
});
