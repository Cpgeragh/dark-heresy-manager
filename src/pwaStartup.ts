export const PWA_UPDATE_CHECK_FALLBACK_MS = 3_000;
export const PWA_STALLED_UPDATE_FALLBACK_MS = 30_000;

export const PWA_JUST_UPGRADED_KEY = "pwa-just-upgraded";

interface ServiceWorkerRegistrationLike {
  installing: unknown;
  waiting: unknown;
}

interface ServiceWorkerRegistrationOptions {
  immediate: true;
  onNeedReload: () => void;
  onRegisteredSW: (
    serviceWorkerUrl: string,
    registration: ServiceWorkerRegistrationLike | undefined
  ) => void;
  onRegisterError: (error: unknown) => void;
}

interface StartupStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export interface PwaStartupOptions {
  isDevelopment: boolean;
  serviceWorkerSupported: boolean;
  registerServiceWorker: (options: ServiceWorkerRegistrationOptions) => unknown;
  hasController: () => boolean;
  renderApp: () => void;
  renderLoading: () => void;
  renderUpdating: () => void;
  storage: StartupStorage;
  schedule: (callback: () => void, delayMs: number) => unknown;
  markUpdateStalled: () => void;
  markPostUpgrade: () => void;
  mark: (name: string) => void;
  reloadPage: () => void;
}

/**
 * Coordinates the existing production PWA startup flow behind injectable
 * browser dependencies so every update state can be measured and tested.
 * This intentionally preserves the current three- and thirty-second safety
 * behaviour; corrections are considered only after the measurements.
 */
export function startPwaStartup(options: PwaStartupOptions): void {
  let settled = false;
  let reloadRequested = false;

  const renderApp = () => {
    if (settled) return;
    settled = true;
    options.mark("startup:app-render-requested");
    options.renderApp();
  };

  const renderUpdating = () => {
    if (settled) return;
    settled = true;
    options.mark("startup:update-detected");
    options.storage.setItem(PWA_JUST_UPGRADED_KEY, "1");
    options.renderUpdating();
    options.schedule(() => {
      settled = false;
      options.mark("startup:update-stalled-fallback");
      options.storage.removeItem(PWA_JUST_UPGRADED_KEY);
      options.markUpdateStalled();
      renderApp();
    }, PWA_STALLED_UPDATE_FALLBACK_MS);
  };

  const reloadForActivatedUpdate = () => {
    if (reloadRequested) return;
    reloadRequested = true;
    options.mark("startup:update-activated");
    options.storage.setItem(PWA_JUST_UPGRADED_KEY, "1");
    options.renderUpdating();
    options.reloadPage();
  };

  options.mark("startup:bootstrap");
  const justUpgraded = options.storage.getItem(PWA_JUST_UPGRADED_KEY);
  if (justUpgraded) {
    options.storage.removeItem(PWA_JUST_UPGRADED_KEY);
    options.mark("startup:post-upgrade");
    options.markPostUpgrade();
    renderApp();
  } else {
    options.mark("startup:loading-splash");
    options.renderLoading();
  }

  if (options.isDevelopment) {
    options.mark("startup:development-bypass");
    renderApp();
    return;
  }

  if (!options.serviceWorkerSupported) {
    options.mark("startup:service-worker-unsupported");
    renderApp();
    return;
  }

  // Cover registration as well as the explicit update check. The registration
  // helper can otherwise remain pending without invoking either callback.
  options.schedule(() => {
    options.mark("startup:update-check-safety-fallback");
    renderApp();
  }, PWA_UPDATE_CHECK_FALLBACK_MS);

  options.mark("startup:service-worker-registration-start");
  options.mark("startup:update-check-start");
  options.registerServiceWorker({
    immediate: true,
    onNeedReload: reloadForActivatedUpdate,
    onRegisteredSW(_serviceWorkerUrl, registration) {
      options.mark("startup:service-worker-registered");
      options.mark("startup:update-check-complete");
      if (!registration || !options.hasController()) {
        options.mark("startup:first-visit-or-no-controller");
        renderApp();
        return;
      }

      options.mark("startup:controlled-visit");
      if (registration.installing || registration.waiting) renderUpdating();
      else {
        options.mark("startup:no-update");
        renderApp();
      }
    },
    onRegisterError() {
      options.mark("startup:service-worker-registration-error");
      options.mark("startup:update-check-error");
      renderApp();
    },
  });
}
