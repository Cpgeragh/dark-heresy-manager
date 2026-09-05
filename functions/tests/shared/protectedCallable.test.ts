// functions/tests/shared/protectedCallable.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { protectedCallable } from "../../src/shared/protectedCallable";
import { withSafeErrors } from "../../src/shared/errors";
import { requireAuth } from "../../src/shared/auth";
import { assertRequestFields } from "../../src/shared/validation";
import { enforceRateLimit } from "../../src/shared/rateLimit";
import { withIdempotency } from "../../src/shared/idempotency";
import { recordAuditEntry } from "../../src/shared/audit";
import { recordUsageMetric } from "../../src/shared/metrics";

vi.mock("firebase-functions", () => ({
  logger: { warn: vi.fn() },
}));

vi.mock("../../src/shared/errors", () => ({
  withSafeErrors: vi.fn((_operation: string, handler: () => Promise<unknown>) => handler()),
}));
vi.mock("../../src/shared/auth", () => ({ requireAuth: vi.fn() }));
vi.mock("../../src/shared/validation", () => ({
  assertRequestFields: vi.fn(),
  assertFieldShapes: vi.fn(),
  assertRequestPayloadBounds: vi.fn(),
}));
vi.mock("../../src/shared/rateLimit", () => ({ enforceRateLimit: vi.fn() }));
vi.mock("../../src/shared/idempotency", () => ({
  withIdempotency: vi.fn((_key: string, handler: () => Promise<unknown>) => handler()),
}));
vi.mock("../../src/shared/audit", () => ({ recordAuditEntry: vi.fn() }));
vi.mock("../../src/shared/metrics", () => ({ recordUsageMetric: vi.fn() }));

function makeRequest(data: unknown = {}): CallableRequest {
  return { data } as CallableRequest;
}

describe("protectedCallable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockReturnValue({ uid: "user-1", appCheckVerified: true });
    vi.mocked(enforceRateLimit).mockResolvedValue(undefined);
    vi.mocked(recordAuditEntry).mockResolvedValue(undefined);
    vi.mocked(recordUsageMetric).mockResolvedValue(undefined);
  });

  it("runs auth, validation, and the handler in order, and records a success outcome", async () => {
    const handler = vi.fn(async () => "handler-result");

    const result = await protectedCallable({
      request: makeRequest({ code: "DH-ABCD-1234" }),
      operation: "test-op",
      allowedFields: ["code"],
      handler,
    });

    expect(result).toBe("handler-result");
    expect(requireAuth).toHaveBeenCalled();
    expect(assertRequestFields).toHaveBeenCalledWith({ code: "DH-ABCD-1234" }, ["code"], []);
    expect(handler).toHaveBeenCalledWith({
      uid: "user-1",
      appCheckVerified: true,
      data: { code: "DH-ABCD-1234" },
    });
    expect(recordAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "test-op", actorUid: "user-1", outcome: "success" })
    );
    expect(recordUsageMetric).toHaveBeenCalledWith("test-op");
  });

  it("never forwards a raw Recovery Code to audit or usage metrics", async () => {
    const code = "DH-ABCD-1234";

    await protectedCallable({
      request: makeRequest({ code }),
      operation: "claim-character",
      allowedFields: ["code"],
      handler: async () => "ok",
    });

    expect(JSON.stringify(vi.mocked(recordAuditEntry).mock.calls)).not.toContain(code);
    expect(JSON.stringify(vi.mocked(recordUsageMetric).mock.calls)).not.toContain(code);
    expect(recordAuditEntry).toHaveBeenCalledWith({
      operation: "claim-character",
      actorUid: "user-1",
      outcome: "success",
    });
    expect(recordUsageMetric).toHaveBeenCalledWith("claim-character");
  });

  it("enforces every configured rate limit, in order, before running the handler", async () => {
    await protectedCallable({
      request: makeRequest(),
      operation: "test-op",
      allowedFields: [],
      rateLimits: [
        { key: "key-a", limit: 5, windowMs: 900_000 },
        { key: "key-b", limit: 10, windowMs: 60_000 },
      ],
      handler: async () => "ok",
    });

    expect(enforceRateLimit).toHaveBeenNthCalledWith(1, {
      key: "key-a",
      limit: 5,
      windowMs: 900_000,
    });
    expect(enforceRateLimit).toHaveBeenNthCalledWith(2, {
      key: "key-b",
      limit: 10,
      windowMs: 60_000,
    });
  });

  it("does not enforce any rate limit when none are configured", async () => {
    await protectedCallable({
      request: makeRequest(),
      operation: "test-op",
      allowedFields: [],
      handler: async () => "ok",
    });

    expect(enforceRateLimit).not.toHaveBeenCalled();
  });

  it("routes the handler through idempotency when a key is supplied", async () => {
    await protectedCallable({
      request: makeRequest(),
      operation: "test-op",
      allowedFields: [],
      idempotencyKey: "idem-1",
      handler: async () => "ok",
    });

    expect(withIdempotency).toHaveBeenCalledWith("idem-1", expect.any(Function));
  });

  it("records a failure outcome and rethrows when the handler throws", async () => {
    const failure = new Error("handler failed");

    await expect(
      protectedCallable({
        request: makeRequest(),
        operation: "test-op",
        allowedFields: [],
        handler: async () => {
          throw failure;
        },
      })
    ).rejects.toBe(failure);

    expect(recordAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "test-op", actorUid: "user-1", outcome: "failure" })
    );
  });

  it("does not let an audit/metric recording failure mask a successful result", async () => {
    vi.mocked(recordAuditEntry).mockRejectedValue(new Error("audit write failed with secret"));

    const result = await protectedCallable({
      request: makeRequest(),
      operation: "test-op",
      allowedFields: [],
      handler: async () => "handler-result",
    });

    expect(result).toBe("handler-result");
    expect(logger.warn).toHaveBeenCalledWith("Failed to record audit/metric for test-op");
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain("secret");
  });

  it("wraps the whole operation in withSafeErrors", async () => {
    await protectedCallable({
      request: makeRequest(),
      operation: "test-op",
      allowedFields: [],
      handler: async () => "ok",
    });

    expect(withSafeErrors).toHaveBeenCalledWith("test-op", expect.any(Function));
  });
});
