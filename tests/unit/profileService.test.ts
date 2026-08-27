import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDoc, mockSetDoc, mockSyncGmNameAcrossCampaigns } = vi.hoisted(() => ({
  mockDoc: vi.fn(() => "profile-ref"),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockSyncGmNameAcrossCampaigns: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: vi.fn(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db" }));

vi.mock("../../src/services/campaignService", () => ({
  syncGmNameAcrossCampaigns: (...args: unknown[]) => mockSyncGmNameAcrossCampaigns(...args),
}));

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

  it("syncs the trimmed name to every campaign the user DMs", async () => {
    await saveFirstName("user-1", "  Ibram  ");

    expect(mockSyncGmNameAcrossCampaigns).toHaveBeenCalledWith("user-1", "Ibram");
  });

  it("rejects an empty first name before writing or syncing", async () => {
    await expect(saveFirstName("user-1", "   ")).rejects.toThrow("First name is required.");
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockSyncGmNameAcrossCampaigns).not.toHaveBeenCalled();
  });

  it("rejects a first name over 50 characters before writing or syncing", async () => {
    await expect(saveFirstName("user-1", "x".repeat(51))).rejects.toThrow(
      "First name cannot exceed 50 characters."
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockSyncGmNameAcrossCampaigns).not.toHaveBeenCalled();
  });
});
