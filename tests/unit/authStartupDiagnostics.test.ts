import { afterEach, beforeEach, expect, it, vi } from "vitest";

const apiKey = "test-key";
const loginKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
const lookup = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
const refresh = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
const signUp = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
const savedLogin = (uid: string) => ({
  uid,
  emailVerified: false,
  isAnonymous: true,
  stsTokenManager: { refreshToken: "private-refresh-token" },
});

function mockIndexedDb(result: unknown, action = "success") {
  const abort = vi.fn();
  const transaction = vi.fn(() => ({
    objectStore: () => ({
      get: (key: string) => {
        expect(key).toBe(loginKey);
        const read = { onsuccess: () => {}, result };
        queueMicrotask(() => read.onsuccess());
        return read;
      },
    }),
  }));
  const open = vi.fn(() => {
    const request = {
      onupgradeneeded: () => {},
      onerror: () => {},
      onsuccess: () => {},
      transaction: { abort },
      result: { objectStoreNames: { contains: () => true }, transaction, close: vi.fn() },
    };
    queueMicrotask(() => {
      if (action === "absent") request.onupgradeneeded();
      if (action === "error") request.onerror();
      if (action === "success") request.onsuccess();
    });
    return request;
  });
  vi.stubGlobal("indexedDB", { open });
  return { abort, transaction };
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ users: [{ localId: "old" }] }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("confirms a restored login in IndexedDB and keeps the completed read-back on reload", async () => {
  const store = mockIndexedDb({ value: savedLogin("old") });
  const { rememberAccountConnection } = await import("../../src/services/accountConnectionMarker");
  rememberAccountConnection("old", "account");
  const diagnostics = await import("../../src/authStartupDiagnostics");
  const originalFetch = window.fetch;
  await diagnostics.beginAuthStartupDiagnostics(apiKey, "[DEFAULT]");
  await window.fetch(lookup);
  diagnostics.finishAuthStartup("restored", "old");
  const evidence = await diagnostics.authStartupEvidenceForReport("old");
  expect(await diagnostics.authStartupEvidenceForReport("different-device")).toBeUndefined();
  expect(evidence).toMatchObject({
    before: { indexedDb: "matching", localStorage: "missing", sessionStorage: "missing" },
    after: { indexedDb: "matching" },
    outcome: "restored",
    requests: [{ operation: "lookup", result: "http", status: 200 }],
  });
  expect(store.transaction.mock.calls).toEqual([
    ["firebaseLocalStorage", "readonly"],
    ["firebaseLocalStorage", "readonly"],
  ]);
  expect(window.fetch).toBe(originalFetch);
  vi.resetModules();
  const { exportAccountDiagnostics } = await import("../../src/accountDiagnostics");
  const report = exportAccountDiagnostics();
  expect(JSON.parse(report).authStartups).toEqual([expect.objectContaining(evidence!)]);
  expect(report).not.toContain("private-refresh-token");
});

it("keeps a missing database distinct from a replacement that has been saved", async () => {
  const { abort } = mockIndexedDb(undefined, "absent");
  const diagnostics = await import("../../src/authStartupDiagnostics");
  await diagnostics.beginAuthStartupDiagnostics(apiKey, "[DEFAULT]");
  expect(abort).toHaveBeenCalledOnce();
  diagnostics.noteAuthStartupWithoutLogin();
  await window.fetch(signUp);
  mockIndexedDb({ value: savedLogin("replacement") });
  diagnostics.finishAuthStartup("created", "replacement");
  expect(await diagnostics.authStartupEvidenceForReport()).toMatchObject({
    before: { indexedDb: "no-database", localStorage: "missing", sessionStorage: "missing" },
    after: { indexedDb: "matching" },
    outcome: "created",
    requests: [{ operation: "sign-up", result: "http", status: 200 }],
  });
});

it("records an unreadable IndexedDB, invalid local storage and an available session fallback separately", async () => {
  mockIndexedDb(undefined, "error");
  localStorage.setItem(loginKey, "broken JSON");
  sessionStorage.setItem(loginKey, JSON.stringify(savedLogin("old")));
  const diagnostics = await import("../../src/authStartupDiagnostics");
  await diagnostics.beginAuthStartupDiagnostics(apiKey, "[DEFAULT]");
  diagnostics.finishAuthStartup("restored", "old");
  expect(await diagnostics.authStartupEvidenceForReport()).toMatchObject({
    before: { indexedDb: "unreadable", localStorage: "invalid", sessionStorage: "present" },
    after: { indexedDb: "unreadable", localStorage: "invalid", sessionStorage: "matching" },
  });
});

it("keeps the Auth rejection code and a later connection failure without copying the response", async () => {
  mockIndexedDb({ value: savedLogin("old") });
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ error: { message: "USER_DISABLED : private detail" } }, { status: 400 })
    )
    .mockRejectedValueOnce(new TypeError("connection lost"));
  vi.stubGlobal("fetch", fetch);
  const diagnostics = await import("../../src/authStartupDiagnostics");
  await diagnostics.beginAuthStartupDiagnostics(apiKey, "[DEFAULT]");
  const response = await window.fetch(refresh);
  expect(await response.json()).toEqual({ error: { message: "USER_DISABLED : private detail" } });
  diagnostics.noteAuthStartupWithoutLogin();
  await expect(window.fetch(signUp)).rejects.toThrow("connection lost");
  diagnostics.finishAuthStartup("error", undefined, { code: "auth/network-request-failed" });
  const evidence = await diagnostics.authStartupEvidenceForReport();
  expect(evidence).toMatchObject({
    before: { indexedDb: "present" },
    outcome: "error",
    error: "auth/network-request-failed",
    requests: [
      { operation: "refresh", result: "http", status: 400, detail: "USER_DISABLED" },
      { operation: "sign-up", result: "network-error" },
    ],
  });
  expect(JSON.stringify(evidence)).not.toContain("private detail");
});

it("lets startup continue after a storage timeout and saves partial evidence if Auth stalls", async () => {
  vi.useFakeTimers();
  mockIndexedDb(undefined, "stall");
  const diagnostics = await import("../../src/authStartupDiagnostics");
  const original = window.fetch;
  const begin = diagnostics.beginAuthStartupDiagnostics(apiKey, "[DEFAULT]");
  await vi.advanceTimersByTimeAsync(250);
  await begin;
  await vi.advanceTimersByTimeAsync(195_000);
  expect(window.fetch).toBe(original);
  expect(await diagnostics.authStartupEvidenceForReport()).toMatchObject({
    before: { indexedDb: "timed-out" },
    outcome: "checking",
    captureTimedOut: true,
  });
});
