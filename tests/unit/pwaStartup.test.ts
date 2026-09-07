import { describe, expect, it, vi } from "vitest";
import {
  PWA_JUST_UPGRADED_KEY,
  PWA_STALLED_UPDATE_FALLBACK_MS,
  PWA_UPDATE_CHECK_FALLBACK_MS,
  startPwaStartup,
  type PwaStartupOptions,
} from "../../src/pwaStartup";

interface RegistrationCallbacks {
  onRegisteredSW: PwaStartupOptions["registerServiceWorker"] extends (options: infer T) => unknown
    ? T extends { onRegisteredSW: infer TCallback }
      ? TCallback
      : never
    : never;
  onRegisterError: (error: unknown) => void;
}

function createHarness(overrides: Partial<PwaStartupOptions> = {}) {
  let callbacks: RegistrationCallbacks | undefined;
  const scheduled: Array<{ callback: () => void; delayMs: number }> = [];
  const storageValues = new Map<string, string>();
  const renders: string[] = [];
  const marks: string[] = [];
  const registration = {
    installing: null as unknown,
    waiting: null as unknown,
    update: vi.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
  };

  const options: PwaStartupOptions = {
    isDevelopment: false,
    serviceWorkerSupported: true,
    registerServiceWorker: (options) => {
      callbacks = options;
    },
    hasController: () => true,
    renderApp: () => renders.push("app"),
    renderLoading: () => renders.push("loading"),
    renderUpdating: () => renders.push("updating"),
    storage: {
      getItem: (key) => storageValues.get(key) ?? null,
      removeItem: (key) => {
        storageValues.delete(key);
      },
      setItem: (key, value) => {
        storageValues.set(key, value);
      },
    },
    schedule: (callback, delayMs) => {
      scheduled.push({ callback, delayMs });
      return scheduled.length;
    },
    markUpdateStalled: vi.fn(),
    markPostUpgrade: vi.fn(),
    mark: (name) => marks.push(name),
    ...overrides,
  };

  startPwaStartup(options);
  return {
    callbacks: () => callbacks,
    marks,
    options,
    registration,
    renders,
    scheduled,
    storageValues,
  };
}

describe("PWA startup coordination", () => {
  it("renders immediately in development without registering a worker", () => {
    const registerServiceWorker = vi.fn();
    const harness = createHarness({ isDevelopment: true, registerServiceWorker });

    expect(harness.renders).toEqual(["loading", "app"]);
    expect(registerServiceWorker).not.toHaveBeenCalled();
    expect(harness.marks).toContain("startup:development-bypass");
  });

  it("renders a first visit once registration completes without a controller", () => {
    const harness = createHarness({ hasController: () => false });

    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);

    expect(harness.renders).toEqual(["loading", "app"]);
    expect(harness.registration.update).not.toHaveBeenCalled();
    expect(harness.marks).toContain("startup:first-visit-or-no-controller");
  });

  it("renders a controlled visit when the current worker has no update", async () => {
    const harness = createHarness();

    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);
    await Promise.resolve();

    expect(harness.registration.update).toHaveBeenCalledOnce();
    expect(harness.scheduled.map(({ delayMs }) => delayMs)).toContain(PWA_UPDATE_CHECK_FALLBACK_MS);
    expect(harness.renders).toEqual(["loading", "app"]);
    expect(harness.marks).toContain("startup:no-update");
  });

  it("shows Updating while an available update installs, then falls back after 30 seconds", async () => {
    const harness = createHarness();
    harness.registration.installing = {};

    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);
    await Promise.resolve();

    expect(harness.renders).toEqual(["loading", "updating"]);
    expect(harness.storageValues.get(PWA_JUST_UPGRADED_KEY)).toBe("1");
    const stalledFallback = harness.scheduled.find(
      ({ delayMs }) => delayMs === PWA_STALLED_UPDATE_FALLBACK_MS
    );
    expect(stalledFallback).toBeDefined();

    stalledFallback?.callback();

    expect(harness.options.markUpdateStalled).toHaveBeenCalledOnce();
    expect(harness.renders).toEqual(["loading", "updating", "app"]);
    expect(harness.storageValues.get(PWA_JUST_UPGRADED_KEY)).toBeUndefined();
  });

  it("uses the three-second fallback when an update check never settles", () => {
    const harness = createHarness();
    harness.registration.update.mockReturnValue(new Promise(() => undefined));

    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);
    expect(harness.renders).toEqual(["loading"]);

    harness.scheduled.find(({ delayMs }) => delayMs === PWA_UPDATE_CHECK_FALLBACK_MS)?.callback();

    expect(harness.renders).toEqual(["loading", "app"]);
    expect(harness.marks).toContain("startup:update-check-safety-fallback");
  });

  it("renders after an update-check rejection or registration error", async () => {
    const updateFailure = createHarness();
    updateFailure.registration.update.mockRejectedValue(new Error("offline"));
    updateFailure.callbacks()?.onRegisteredSW("/sw.js", updateFailure.registration);
    await Promise.resolve();
    await Promise.resolve();

    expect(updateFailure.renders).toEqual(["loading", "app"]);
    expect(updateFailure.marks).toContain("startup:update-check-error");

    const registrationFailure = createHarness();
    registrationFailure.callbacks()?.onRegisterError(new Error("registration failed"));
    expect(registrationFailure.renders).toEqual(["loading", "app"]);
  });

  it("consumes the post-upgrade marker and renders the app immediately", () => {
    const harness = createHarness({
      storage: {
        getItem: () => "1",
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });

    expect(harness.options.markPostUpgrade).toHaveBeenCalledOnce();
    expect(harness.renders).toEqual(["app"]);
  });

  it("renders immediately when service workers are unsupported", () => {
    const registerServiceWorker = vi.fn();
    const unsupported = createHarness({ serviceWorkerSupported: false, registerServiceWorker });

    expect(unsupported.renders).toEqual(["loading", "app"]);
    expect(unsupported.marks).toContain("startup:service-worker-unsupported");
    expect(registerServiceWorker).not.toHaveBeenCalled();
  });

  it("uses the three-second fallback when registration never settles", () => {
    const neverRegistered = createHarness();
    expect(neverRegistered.renders).toEqual(["loading"]);

    neverRegistered.scheduled
      .find(({ delayMs }) => delayMs === PWA_UPDATE_CHECK_FALLBACK_MS)
      ?.callback();

    expect(neverRegistered.renders).toEqual(["loading", "app"]);
    expect(neverRegistered.marks).toContain("startup:update-check-safety-fallback");
  });
});
