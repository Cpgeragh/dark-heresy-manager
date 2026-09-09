// tests/unit/customItemService.test.ts

import { serverTimestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
  buildDraftCustomItemDocuments,
  createDraftCustomItem,
} from "../../src/services/customItemService";

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

  it("builds exact rule-compatible draft payloads without corrupting timestamp sentinels", () => {
    const timestamp = serverTimestamp();
    const creator = {
      userId: "user-1",
      characterId: "character-1",
      characterName: "Acolyte",
    };
    const { item, version } = buildDraftCustomItemDocuments({
      campaignId: "campaign-1",
      customItemId: "gear-1",
      versionId: "version-1",
      category: "gear",
      creator,
      data: {
        name: "  Auspex  ",
        description: "Scans the surrounding area.",
        weight: "1 kg",
        value: "50 Thrones",
        availability: "Rare",
        source: "Custom",
      },
      timestamp,
    });

    expect(Object.keys(item).sort()).toEqual(
      [
        "archivedAt",
        "archivedByUserId",
        "campaignId",
        "category",
        "createdAt",
        "createdBy",
        "creator",
        "data",
        "draftVersionId",
        "id",
        "latestVersionId",
        "latestVersionNumber",
        "name",
        "publishedVersionId",
        "status",
        "updatedAt",
        "updatedBy",
      ].sort()
    );
    expect(Object.keys(version).sort()).toEqual(
      [
        "campaignId",
        "category",
        "createdAt",
        "createdBy",
        "customItemId",
        "data",
        "id",
        "publishedAt",
        "publishedByUserId",
        "status",
        "updatedAt",
        "updatedBy",
        "versionNumber",
      ].sort()
    );
    expect(item.name).toBe("Auspex");
    expect(item.createdAt).toBe(timestamp);
    expect(item.updatedAt).toBe(timestamp);
    expect(version.createdAt).toBe(timestamp);
    expect(version.updatedAt).toBe(timestamp);
  });
});
