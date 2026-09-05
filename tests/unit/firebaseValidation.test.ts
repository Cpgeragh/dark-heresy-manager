import { describe, expect, it, vi } from "vitest";
import { PRODUCT_LIMITS } from "../../src/constants/productLimits";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import {
  assertBulkOperationCount,
  assertCharacterImportData,
  assertCharacterPayload,
  assertCustomItemData,
  assertEncodedPortrait,
  assertFirestoreDocumentId,
  assertPortraitSource,
  encodedByteLength,
  readCharacterImportFile,
} from "../../src/firestore/firebaseValidation";

function validImport() {
  return createEmptyCharacterData({
    campaignId: "campaign-1",
    recoveryCode: "DH-ABCD-1234",
    characterName: "Acolyte",
  });
}

function maximumSizedValidImportText() {
  const gear = Array.from({ length: PRODUCT_LIMITS.characterArrayEntries }, (_, index) => ({
    id: `gear-${index}`,
    name: `Gear ${index}`,
    description: "",
  }));
  const data = { ...validImport(), gear };
  const baseText = JSON.stringify(data);
  let remaining = PRODUCT_LIMITS.characterImportBytes - encodedByteLength(baseText);

  expect(remaining).toBeGreaterThan(0);
  for (const item of gear) {
    const characters = Math.min(remaining, PRODUCT_LIMITS.customItemTextCharacters);
    item.description = "x".repeat(characters);
    remaining -= characters;
  }

  const text = JSON.stringify(data);
  expect(remaining).toBe(0);
  expect(encodedByteLength(text)).toBe(PRODUCT_LIMITS.characterImportBytes);
  return text;
}

describe("character import validation", () => {
  it("accepts the exact exported character structure", () => {
    expect(() => assertCharacterImportData(validImport())).not.toThrow();
  });

  it("rejects unknown and missing top-level fields", () => {
    expect(() => assertCharacterImportData({ ...validImport(), unexpected: true })).toThrow(
      "unsupported field: unexpected"
    );
    const { wounds: _wounds, ...missingWounds } = validImport();
    expect(() => assertCharacterImportData(missingWounds)).toThrow(
      "missing required field: wounds"
    );
  });

  it("checks the declared byte size before reading or parsing", async () => {
    const text = vi.fn().mockResolvedValue(JSON.stringify(validImport()));

    await expect(readCharacterImportFile({ size: 750_001, text })).rejects.toThrow(
      "too large to import"
    );
    expect(text).not.toHaveBeenCalled();
  });

  it("accepts an exactly maximum-sized valid import and rejects larger file content", async () => {
    const text = maximumSizedValidImportText();

    await expect(
      readCharacterImportFile({
        size: PRODUCT_LIMITS.characterImportBytes,
        text: async () => text,
      })
    ).resolves.toMatchObject({ campaignId: "campaign-1" });

    await expect(
      readCharacterImportFile({
        size: PRODUCT_LIMITS.characterImportBytes,
        text: async () => `${text} `,
      })
    ).rejects.toThrow("too large to import");
  });

  it("rejects malformed JSON and structurally invalid parsed data", async () => {
    await expect(
      readCharacterImportFile({ size: 8, text: async () => "not json" })
    ).rejects.toThrow("not valid JSON");
    await expect(
      readCharacterImportFile({
        size: 20,
        text: async () => JSON.stringify({ recoveryCode: "DH-ABCD-1234" }),
      })
    ).rejects.toThrow("missing required field");
  });

  it("rejects oversized character arrays and invalid nested IDs", () => {
    expect(() =>
      assertCharacterPayload({ gear: Array.from({ length: 201 }, () => ({ id: "gear-1" })) })
    ).toThrow("more than 200 entries");
    expect(() => assertCharacterPayload({ gear: [{ id: 42 }] })).toThrow(
      "Character data.gear[0].id is invalid"
    );
  });

  it("rejects a nested character field over the per-string character limit", () => {
    expect(() =>
      assertCharacterPayload({
        gear: [
          { id: "gear-1", description: "x".repeat(PRODUCT_LIMITS.characterFieldCharacters + 1) },
        ],
      })
    ).toThrow(`cannot exceed ${PRODUCT_LIMITS.characterFieldCharacters} characters`);
  });

  it("accepts a character array at the exact entry boundary", () => {
    expect(() =>
      assertCharacterPayload({
        gear: Array.from({ length: PRODUCT_LIMITS.characterArrayEntries }, (_, index) => ({
          id: `gear-${index}`,
        })),
      })
    ).not.toThrow();
  });
});

describe("custom-item validation", () => {
  it("accepts a bounded category-specific definition", () => {
    expect(() =>
      assertCustomItemData("weapon", {
        weaponKind: "ranged",
        name: "Acolyte Pattern Lasgun",
        description: "A campaign weapon.",
      })
    ).not.toThrow();
  });

  it("accepts exact maximum custom-item strings and arrays", () => {
    expect(() =>
      assertCustomItemData("armour", {
        armourKind: "worn",
        name: "N".repeat(PRODUCT_LIMITS.customItemNameCharacters),
        notes: "x".repeat(PRODUCT_LIMITS.customItemTextCharacters),
        locations: Array.from({ length: PRODUCT_LIMITS.customItemArrayEntries }, () => "body"),
      })
    ).not.toThrow();
  });

  it("rejects unknown fields and invalid category discriminators", () => {
    expect(() => assertCustomItemData("gear", { name: "Auspex", unknown: true })).toThrow(
      "unsupported field: unknown"
    );
    expect(() => assertCustomItemData("weapon", { name: "Oddity", weaponKind: "beam" })).toThrow(
      "weapon kind is invalid"
    );
  });

  it("rejects oversized strings, arrays, byte payloads, and nesting", () => {
    expect(() =>
      assertCustomItemData("gear", { name: "Gear", description: "x".repeat(4_001) })
    ).toThrow("cannot exceed 4000 characters");
    expect(() =>
      assertCustomItemData("armour", {
        armourKind: "worn",
        name: "Many Layers",
        locations: Array.from({ length: 101 }, () => "body"),
      })
    ).toThrow("more than 100 entries");
    expect(() =>
      assertCustomItemData("gear", { name: "Huge", description: "x".repeat(100_001) })
    ).toThrow();

    let nested: Record<string, unknown> = { value: true };
    for (let index = 0; index < 9; index += 1) nested = { child: nested };
    expect(() =>
      assertCustomItemData("cybernetic", { name: "Deep Implant", concealedWeapon: nested })
    ).toThrow("nested deeper than 8 levels");
  });
});

describe("portrait, ID, and bulk validation", () => {
  it("accepts supported portraits and rejects unsafe source inputs", () => {
    expect(() => assertPortraitSource({ size: 5_000_000, type: "image/png" })).not.toThrow();
    expect(() => assertPortraitSource({ size: 5_000_001, type: "image/png" })).toThrow(
      "cannot exceed 5000000 bytes"
    );
    expect(() => assertPortraitSource({ size: 1_000, type: "image/svg+xml" })).toThrow(
      "JPEG, PNG, or WebP"
    );
  });

  it("rejects an invalid or oversized final encoded portrait", () => {
    expect(() => assertEncodedPortrait("data:text/plain;base64,AAAA")).toThrow("type is invalid");
    expect(() => assertEncodedPortrait(`data:image/jpeg;base64,${"A".repeat(350_000)}`)).toThrow(
      "cannot exceed 350000 encoded bytes"
    );
  });

  it("accepts a final encoded portrait at the exact byte boundary", () => {
    const prefix = "data:image/webp;base64,";
    const portrait = `${prefix}${"A".repeat(
      PRODUCT_LIMITS.portraitEncodedBytes - encodedByteLength(prefix)
    )}`;

    expect(encodedByteLength(portrait)).toBe(PRODUCT_LIMITS.portraitEncodedBytes);
    expect(() => assertEncodedPortrait(portrait)).not.toThrow();
  });

  it("rejects unsafe IDs before they can become Firestore paths", () => {
    expect(() => assertFirestoreDocumentId("campaign-1", "Campaign ID")).not.toThrow();
    expect(() => assertFirestoreDocumentId("campaign/other", "Campaign ID")).toThrow(
      "Campaign ID is invalid"
    );
    expect(() => assertFirestoreDocumentId(42, "Campaign ID")).toThrow("Campaign ID is invalid");
  });

  it("accepts the bulk boundary and rejects an oversized operation", () => {
    expect(() => assertBulkOperationCount(440)).not.toThrow();
    expect(() => assertBulkOperationCount(441)).toThrow("more than 440 documents");
    expect(() => assertBulkOperationCount(1.5)).toThrow("more than 440 documents");
  });
});
