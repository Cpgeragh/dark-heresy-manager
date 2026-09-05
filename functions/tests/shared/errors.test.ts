// functions/tests/shared/errors.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { withSafeErrors } from "../../src/shared/errors";

vi.mock("firebase-functions", () => ({
  logger: { error: vi.fn() },
}));

describe("withSafeErrors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the handler's result unchanged on success", async () => {
    const result = await withSafeErrors("test-op", async () => "ok");
    expect(result).toBe("ok");
  });

  it("rethrows an HttpsError exactly as thrown", async () => {
    const original = new HttpsError("invalid-argument", "Bad input.");
    await expect(
      withSafeErrors("test-op", async () => {
        throw original;
      })
    ).rejects.toBe(original);
  });

  it("converts an unexpected error into a generic internal HttpsError", async () => {
    await expect(
      withSafeErrors("test-op", async () => {
        throw new Error("raw internal detail");
      })
    ).rejects.toMatchObject({
      code: "internal",
      message: "Something went wrong. Please try again.",
    });
  });

  it("logs only bounded error type and code, never the error's sensitive details", async () => {
    const realError = Object.assign(new Error("raw internal detail with DH-LEAK-0001"), {
      code: "firestore/unavailable",
    });
    await expect(
      withSafeErrors("test-op", async () => {
        throw realError;
      })
    ).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith("test-op failed", {
      errorType: "Error",
      errorCode: "firestore/unavailable",
    });
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain("raw internal detail");
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain("DH-LEAK-0001");
  });

  it("never logs when an HttpsError is thrown deliberately, since it isn't a bug", async () => {
    await expect(
      withSafeErrors("test-op", async () => {
        throw new HttpsError("permission-denied", "No.");
      })
    ).rejects.toThrow();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
