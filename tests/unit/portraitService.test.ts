import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPatchCharacterField } = vi.hoisted(() => ({
  mockPatchCharacterField: vi.fn(),
}));

vi.mock("../../src/services/characterService", () => ({
  patchCharacterField: (...args: [string, string, string, unknown]) => mockPatchCharacterField(...args),
}));

import { uploadPortrait } from "../../src/services/portraitService";

beforeEach(() => {
  vi.clearAllMocks();
  mockPatchCharacterField.mockResolvedValue(undefined);
});

describe("portrait write validation", () => {
  it("performs one Function call for duplicate in-flight portrait uploads", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mockPatchCharacterField.mockReturnValueOnce(pending);
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    const first = uploadPortrait("campaign-duplicate", "character-duplicate", image);
    const duplicate = uploadPortrait("campaign-duplicate", "character-duplicate", image);

    await vi.waitFor(() => expect(mockPatchCharacterField).toHaveBeenCalledOnce());
    finish();
    await Promise.all([first, duplicate]);
  });

  it("rejects an unsupported MIME type before reading or writing", async () => {
    const svg = new Blob(["<svg></svg>"], { type: "image/svg+xml" });

    await expect(uploadPortrait("campaign-1", "character-1", svg)).rejects.toThrow(
      "JPEG, PNG, or WebP"
    );
    expect(mockPatchCharacterField).not.toHaveBeenCalled();
  });

  it("rejects a final encoded portrait over 350,000 bytes before writing", async () => {
    const image = new Blob([new Uint8Array(300_000)], { type: "image/jpeg" });

    await expect(uploadPortrait("campaign-1", "character-1", image)).rejects.toThrow(
      "cannot exceed 350000 encoded bytes"
    );
    expect(mockPatchCharacterField).not.toHaveBeenCalled();
  });

  it("calls patchCharacterField with the encoded portrait", async () => {
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    const result = await uploadPortrait("campaign-1", "character-1", image);

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(mockPatchCharacterField).toHaveBeenCalledWith(
      "campaign-1",
      "character-1",
      "portraitUrl",
      result
    );
  });

  it("propagates a rejection from patchCharacterField", async () => {
    mockPatchCharacterField.mockRejectedValue(new Error("Character not found."));
    const image = new Blob([new Uint8Array(100)], { type: "image/jpeg" });

    await expect(uploadPortrait("campaign-1", "character-1", image)).rejects.toThrow(
      "Character not found."
    );
  });
});
