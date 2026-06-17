import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { markUpdateStalled, markPostUpgrade } from "./pwaUpdateState";
import "./index.css";
import "@fontsource/roboto/400.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

function Splash({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <img src="/icon-1026%20x%201600.png" alt="" className="h-20 w-auto" />
        <div className="flex flex-col items-center gap-1">
          <span className="font-cinzel text-4xl font-bold tracking-[0.1em] text-red-600">Dark Heresy</span>
          <span className="font-cinzel text-sm tracking-[0.55em] text-slate-500 uppercase">Manager</span>
        </div>
      </div>
      <div className="flex items-center gap-3 w-64">
        <div className="flex-1 border-t-4 border-double border-slate-800" />
        <img src="/Icon-eagle.png" alt="" className="h-4 w-auto opacity-60" />
        <div className="flex-1 border-t-4 border-double border-slate-800" />
      </div>
      <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-red-600 animate-spin" />
      {label !== "Loading…" && (
        <span className="text-[0.6rem] tracking-widest text-slate-500 uppercase">{label}</span>
      )}
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

// Post-upgrade reload: skip the splash entirely — the app is ready immediately.
const justUpgraded = sessionStorage.getItem("pwa-just-upgraded");
if (justUpgraded) {
  sessionStorage.removeItem("pwa-just-upgraded");
  markPostUpgrade();
  renderApp();
} else {
  root.render(<Splash label="Loading…" />);
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
