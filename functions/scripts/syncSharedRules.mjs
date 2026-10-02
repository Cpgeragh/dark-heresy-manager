// Builds the sibling shared-rules package and copies its package.json and dist into
// functions/vendor/shared-rules. The functions dependency on shared-rules points at that
// copy, so it uploads with the functions source. A path outside the functions folder is
// never uploaded, which leaves the deployed container without the package.
//
// When the sibling folder does not exist (the deployed build environment), the uploaded
// copy is used as it is and the script exits without doing anything.
//
// On a fresh checkout, run npm install in shared-rules, then this script, then npm install
// in functions, because the functions install needs the copy to exist.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const functionsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(functionsDir, "..", "shared-rules");
const targetDir = join(functionsDir, "vendor", "shared-rules");

if (!existsSync(join(sourceDir, "package.json"))) {
  process.exit(0);
}

function resolveTsc() {
  for (const base of [functionsDir, sourceDir]) {
    try {
      const require = createRequire(join(base, "package.json"));
      return join(dirname(require.resolve("typescript/package.json")), "bin", "tsc");
    } catch {
      // Not installed under this folder, try the next one.
    }
  }
  throw new Error("typescript is not installed in functions or shared-rules");
}

execFileSync(process.execPath, [resolveTsc(), "-p", sourceDir], { stdio: "inherit" });

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(join(sourceDir, "package.json"), join(targetDir, "package.json"));
cpSync(join(sourceDir, "dist"), join(targetDir, "dist"), { recursive: true });
