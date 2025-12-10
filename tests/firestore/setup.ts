// tests/firestore/setup.ts
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";

let testEnv: RulesTestEnvironment | null = null;

export async function getTestEnv() {
  if (!testEnv) {
    const rulesPath = resolve(process.cwd(), "firestore.rules");
    const rules = readFileSync(rulesPath, "utf8");

    testEnv = await initializeTestEnvironment({
      projectId: "dh-test",
      firestore: {
        rules,
        host: "127.0.0.1",
        port: 8080
      }
    });
  }

  return testEnv;
}

// NO global cleanup - it overwhelms the emulator