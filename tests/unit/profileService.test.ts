import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDoc, mockSetDoc } = vi.hoisted(() => ({
  mockDoc: vi.fn(() => "profile-ref"),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: vi.fn(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db" }));

import { saveFirstName } from "../../src/services/profileService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveFirstName", () => {
  it("trims a valid first name before storing it", async () => {
    await saveFirstName("user-1", "  Ibram  ");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "userProfiles", "user-1");
    expect(mockSetDoc).toHaveBeenCalledWith("profile-ref", { firstName: "Ibram" });
  });

  it("rejects an empty first name before writing", async () => {
    await expect(saveFirstName("user-1", "   ")).rejects.toThrow("First name is required.");
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects a first name over 50 characters before writing", async () => {
    await expect(saveFirstName("user-1", "x".repeat(51))).rejects.toThrow(
      "First name cannot exceed 50 characters."
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
