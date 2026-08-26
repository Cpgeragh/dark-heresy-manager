// tests/unit/customItemService.test.ts

import { describe, expect, it } from "vitest";
import { createDraftCustomItem } from "../../src/services/customItemService";

describe("custom item write validation", () => {
  it("rejects invalid nested data before constructing a Firestore write", async () => {
    await expect(
      createDraftCustomItem({
        campaignId: "campaign-1",
        category: "gear",
        creator: { userId: "user-1", characterId: "character-1" },
        data: { name: "Auspex", unexpected: true } as never,
      })
    ).rejects.toThrow("unsupported field: unexpected");
  });
});
