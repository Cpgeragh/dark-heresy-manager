// tests/unit/claimLog.test.ts

import { describe, it, expect } from "vitest";
import { validateClaimLogPayload } from "../../src/utils/claimLog";

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
