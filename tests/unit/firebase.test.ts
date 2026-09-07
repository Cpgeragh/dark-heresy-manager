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
  connectFirestoreEmulator: vi.fn(),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));
vi.mock("firebase/functions", () => ({
  connectFunctionsEmulator: vi.fn(),
  getFunctions: vi.fn(() => ({})),
}));

const mockInitializeAppCheck = vi.fn();
const mockReCaptchaEnterpriseProvider = vi.fn();
vi.mock("firebase/app-check", () => ({
  initializeAppCheck: (...args: unknown[]) => mockInitializeAppCheck(...args),
  ReCaptchaEnterpriseProvider: mockReCaptchaEnterpriseProvider,
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

describe("src/firebase.ts App Check", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockInitializeAppCheck.mockClear();
    mockReCaptchaEnterpriseProvider.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initialises App Check when a reCAPTCHA site key is configured", async () => {
    stubAllEnvVars();
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
    await import("../../src/firebase");

    expect(mockReCaptchaEnterpriseProvider).toHaveBeenCalledWith("test-site-key");
    expect(mockInitializeAppCheck).toHaveBeenCalledOnce();
  });

  it("does not initialise App Check when no site key is configured", async () => {
    stubAllEnvVars();
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "");
    await import("../../src/firebase");

    expect(mockInitializeAppCheck).not.toHaveBeenCalled();
  });

  it("fails fast when the staging project has no App Check site key", async () => {
    stubAllEnvVars();
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "dark-heresy-manager-staging");
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "");

    await expect(import("../../src/firebase")).rejects.toThrow("VITE_RECAPTCHA_SITE_KEY");
    expect(mockInitializeAppCheck).not.toHaveBeenCalled();
  });
});

describe("src/firebase.ts performance emulator mode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("connects every browser Firebase client only for dh-test performance mode", async () => {
    const { connectAuthEmulator } = await import("firebase/auth");
    const { connectFirestoreEmulator } = await import("firebase/firestore");
    const { connectFunctionsEmulator } = await import("firebase/functions");
    stubAllEnvVars();
    vi.stubEnv("MODE", "performance");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "dh-test");
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "unused-local-key");

    await import("../../src/firebase");

    expect(connectFirestoreEmulator).toHaveBeenCalledWith({}, "127.0.0.1", 8080);
    expect(connectAuthEmulator).toHaveBeenCalledWith({}, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    expect(connectFunctionsEmulator).toHaveBeenCalledWith({}, "127.0.0.1", 5001);
    expect(mockInitializeAppCheck).not.toHaveBeenCalled();
  });

  it("rejects performance mode for every project except dh-test", async () => {
    stubAllEnvVars();
    vi.stubEnv("MODE", "performance");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "not-the-test-project");

    await expect(import("../../src/firebase")).rejects.toThrow(
      'Performance mode may only use the local Firebase project "dh-test".'
    );
  });

  it("does not connect emulators in the ordinary test mode", async () => {
    const { connectAuthEmulator } = await import("firebase/auth");
    const { connectFirestoreEmulator } = await import("firebase/firestore");
    const { connectFunctionsEmulator } = await import("firebase/functions");
    stubAllEnvVars();

    await import("../../src/firebase");

    expect(connectAuthEmulator).not.toHaveBeenCalled();
    expect(connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(connectFunctionsEmulator).not.toHaveBeenCalled();
  });
});
