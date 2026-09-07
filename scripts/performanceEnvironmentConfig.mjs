import { readFile } from "node:fs/promises";
import path from "node:path";

export const PERFORMANCE_PROJECT_ID = "dh-test";
export const PERFORMANCE_PORTS = Object.freeze({
  firestore: 8080,
  functions: 5001,
  auth: 9099,
});

const REQUIRED_DESTINATIONS = Object.freeze({
  GCLOUD_PROJECT: PERFORMANCE_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PERFORMANCE_PORTS.firestore}`,
  FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PERFORMANCE_PORTS.auth}`,
});

export async function verifyPerformanceConfiguration(rootDir) {
  const configuration = JSON.parse(await readFile(path.join(rootDir, "firebase.json"), "utf8"));
  for (const [emulator, port] of Object.entries(PERFORMANCE_PORTS)) {
    if (configuration.emulators?.[emulator]?.port !== port) {
      throw new Error(`firebase.json must configure ${emulator} on port ${port}.`);
    }
  }
  if (configuration.emulators?.singleProjectMode !== true) {
    throw new Error("Firebase emulator singleProjectMode must remain enabled.");
  }
}

export function createPerformanceEnvironment(baseEnvironment = process.env, revision = "local") {
  for (const [name, expected] of Object.entries(REQUIRED_DESTINATIONS)) {
    const configured = baseEnvironment[name];
    if (configured && configured !== expected) {
      throw new Error(`${name} must be exactly ${expected}; received ${configured}.`);
    }
  }
  const configuredViteProject = baseEnvironment.VITE_FIREBASE_PROJECT_ID;
  if (configuredViteProject && configuredViteProject !== PERFORMANCE_PROJECT_ID) {
    throw new Error(
      `VITE_FIREBASE_PROJECT_ID must be exactly ${PERFORMANCE_PROJECT_ID}; received ${configuredViteProject}.`
    );
  }

  return {
    ...baseEnvironment,
    VITE_FIREBASE_API_KEY: "performance-local-only",
    VITE_FIREBASE_AUTH_DOMAIN: "dh-test.firebaseapp.com",
    VITE_FIREBASE_PROJECT_ID: PERFORMANCE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: "dh-test.appspot.com",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
    VITE_FIREBASE_APP_ID: `1:000000000000:web:performance-${revision}`,
    VITE_RECAPTCHA_SITE_KEY: "",
    ...REQUIRED_DESTINATIONS,
  };
}
