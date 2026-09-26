import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { SplashScreen } from "./components/SplashScreen";
import { markUpdateStalled, markPostUpgrade } from "./pwaUpdateState";
import {
  markApplicationPerformance,
  recordApplicationCommit,
} from "./performance/performanceMetrics";
import { startPwaStartup } from "./pwaStartup";
import "./index.css";
import "@fontsource/im-fell-english/400.css";

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
  mark: markApplicationPerformance,
  reloadPage: () => window.location.reload(),
});
