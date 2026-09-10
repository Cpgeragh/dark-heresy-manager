import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { markApplicationPerformance } from "./performance/performanceMetrics";

const PERFORMANCE_PROJECT_ID = "dh-test";
const isPerformanceMode = import.meta.env.MODE === "performance";

const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(
      `Missing Firebase config value "${key}". Check your .env file matches .env.example.`
    );
  }
}

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
};

if (isPerformanceMode && firebaseConfig.projectId !== PERFORMANCE_PROJECT_ID) {
  throw new Error(
    `Performance mode may only use the local Firebase project "${PERFORMANCE_PROJECT_ID}".`
  );
}

const app = initializeApp(firebaseConfig);

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (
  requiredEnvVars.VITE_FIREBASE_PROJECT_ID === "dark-heresy-manager-staging" &&
  !recaptchaSiteKey
) {
  throw new Error('Missing Firebase config value "VITE_RECAPTCHA_SITE_KEY" for staging App Check.');
}
if (recaptchaSiteKey && !isPerformanceMode) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const auth = getAuth(app);
export const functions = getFunctions(app, "europe-west2");

if (isPerformanceMode) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);

  const installNetworkControl = (
    id: string,
    action: () => Promise<void>,
    state: string,
    right: number
  ) => {
    if (typeof document === "undefined") return;
    if (document.getElementById(id)) return;
    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.tabIndex = -1;
    button.setAttribute("aria-hidden", "true");
    button.style.cssText = `position:fixed;right:${right}px;bottom:0;width:2px;height:2px;opacity:.01;z-index:2147483647;padding:0;border:0`;
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        await action();
        document.documentElement.dataset.dhmPerformanceFirestoreNetwork = state;
        markApplicationPerformance(`firestore-network:${state}`);
      } catch {
        document.documentElement.dataset.dhmPerformanceFirestoreNetwork = "error";
        markApplicationPerformance("firestore-network:error");
      }
    });
    document.documentElement.append(button);
  };

  installNetworkControl(
    "dhm-performance-firestore-disable",
    () => disableNetwork(db),
    "disabled",
    6
  );
  installNetworkControl("dhm-performance-firestore-enable", () => enableNetwork(db), "enabled", 9);
}
