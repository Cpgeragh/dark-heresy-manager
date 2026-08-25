import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));
vi.mock("firebase/firestore", () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
}));

function stubAllEnvVars() {
  for (const key of REQUIRED_ENV_VARS) {
    vi.stubEnv(key, `test-${key}`);
  }
}

describe("src/firebase.ts config validation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initialises without throwing when every config value is present", async () => {
    stubAllEnvVars();
    await expect(import("../../src/firebase")).resolves.toBeDefined();
  });

  it.each(REQUIRED_ENV_VARS)("throws when %s is missing", async (missingKey) => {
    stubAllEnvVars();
    vi.stubEnv(missingKey, "");
    await expect(import("../../src/firebase")).rejects.toThrow(missingKey);
  });
});
