import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  colourDrawerBackdrop,
  colourModalBackdrop,
  colourModalBackdropSuspended,
} from "../../src/ui/styles/colourTokens";
import { uiLayerBackdrop, uiLayerForeground, uiLayerLocal } from "../../src/ui/styles/layerStyles";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("application layers", () => {
  it("defines the three application layers once", () => {
    expect(uiLayerLocal).toBe("z-10");
    expect(uiLayerBackdrop).toBe("z-40");
    expect(uiLayerForeground).toBe("z-50");
  });

  it("leaves no raw z-index utility outside the layer tokens", () => {
    const offenders = sourceFiles(join(__dirname, "../../src")).filter((file) => {
      if (file.endsWith(join("ui", "styles", "layerStyles.ts"))) return false;
      return /\bz-\d+\b/.test(readFileSync(file, "utf8"));
    });

    expect(offenders).toEqual([]);
  });

  it("keeps drawer and modal backdrop colours in colour tokens", () => {
    expect(colourDrawerBackdrop).toBe("bg-black/50");
    expect(colourModalBackdrop).toBe("backdrop:bg-black/70");
    expect(colourModalBackdropSuspended).toBe("backdrop:bg-transparent");

    const offenders = sourceFiles(join(__dirname, "../../src")).filter((file) => {
      if (file.endsWith(join("ui", "styles", "colourTokens.ts"))) return false;
      return /(bg-black\/(50|70)|backdrop:bg-transparent)/.test(readFileSync(file, "utf8"));
    });

    expect(offenders).toEqual([]);
  });
});
