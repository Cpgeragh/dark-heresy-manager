import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCharacterDocRef, mockUpdateDoc } = vi.hoisted(() => ({
  mockCharacterDocRef: vi.fn(
    (campaignId: string, characterId: string) => `character:${campaignId}:${characterId}`
  ),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock("../../src/firebase/converters", () => ({
  characterDocRef: (...args: [string, string]) => mockCharacterDocRef(...args),
}));

import { uploadPortrait } from "../../src/services/portraitService";

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateDoc.mockResolvedValue(undefined);
});

describe("portrait write validation", () => {
  it("performs one character write for duplicate in-flight portrait uploads", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mockUpdateDoc.mockReturnValueOnce(pending);
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    const first = uploadPortrait("campaign-duplicate", "character-duplicate", image);
    const duplicate = uploadPortrait("campaign-duplicate", "character-duplicate", image);

    await vi.waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledOnce());
    finish();
    await Promise.all([first, duplicate]);
  });

  it("rejects an unsupported MIME type before reading or writing", async () => {
    const svg = new Blob(["<svg></svg>"], { type: "image/svg+xml" });

    await expect(uploadPortrait("campaign-1", "character-1", svg)).rejects.toThrow(
      "JPEG, PNG, or WebP"
    );
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("rejects a final encoded portrait over 350,000 bytes before writing", async () => {
    const image = new Blob([new Uint8Array(300_000)], { type: "image/jpeg" });

    await expect(uploadPortrait("campaign-1", "character-1", image)).rejects.toThrow(
      "cannot exceed 350000 encoded bytes"
    );
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("writes a bounded supported portrait", async () => {
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    const result = await uploadPortrait("campaign-1", "character-1", image);

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(mockUpdateDoc).toHaveBeenCalledWith("character:campaign-1:character-1", {
      portraitUrl: result,
    });
  });
});
