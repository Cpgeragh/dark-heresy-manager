import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { recordAccountDiagnostic } from "./accountDiagnostics";
import { requestPersistentStorage } from "./persistentStorage";
import { SplashScreen } from "./components/SplashScreen";
import { markUpdateStalled, markPostUpgrade } from "./pwaUpdateState";
import {
  markApplicationPerformance,
  recordApplicationCommit,
} from "./performance/performanceMetrics";
import { startPwaStartup } from "./pwaStartup";
import "./index.css";
import "@fontsource/im-fell-english/400.css";
import "@fontsource/im-fell-english/400-italic.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

function renderApp() {
  const application = <App />;
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        {import.meta.env.MODE === "performance" ? (
          <React.Profiler id="Application" onRender={recordApplicationCommit}>
            {application}
          </React.Profiler>
        ) : (
          application
        )}
      </BrowserRouter>
    </React.StrictMode>
  );
}

if (import.meta.env.PROD && import.meta.env.MODE !== "performance") {
  // Tie a possible browser permission prompt to an actual interaction.
  const requestStorage = () => {
    window.removeEventListener("pointerdown", requestStorage, true);
    window.removeEventListener("keydown", requestStorage, true);
    void requestPersistentStorage();
  };
  window.addEventListener("pointerdown", requestStorage, { once: true, capture: true });
  window.addEventListener("keydown", requestStorage, { once: true, capture: true });
}

startPwaStartup({
  isDevelopment: import.meta.env.DEV,
  serviceWorkerSupported: "serviceWorker" in navigator,
  registerServiceWorker: registerSW,
  hasController: () => Boolean(navigator.serviceWorker.controller),
  renderApp,
  renderLoading: () => root.render(<SplashScreen label="Loading…" />),
  renderUpdating: () => root.render(<SplashScreen label="Updating…" />),
  storage: sessionStorage,
  schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
  markUpdateStalled,
  markPostUpgrade,
  mark: (event) => {
    markApplicationPerformance(event);
    recordAccountDiagnostic(event);
  },
  reloadPage: () => window.location.reload(),
});
