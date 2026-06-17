import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { SplashScreen } from "./components/SplashScreen";
import { markUpdateStalled, markPostUpgrade } from "./pwaUpdateState";
import "./index.css";
import "@fontsource/im-fell-english/400.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/roboto/400.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

let settled = false;

function renderApp() {
  if (settled) return;
  settled = true;
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

function renderUpdating() {
  if (settled) return;
  settled = true;
  sessionStorage.setItem("pwa-just-upgraded", "1");
  root.render(<SplashScreen label="Updating…" />);
  // If the update stalls (connection drops mid-download), fall back to the
  // cached app rather than hanging on "Updating…" forever.
  window.setTimeout(() => {
    settled = false;
    markUpdateStalled();
    renderApp();
  }, 30000);
}

// Post-upgrade reload: skip the splash entirely — the app is ready immediately.
const justUpgraded = sessionStorage.getItem("pwa-just-upgraded");
if (justUpgraded) {
  sessionStorage.removeItem("pwa-just-upgraded");
  markPostUpgrade();
  renderApp();
} else {
  root.render(<SplashScreen label="Loading…" />);
}

if (import.meta.env.DEV) {
  // In dev no service worker is registered, so registerSW's callbacks never
  // fire — render the app directly instead of waiting on them forever.
  renderApp();
} else {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      // First visit / not yet controlled by a worker → nothing cached can be
      // stale, so just show the app.
      if (!registration || !navigator.serviceWorker.controller) {
        renderApp();
        return;
      }
      // Safety net: never hold the splash longer than this on the check itself.
      window.setTimeout(renderApp, 3000);
      // Force an update check. If a new version is installing, stay on the
      // "Updating…" splash (autoUpdate reloads once it's ready); otherwise the
      // cached version is current, so render it.
      registration
        .update()
        .then(() => {
          if (registration.installing || registration.waiting) renderUpdating();
          else renderApp();
        })
        .catch(() => renderApp());
    },
    onRegisterError() {
      renderApp();
    },
  });
}
