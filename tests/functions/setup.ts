// tests/functions/setup.ts
import { initializeApp, deleteApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Functions } from "firebase/functions";
import type { Auth } from "firebase/auth";

let app: FirebaseApp | null = null;
let functions: Functions | null = null;
let auth: Auth | null = null;

function ensureApp(): FirebaseApp {
  if (!app) {
    app = initializeApp({ projectId: "dh-test", apiKey: "test-api-key" }, "functions-test");
  }
  return app;
}

export function getTestFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(ensureApp());
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
  return functions;
}

export function getTestAuth(): Auth {
  if (!auth) {
    auth = getAuth(ensureApp());
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}

export async function signInTestUser(): Promise<string> {
  const credential = await signInAnonymously(getTestAuth());
  return credential.user.uid;
}

export async function teardownTestFunctions(): Promise<void> {
  if (app) {
    await deleteApp(app);
    app = null;
    functions = null;
    auth = null;
  }
}
