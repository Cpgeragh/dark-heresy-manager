import { beforeEach, describe, expect, it, vi } from "vitest";

describe("account diagnostic history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    localStorage.clear();
  });

  it("preserves login evidence across reloads and limits the stored history", async () => {
    const first = await import("../../src/accountDiagnostics");
    first.recordAccountDiagnostic("login-received", { uid: "original-login" });
    vi.resetModules();
    const next = await import("../../src/accountDiagnostics");
    expect(JSON.parse(next.exportAccountDiagnostics()).events).toContainEqual(
      expect.objectContaining({ event: "login-received", uid: "original-login" })
    );
    for (let i = 0; i < 100; i++) next.recordAccountDiagnostic("sample");
    expect(JSON.parse(next.exportAccountDiagnostics()).events).toHaveLength(80);
  });

  it("allows the app to continue when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const diagnostics = await import("../../src/accountDiagnostics");
    expect(() =>
      diagnostics.recordAccountDiagnostic("login-received", { uid: "login" })
    ).not.toThrow();
    expect(JSON.parse(diagnostics.exportAccountDiagnostics()).storageAvailable).toBe(false);
  });
});
