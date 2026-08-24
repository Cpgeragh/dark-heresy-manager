// functions/tests/shared/recoveryCode.test.ts
import { describe, it, expect } from "vitest";
import { generateRecoveryCode, hashRecoveryCode, hashForKey } from "../../src/shared/recoveryCode";

describe("generateRecoveryCode", () => {
  it("produces a code matching the DH-XXXX-YYYY format", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  it("produces different codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRecoveryCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("hashRecoveryCode", () => {
  it("produces the same hash for the same code and secret", () => {
    expect(hashRecoveryCode("DH-ABCD-1234", "secret")).toBe(hashRecoveryCode("DH-ABCD-1234", "secret"));
  });

  it("produces different hashes for different codes with the same secret", () => {
    expect(hashRecoveryCode("DH-ABCD-1234", "secret")).not.toBe(
      hashRecoveryCode("DH-WXYZ-5678", "secret")
    );
  });

  it("produces different hashes for the same code with different secrets", () => {
    expect(hashRecoveryCode("DH-ABCD-1234", "secret-a")).not.toBe(
      hashRecoveryCode("DH-ABCD-1234", "secret-b")
    );
  });

  it("never reveals the raw code in its output", () => {
    const hash = hashRecoveryCode("DH-ABCD-1234", "secret");
    expect(hash).not.toContain("ABCD");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("hashForKey", () => {
  it("produces a stable, non-reversible hash with no secret needed", () => {
    expect(hashForKey("DH-ABCD-1234")).toBe(hashForKey("DH-ABCD-1234"));
    expect(hashForKey("DH-ABCD-1234")).not.toContain("ABCD");
    expect(hashForKey("DH-ABCD-1234")).toMatch(/^[0-9a-f]{64}$/);
  });
});
