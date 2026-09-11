import { describe, it, expect } from "vitest";
import {
  generateRecoveryCode,
  formatRecoveryCodeInput,
  formatRecoveryCodeInputChange,
} from "../../src/utils/recoveryCode";
import { validateRecoveryCode } from "../../src/utils/validation";

// RECOVERY_CODE_SEGMENT_LENGTH = 4, RECOVERY_CODE_SEGMENTS = 2
// Expected format: DH-XXXX-XXXX (2 segments of 4 uppercase alphanumeric chars)

describe("generateRecoveryCode", () => {
  it("starts with the DH- prefix", () => {
    expect(generateRecoveryCode()).toMatch(/^DH-/);
  });

  it("matches the full DH-XXXX-XXXX format", () => {
    // 2 segments of 4 uppercase alphanumeric characters separated by dashes
    expect(generateRecoveryCode()).toMatch(/^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("produces only uppercase characters", () => {
    const code = generateRecoveryCode();
    expect(code).toBe(code.toUpperCase());
  });

  it("has exactly two dash-separated segments after the prefix", () => {
    const code = generateRecoveryCode();
    const parts = code.split("-");
    // ["DH", "XXXX", "XXXX"]
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("DH");
    expect(parts[1]).toHaveLength(4);
    expect(parts[2]).toHaveLength(4);
  });

  it("passes the validateRecoveryCode validator", () => {
    const result = validateRecoveryCode(generateRecoveryCode());
    expect(result.isValid).toBe(true);
  });

  it("generates unique codes on repeated calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRecoveryCode()));
    // With a 4-char base-36 segment, collision probability is negligible across 20 calls
    expect(codes.size).toBe(20);
  });
});

describe("formatRecoveryCodeInput", () => {
  it("uppercases input", () => {
    expect(formatRecoveryCodeInput("3a9k2b7c")).toBe("DH-3A9K-2B7C");
  });

  it("supplies the prefix and separators while the user types only variable characters", () => {
    expect(formatRecoveryCodeInput("3")).toBe("DH-3");
    expect(formatRecoveryCodeInput("3a9k")).toBe("DH-3A9K-");
    expect(formatRecoveryCodeInput("3a9k2")).toBe("DH-3A9K-2");
    expect(formatRecoveryCodeInput("3a9k2b")).toBe("DH-3A9K-2B");
  });

  it("is idempotent on already-formatted codes", () => {
    expect(formatRecoveryCodeInput("DH-3A9K-2B")).toBe("DH-3A9K-2B");
  });

  it("strips spaces and other non-alphanumeric characters", () => {
    expect(formatRecoveryCodeInput("3a9k ! 2b7c")).toBe("DH-3A9K-2B7C");
  });

  it("does not mistake variable characters beginning with DH for the fixed prefix", () => {
    expect(formatRecoveryCodeInput("dh3a9k2b")).toBe("DH-DH3A-9K2B");
  });

  it("accepts a complete unformatted code", () => {
    expect(formatRecoveryCodeInput("dh3a9k2b7c")).toBe("DH-3A9K-2B7C");
  });

  it("truncates input beyond the full code length", () => {
    // Full code is 10 chars (DH + two 4-char segments); extra chars are dropped.
    expect(formatRecoveryCodeInput("dh3a9k2bEXTRA")).toBe("DH-3A9K-2BEX");
  });

  it("returns an empty string for empty input", () => {
    expect(formatRecoveryCodeInput("")).toBe("");
  });
});

describe("formatRecoveryCodeInputChange", () => {
  it("keeps the automatic prefix empty when its dash is backspaced", () => {
    expect(formatRecoveryCodeInputChange("DH-", "DH")).toBe("");
  });

  it("removes a fixed prefix manually typed after the automatic prefix", () => {
    expect(formatRecoveryCodeInputChange("DH-DH", "DH-DH-")).toBe("");
  });

  it("removes the second separator when the last character after it is deleted", () => {
    expect(formatRecoveryCodeInputChange("DH-3A9K-2", "DH-3A9K-")).toBe("DH-3A9K");
  });

  it("removes the second separator when the whole second segment is deleted", () => {
    expect(formatRecoveryCodeInputChange("DH-3A9K-2B7C", "DH-3A9K-")).toBe("DH-3A9K");
  });

  it("continues through an empty automatic separator when backspacing", () => {
    expect(formatRecoveryCodeInputChange("DH-3A9K-", "DH-3A9K")).toBe("DH-3A9");
  });

  it("restores the separator when typing resumes after a complete first segment", () => {
    expect(formatRecoveryCodeInputChange("DH-3A9K", "DH-3A9K2")).toBe("DH-3A9K-2");
  });
});
