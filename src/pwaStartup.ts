export const PWA_UPDATE_CHECK_FALLBACK_MS = 3_000;
export const PWA_STALLED_UPDATE_FALLBACK_MS = 300_000;

export const PWA_JUST_UPGRADED_KEY = "pwa-just-upgraded";

interface ServiceWorkerRegistrationLike {
  installing: unknown;
  waiting: unknown;
  update: () => Promise<unknown>;
  addEventListener?: (type: "updatefound", listener: () => void) => void;
}

interface ServiceWorkerLike {
  state?: string;
  addEventListener?: (type: "statechange", listener: () => void) => void;
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
 * Coordinates the PWA startup flow behind injectable browser dependencies so
 * every update state can be measured and tested. The startup update check is
 * capped at three seconds and a stalled update download at five minutes.
 */
export function startPwaStartup(options: PwaStartupOptions): void {
  let settled = false;
  let reloadRequested = false;
  let updating = false;

  const renderApp = () => {
    if (settled) return;
    settled = true;
    options.mark("startup:app-render-requested");
    options.renderApp();
  };

  // Last resort when a new version never finishes installing: open the app and warn.
  const giveUpOnUpdate = () => {
    if (!updating || reloadRequested) return;
    updating = false;
    settled = false;
    options.mark("startup:update-stalled-fallback");
    options.storage.removeItem(PWA_JUST_UPGRADED_KEY);
    options.markUpdateStalled();
    renderApp();
  };

  // Shows the updating splash at startup, or later once a new version starts downloading.
  const renderUpdating = () => {
    // Once the main application has rendered, never replace it with the
    // updating splash. A late update can finish in the background and reload.
    if (settled || reloadRequested) return;
    updating = true;
    settled = true;
    options.mark("startup:update-detected");
    options.storage.setItem(PWA_JUST_UPGRADED_KEY, "1");
    options.renderUpdating();
    options.schedule(giveUpOnUpdate, PWA_STALLED_UPDATE_FALLBACK_MS);
  };

  const reloadForActivatedUpdate = () => {
    if (reloadRequested) return;
    reloadRequested = true;
    options.mark("startup:update-activated");
    options.storage.setItem(PWA_JUST_UPGRADED_KEY, "1");
    // If startup is still on the neutral loading splash, switch it to
    // Updating. If the app is already visible, leave it alone until reload.
    if (!settled) {
      settled = true;
      updating = true;
      options.renderUpdating();
    }
    options.reloadPage();
  };

  // The registration helper only reports a version it hears about after registering,
  // so follow the downloading version directly.
  const watchUpdate = (worker: unknown) => {
    const candidate = worker as ServiceWorkerLike | null;
    if (!candidate) return;
    const check = () => {
      if (candidate.state === "activated") reloadForActivatedUpdate();
      else if (candidate.state === "redundant") giveUpOnUpdate();
    };
    check();
    candidate.addEventListener?.("statechange", check);
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
      if (!registration || !options.hasController()) {
        options.mark("startup:update-check-complete");
        options.mark("startup:first-visit-or-no-controller");
        renderApp();
        return;
      }

      options.mark("startup:controlled-visit");
      // Listen first, so a version announced from now on is never missed.
      registration.addEventListener?.("updatefound", () => {
        options.mark("startup:update-announced");
        renderUpdating();
        watchUpdate(registration.installing);
      });
      const downloading = registration.installing ?? registration.waiting;
      if (downloading) {
        options.mark("startup:update-check-complete");
        renderUpdating();
        watchUpdate(downloading);
        return;
      }

      // Keep the neutral loading splash visible while making the explicit
      // startup check used by the known-good flow. The updatefound listener
      // above closes the race between starting this check and inspecting it.
      registration
        .update()
        .then(() => {
          options.mark("startup:update-check-complete");
          const discovered = registration.installing ?? registration.waiting;
          if (discovered) {
            renderUpdating();
            watchUpdate(discovered);
          } else {
            options.mark("startup:no-update");
            renderApp();
          }
        })
        .catch(() => {
          options.mark("startup:update-check-error");
          renderApp();
        });
    },
    onRegisterError() {
      options.mark("startup:service-worker-registration-error");
      options.mark("startup:update-check-error");
      renderApp();
    },
  });
}
