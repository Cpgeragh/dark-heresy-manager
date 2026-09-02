// functions/tests/shared/characterFieldValidation.test.ts
import { describe, it, expect } from "vitest";
import { assertValidCharacterFieldValue } from "../../src/shared/characterFieldValidation";

describe("assertValidCharacterFieldValue: notes", () => {
  it("accepts a plain string within the character limit", () => {
    expect(() => assertValidCharacterFieldValue("notes", "Some campaign notes.")).not.toThrow();
  });

  it("accepts a well-formed array of note entries", () => {
    expect(() =>
      assertValidCharacterFieldValue("notes", [
        { id: "n1", title: "Session 1", text: "Met the Inquisitor.", updatedAt: "2026-09-02T00:00:00.000Z" },
      ])
    ).not.toThrow();
  });

  it("accepts an empty array", () => {
    expect(() => assertValidCharacterFieldValue("notes", [])).not.toThrow();
  });

  it("rejects a number", () => {
    expect(() => assertValidCharacterFieldValue("notes", 42)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a plain object (not an array)", () => {
    expect(() => assertValidCharacterFieldValue("notes", { title: "x" })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a string over the character limit", () => {
    expect(() => assertValidCharacterFieldValue("notes", "a".repeat(4001))).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("accepts a string at exactly the character limit", () => {
    expect(() => assertValidCharacterFieldValue("notes", "a".repeat(4000))).not.toThrow();
  });

  it("rejects an array over the entry limit", () => {
    const entries = Array.from({ length: 201 }, (_, index) => ({
      id: `n${index}`,
      title: "T",
      text: "x",
      updatedAt: "2026-09-02T00:00:00.000Z",
    }));
    expect(() => assertValidCharacterFieldValue("notes", entries)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a note entry whose text exceeds the character limit", () => {
    expect(() =>
      assertValidCharacterFieldValue("notes", [
        { id: "n1", title: "T", text: "a".repeat(4001), updatedAt: "2026-09-02T00:00:00.000Z" },
      ])
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});

describe("assertValidCharacterFieldValue: header", () => {
  it("accepts a well-formed header", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", {
        characterName: "Brother Corvus",
        playerName: "Alex",
        career: "Guardsman",
        rank: "Conscript",
        gender: "Male",
        quirks: ["Speaks in a low murmur"],
        age: 34,
      })
    ).not.toThrow();
  });

  it("accepts a header with only characterName", () => {
    expect(() => assertValidCharacterFieldValue("header", { characterName: "Brother Corvus" })).not.toThrow();
  });

  it("rejects a header missing characterName", () => {
    expect(() => assertValidCharacterFieldValue("header", { playerName: "Alex" })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects an empty characterName", () => {
    expect(() => assertValidCharacterFieldValue("header", { characterName: "   " })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a characterName over the character limit", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "a".repeat(101) })
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("accepts a characterName at exactly the character limit", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "a".repeat(100) })
    ).not.toThrow();
  });

  it("rejects an unknown header key", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "Brother Corvus", notAKey: "x" })
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a non-object value", () => {
    expect(() => assertValidCharacterFieldValue("header", "Brother Corvus")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe("assertValidCharacterFieldValue: unknown fields", () => {
  it("rejects a field with no registered validator", () => {
    expect(() => assertValidCharacterFieldValue("experience", { total: 100 })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});
