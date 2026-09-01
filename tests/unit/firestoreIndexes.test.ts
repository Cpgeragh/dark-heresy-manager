import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type IndexField = {
  fieldPath: string;
  order?: "ASCENDING" | "DESCENDING";
  arrayConfig?: "CONTAINS";
};

type CompositeIndex = {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: IndexField[];
};

type FieldOverride = {
  collectionGroup: string;
  fieldPath: string;
  indexes: Array<{
    order?: "ASCENDING" | "DESCENDING";
    arrayConfig?: "CONTAINS";
    queryScope: "COLLECTION" | "COLLECTION_GROUP";
  }>;
};

type FirestoreIndexesFile = {
  indexes: CompositeIndex[];
  fieldOverrides: FieldOverride[];
};

const indexes = JSON.parse(
  readFileSync(resolve(process.cwd(), "firestore.indexes.json"), "utf8")
) as FirestoreIndexesFile;

function compositeSignature(index: CompositeIndex): string {
  const fields = index.fields
    .map((field) => `${field.fieldPath}:${field.order ?? field.arrayConfig}`)
    .join("|");
  return `${index.collectionGroup}:${index.queryScope}:${fields}`;
}

describe("reviewed Firestore index configuration", () => {
  it("contains exactly the four composite indexes required by current local queries", () => {
    expect(indexes.indexes.map(compositeSignature).sort()).toEqual(
      [
        "campaigns:COLLECTION:dmId:ASCENDING|archivedAt:ASCENDING",
        "campaigns:COLLECTION:memberIds:CONTAINS|archivedAt:ASCENDING",
        "customItems:COLLECTION:creator.userId:ASCENDING|category:ASCENDING",
        "customItems:COLLECTION:status:ASCENDING|category:ASCENDING",
      ].sort()
    );
  });

  it("keeps the player membership composite index needed by the active Dashboard query", () => {
    expect(indexes.indexes.map(compositeSignature)).toContain(
      "campaigns:COLLECTION:memberIds:CONTAINS|archivedAt:ASCENDING"
    );
  });

  it("enables the userId single-field index for collection-group ownership lookups", () => {
    expect(indexes.fieldOverrides).toEqual([
      {
        collectionGroup: "characters",
        fieldPath: "userId",
        indexes: [
          { order: "ASCENDING", queryScope: "COLLECTION" },
          { order: "ASCENDING", queryScope: "COLLECTION_GROUP" },
        ],
      },
    ]);
  });

  it("does not contain duplicate composite definitions", () => {
    const signatures = indexes.indexes.map(compositeSignature);
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});
