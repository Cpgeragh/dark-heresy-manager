// tests/unit/claimLog.test.ts

import { describe, it, expect, vi } from "vitest";
import { buildClaimLogPayload, validateClaimLogPayload } from "../../src/utils/claimLog";

// serverTimestamp() returns a sentinel object — mock it so tests stay pure
vi.mock("firebase/firestore", () => ({
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
}));

describe("buildClaimLogPayload", () => {
  it("builds a claim payload", () => {
    const payload = buildClaimLogPayload("claim", "user-1", null, "user-1");
    expect(payload.action).toBe("claim");
    expect(payload.actorUid).toBe("user-1");
    expect(payload.previousOwnerUid).toBeNull();
    expect(payload.newOwnerUid).toBe("user-1");
    expect(payload.timestamp).toBeDefined();
  });

  it("builds a release payload", () => {
    const payload = buildClaimLogPayload("release", "user-1", "user-1", null);
    expect(payload.action).toBe("release");
    expect(payload.previousOwnerUid).toBe("user-1");
    expect(payload.newOwnerUid).toBeNull();
  });

  it("builds a force-assign payload", () => {
    const payload = buildClaimLogPayload("force-assign", "dm-1", null, "user-2");
    expect(payload.action).toBe("force-assign");
    expect(payload.actorUid).toBe("dm-1");
    expect(payload.newOwnerUid).toBe("user-2");
  });

  it("builds a force-release payload", () => {
    const payload = buildClaimLogPayload("force-release", "dm-1", "user-1", null);
    expect(payload.action).toBe("force-release");
    expect(payload.previousOwnerUid).toBe("user-1");
    expect(payload.newOwnerUid).toBeNull();
  });

  it("does not include id field", () => {
    const payload = buildClaimLogPayload("claim", "user-1", null, "user-1");
    expect("id" in payload).toBe(false);
  });
});

describe("validateClaimLogPayload", () => {
  it("accepts valid claim entry", () => {
    expect(validateClaimLogPayload({ action: "claim", actorUid: "user-1" })).toBe(true);
  });

  it("accepts all valid actions", () => {
    for (const action of ["claim", "release", "force-assign", "force-release"]) {
      expect(validateClaimLogPayload({ action, actorUid: "uid" })).toBe(true);
    }
  });

  it("rejects invalid action", () => {
    expect(validateClaimLogPayload({ action: "delete", actorUid: "uid" })).toBe(false);
  });

  it("rejects missing action", () => {
    expect(validateClaimLogPayload({ actorUid: "uid" })).toBe(false);
  });

  it("rejects missing actorUid", () => {
    expect(validateClaimLogPayload({ action: "claim" })).toBe(false);
  });

  it("rejects null", () => {
    expect(validateClaimLogPayload(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(validateClaimLogPayload("claim")).toBe(false);
    expect(validateClaimLogPayload(42)).toBe(false);
  });

  it("rejects numeric action", () => {
    expect(validateClaimLogPayload({ action: 1, actorUid: "uid" })).toBe(false);
  });
});
