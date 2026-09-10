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
  onNeedReload: () => void;
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
    reloadPage: vi.fn(),
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

  it("uses the registration helper's single check on a controlled visit with no update", () => {
    const harness = createHarness();

    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);

    expect(harness.registration.update).not.toHaveBeenCalled();
    expect(harness.scheduled.map(({ delayMs }) => delayMs)).toContain(PWA_UPDATE_CHECK_FALLBACK_MS);
    expect(harness.renders).toEqual(["loading", "app"]);
    expect(harness.marks).toContain("startup:update-check-complete");
    expect(harness.marks).toContain("startup:no-update");
  });

  it("shows Updating when the single registration check finds an installing update", () => {
    const harness = createHarness();
    harness.registration.installing = {};

    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);

    expect(harness.registration.update).not.toHaveBeenCalled();
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

  it("marks an activated update before the helper-requested reload", () => {
    const harness = createHarness();
    harness.callbacks()?.onRegisteredSW("/sw.js", harness.registration);

    harness.callbacks()?.onNeedReload();
    harness.callbacks()?.onNeedReload();

    expect(harness.options.reloadPage).toHaveBeenCalledOnce();
    expect(harness.renders).toEqual(["loading", "app", "updating"]);
    expect(harness.storageValues.get(PWA_JUST_UPGRADED_KEY)).toBe("1");
    expect(harness.marks).toContain("startup:update-activated");
  });

  it("renders after the registration helper reports an update-check error", () => {
    const registrationFailure = createHarness();
    registrationFailure.callbacks()?.onRegisterError(new Error("registration failed"));
    expect(registrationFailure.renders).toEqual(["loading", "app"]);
    expect(registrationFailure.marks).toContain("startup:update-check-error");
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
