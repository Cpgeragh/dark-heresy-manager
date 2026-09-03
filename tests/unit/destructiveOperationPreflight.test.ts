import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDocs } = vi.hoisted(() => ({ mockGetDocs: vi.fn() }));

vi.mock("firebase/firestore", () => ({
  documentId: () => "__name__",
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => ({ type: "limit", value }),
  orderBy: (...args: unknown[]) => ({ type: "orderBy", args }),
  query: (source: unknown) => source,
  startAfter: (...args: unknown[]) => ({ type: "startAfter", args }),
}));

import {
  assertSafeDestructivePreflight,
  BoundedDeletionCollector,
} from "../../src/firestore/destructiveOperationPreflight";

function documents(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `doc-${index}`,
    ref: `ref-${index}`,
    data: () => ({}),
  }));
}

beforeEach(() => vi.clearAllMocks());

describe("BoundedDeletionCollector", () => {
  it("collects an exact safe count and preserves category totals", () => {
    const collector = new BoundedDeletionCollector(3);
    collector.addReference("one" as never, "messages");
    collector.addReference("two" as never, "messages");
    collector.addReference("three" as never, "characters");

    expect(collector.result(true)).toEqual({
      affectedDocuments: 3,
      limit: 3,
      safe: true,
      targetExists: true,
      counts: { messages: 2, characters: 1 },
    });
    expect(collector.references()).toEqual(["one", "two", "three"]);
  });

  it("reads only the single extra document needed to prove a query is unsafe", async () => {
    mockGetDocs.mockResolvedValue({ docs: documents(4), empty: false });
    const collector = new BoundedDeletionCollector(3);

    const read = await collector.addQuery("query" as never, "messages");

    expect(read).toHaveLength(4);
    expect(collector.result(true)).toMatchObject({
      affectedDocuments: 4,
      limit: 3,
      safe: false,
    });
    expect(() => collector.references()).toThrow("more than 3 documents");
    expect(mockGetDocs).toHaveBeenCalledOnce();
  });

  it("blocks missing targets and explicit unsafe reasons", () => {
    expect(() =>
      assertSafeDestructivePreflight(new BoundedDeletionCollector().result(false), "Campaign")
    ).toThrow("Campaign no longer exists");

    expect(() =>
      assertSafeDestructivePreflight(
        new BoundedDeletionCollector().result(true, "Recovery Index cannot be identified."),
        "Character"
      )
    ).toThrow("Recovery Index cannot be identified");
  });
});
