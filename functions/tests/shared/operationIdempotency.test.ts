import { describe, expect, it } from "vitest";
import { buildOperationIdempotencyKey } from "../../src/shared/operationIdempotency.js";

describe("buildOperationIdempotencyKey", () => {
  it("omits persistent idempotency for an older client without an operation ID", () => {
    expect(buildOperationIdempotencyKey("release-character", "user-1", undefined)).toBeUndefined();
  });

  it("scopes and hashes a supplied operation ID", () => {
    const key = buildOperationIdempotencyKey("release-character", "user-1", "operation-1");

    expect(key).toMatch(/^release-character:user-1:[a-f0-9]{64}$/);
    expect(key).not.toContain("operation-1");
  });

  it("does not collide across operations, callers, or operation IDs", () => {
    const base = buildOperationIdempotencyKey("release-character", "user-1", "operation-1");

    expect(
      buildOperationIdempotencyKey("force-release-character", "user-1", "operation-1")
    ).not.toBe(base);
    expect(buildOperationIdempotencyKey("release-character", "user-2", "operation-1")).not.toBe(
      base
    );
    expect(buildOperationIdempotencyKey("release-character", "user-1", "operation-2")).not.toBe(
      base
    );
  });
});
