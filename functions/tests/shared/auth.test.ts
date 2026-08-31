// functions/tests/shared/auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { requireAuth } from "../../src/shared/auth";

vi.mock("firebase-functions", () => ({
  logger: { warn: vi.fn() },
}));

function makeRequest(overrides: Partial<CallableRequest> = {}): CallableRequest {
  return {
    data: {},
    ...overrides,
  } as CallableRequest;
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws unauthenticated when the caller has no verified auth", () => {
    expect(() => requireAuth(makeRequest({ auth: undefined }))).toThrow(
      expect.objectContaining({ code: "unauthenticated" })
    );
  });

  it("returns the caller's uid and appCheckVerified: true when both auth and App Check are present", () => {
    const request = makeRequest({
      auth: { uid: "user-1", token: {} as never },
      app: { appId: "app-1", token: {} as never },
    });

    expect(requireAuth(request)).toEqual({ uid: "user-1", appCheckVerified: true });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("returns appCheckVerified: false and logs a warning when App Check is missing", () => {
    const request = makeRequest({
      auth: { uid: "user-1", token: {} as never },
      app: undefined,
    });

    expect(requireAuth(request)).toEqual({ uid: "user-1", appCheckVerified: false });
    expect(logger.warn).toHaveBeenCalledWith(
      "Callable invoked without a verified App Check token"
    );
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain("user-1");
  });
});
