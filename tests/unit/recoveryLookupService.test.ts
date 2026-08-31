// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCallLookupRecoveryCode } = vi.hoisted(() => ({
  mockCallLookupRecoveryCode: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => mockCallLookupRecoveryCode),
}));

vi.mock("../../src/firebase", () => ({
  functions: "mock-functions",
}));

import { lookupRecoveryCharacter } from "../../src/services/recoveryLookupService";
import { ClientCodeAttemptLimitError } from "../../src/utils/clientCodeAttemptLimit";

describe("recovery lookup service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCallLookupRecoveryCode.mockResolvedValue({ data: { status: "not-found" } });
  });

  it("validates malformed codes before recording or calling Firebase", async () => {
    await expect(lookupRecoveryCharacter("not-a-code")).rejects.toThrow("DH-XXXX-YYYY");
    expect(mockCallLookupRecoveryCode).not.toHaveBeenCalled();
  });

  it("trims a valid code before calling Firebase", async () => {
    await lookupRecoveryCharacter("  DH-C0DE-0001  ");

    expect(mockCallLookupRecoveryCode).toHaveBeenCalledWith({ code: "DH-C0DE-0001" });
  });

  it("blocks the sixth valid attempt before making another Firebase request", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await lookupRecoveryCharacter(`DH-C0DE-000${attempt}`);
    }

    await expect(lookupRecoveryCharacter("DH-C0DE-0005")).rejects.toBeInstanceOf(
      ClientCodeAttemptLimitError
    );
    expect(mockCallLookupRecoveryCode).toHaveBeenCalledTimes(5);
  });
});
