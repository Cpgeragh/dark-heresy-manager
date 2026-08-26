import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCharacterDocRef,
  mockCharacterSummaryDocRef,
  mockComputeCharacterSummary,
  mockRunTransaction,
  mockTransaction,
} = vi.hoisted(() => {
  const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };
  return {
    mockCharacterDocRef: vi.fn(
      (campaignId: string, characterId: string) => `character:${campaignId}:${characterId}`
    ),
    mockCharacterSummaryDocRef: vi.fn(
      (campaignId: string, characterId: string) => `character-summary:${campaignId}:${characterId}`
    ),
    mockComputeCharacterSummary: vi.fn((character: unknown) => ({
      ...(character as Record<string, unknown>),
      __summary: true,
    })),
    mockRunTransaction: vi.fn(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
      operation(mockTransaction)
    ),
    mockTransaction,
  };
});

vi.mock("firebase/firestore", () => ({
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

vi.mock("../../src/firebase/converters", () => ({
  characterDocRef: (...args: [string, string]) => mockCharacterDocRef(...args),
  characterSummaryDocRef: (...args: [string, string]) => mockCharacterSummaryDocRef(...args),
}));

vi.mock("../../src/services/characterService", () => ({
  computeCharacterSummary: (...args: [unknown]) => mockComputeCharacterSummary(...args),
}));

import { uploadPortrait } from "../../src/services/portraitService";

beforeEach(() => {
  vi.clearAllMocks();
  mockRunTransaction.mockImplementation(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
    operation(mockTransaction)
  );
  mockTransaction.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ id: "character-1", campaignId: "campaign-1", header: { characterName: "Test" } }),
  });
});

describe("portrait write validation", () => {
  it("performs one character write for duplicate in-flight portrait uploads", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mockRunTransaction.mockReturnValueOnce(pending);
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    const first = uploadPortrait("campaign-duplicate", "character-duplicate", image);
    const duplicate = uploadPortrait("campaign-duplicate", "character-duplicate", image);

    await vi.waitFor(() => expect(mockRunTransaction).toHaveBeenCalledOnce());
    finish();
    await Promise.all([first, duplicate]);
  });

  it("rejects an unsupported MIME type before reading or writing", async () => {
    const svg = new Blob(["<svg></svg>"], { type: "image/svg+xml" });

    await expect(uploadPortrait("campaign-1", "character-1", svg)).rejects.toThrow(
      "JPEG, PNG, or WebP"
    );
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("rejects a final encoded portrait over 350,000 bytes before writing", async () => {
    const image = new Blob([new Uint8Array(300_000)], { type: "image/jpeg" });

    await expect(uploadPortrait("campaign-1", "character-1", image)).rejects.toThrow(
      "cannot exceed 350000 encoded bytes"
    );
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("writes a bounded supported portrait, and its derived summary, in one transaction", async () => {
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    const result = await uploadPortrait("campaign-1", "character-1", image);

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(mockTransaction.update).toHaveBeenCalledWith("character:campaign-1:character-1", {
      portraitUrl: result,
    });
    expect(mockComputeCharacterSummary).toHaveBeenCalledWith(
      expect.objectContaining({ id: "character-1", campaignId: "campaign-1", portraitUrl: result })
    );
    expect(mockTransaction.set).toHaveBeenCalledWith(
      "character-summary:campaign-1:character-1",
      expect.objectContaining({ __summary: true })
    );
  });

  it("throws when the character no longer exists", async () => {
    mockTransaction.get.mockResolvedValue({ exists: () => false });
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    await expect(uploadPortrait("campaign-1", "character-1", image)).rejects.toThrow(
      "Character not found."
    );
  });
});
