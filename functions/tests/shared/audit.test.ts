// functions/tests/shared/audit.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashAuditActorUid, recordAuditEntry } from "../../src/shared/audit";

const mockAdd = vi.fn();
const mockCollection = vi.fn(() => ({ add: mockAdd }));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
}));

describe("recordAuditEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdd.mockResolvedValue(undefined);
  });

  it("writes an entry with the operation, actor, outcome, and metadata", async () => {
    await recordAuditEntry({
      operation: "character:claim",
      actorUid: "user-1",
      outcome: "success",
      metadata: { campaignId: "c1" },
    });

    expect(mockCollection).toHaveBeenCalledWith("auditLog");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "character:claim",
        actorHash: hashAuditActorUid("user-1"),
        outcome: "success",
        metadata: { campaignId: "c1" },
      })
    );
    expect(mockAdd.mock.calls[0][0]).not.toHaveProperty("actorUid");
  });

  it("defaults metadata to an empty object when omitted", async () => {
    await recordAuditEntry({ operation: "character:claim", actorUid: "user-1", outcome: "failure" });

    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ metadata: {} }));
  });

  it("rejects metadata with too many fields before writing anything", async () => {
    const metadata = Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [`key${index}`, "value"])
    );

    await expect(
      recordAuditEntry({ operation: "test", actorUid: "user-1", outcome: "success", metadata })
    ).rejects.toThrow("cannot exceed 20 fields");
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("rejects an oversized metadata string value before writing anything", async () => {
    await expect(
      recordAuditEntry({
        operation: "test",
        actorUid: "user-1",
        outcome: "success",
        metadata: { note: "x".repeat(201) },
      })
    ).rejects.toThrow("exceeds 200 characters");
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
