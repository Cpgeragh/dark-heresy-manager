// tests/firestore/setup.ts
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";

let testEnv: RulesTestEnvironment | null = null;

export async function getTestEnv(): Promise<RulesTestEnvironment> {
  if (!testEnv) {
    const rulesPath = resolve(process.cwd(), "firestore.rules");
    const rules = readFileSync(rulesPath, "utf8");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        testEnv = await initializeTestEnvironment({
          projectId: "dh-test",
          firestore: { rules, host: "127.0.0.1", port: 8080 },
        });
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  return testEnv!;
}

// NO global cleanup - it overwhelms the emulator