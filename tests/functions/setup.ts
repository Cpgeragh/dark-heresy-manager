// tests/functions/setup.ts
import { initializeApp, deleteApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import type { FirebaseApp } from "firebase/app";
import type { Functions } from "firebase/functions";

let app: FirebaseApp | null = null;
let functions: Functions | null = null;

export function getTestFunctions(): Functions {
  if (!functions) {
    app = initializeApp({ projectId: "dh-test" }, "functions-test");
    functions = getFunctions(app);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
  return functions;
}

export async function teardownTestFunctions(): Promise<void> {
  if (app) {
    await deleteApp(app);
    app = null;
    functions = null;
  }
}
