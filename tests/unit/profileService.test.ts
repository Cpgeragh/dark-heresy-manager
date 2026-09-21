import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpdateDisplayName } = vi.hoisted(() => ({
  mockUpdateDisplayName: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "updateDisplayName") return mockUpdateDisplayName;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db", functions: "mock-functions" }));

import { saveFirstName } from "../../src/services/profileService";

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateDisplayName.mockResolvedValue({ data: undefined });
});

describe("saveFirstName", () => {
  it("sends the trimmed name to the protected Function", async () => {
    await saveFirstName("  Ibram  ");

    expect(mockUpdateDisplayName).toHaveBeenCalledWith({ firstName: "Ibram" });
  });

  it("rejects an empty first name before calling the Function", async () => {
    await expect(saveFirstName("   ")).rejects.toThrow("First name is required.");
    expect(mockUpdateDisplayName).not.toHaveBeenCalled();
  });

  it("rejects a first name over 50 characters before calling the Function", async () => {
    await expect(saveFirstName("x".repeat(51))).rejects.toThrow(
      "First name cannot exceed 50 characters."
    );
    expect(mockUpdateDisplayName).not.toHaveBeenCalled();
  });
});
