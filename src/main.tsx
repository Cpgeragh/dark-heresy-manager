import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { markUpdateStalled } from "./pwaUpdateState";
import "./index.css";
import "@fontsource/roboto/400.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

function Splash({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-red-600 animate-spin" />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}

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
  root.render(<Splash label="Updating…" />);
  // If the update stalls (connection drops mid-download), fall back to the
  // cached app rather than hanging on "Updating…" forever.
  window.setTimeout(() => {
    settled = false;
    markUpdateStalled();
    renderApp();
  }, 30000);
}

// Neutral splash while we decide whether an update is pending.
root.render(<Splash label="Loading…" />);

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
      if (sessionStorage.getItem("pwa-just-upgraded")) {
        sessionStorage.removeItem("pwa-just-upgraded");
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
