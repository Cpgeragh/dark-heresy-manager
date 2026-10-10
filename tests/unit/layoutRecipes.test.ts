import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  uiChipRow,
  uiFieldGrid,
  uiInlineRow,
  uiSplitRow,
} from "../../src/ui/styles/editableStyles";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function hasClass(line: string, className: string) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s"'\\x60])${escaped}(?=$|[\\s"'\\x60])`).test(line);
}

describe("shared layout recipes", () => {
  it("defines the standard row and field layouts", () => {
    expect(uiChipRow).toBe("flex flex-wrap gap-1.5");
    expect(uiInlineRow).toBe("flex items-center gap-2");
    expect(uiSplitRow).toBe("flex items-center justify-between gap-2");
    expect(uiFieldGrid).toBe("grid grid-cols-1 gap-3 sm:grid-cols-2");
  });

  it("leaves no hand-written copy outside the later drawer item", () => {
    const recipes = [
      ["flex", "flex-wrap", "gap-1.5"],
      ["flex", "items-center", "gap-2"],
      ["grid", "grid-cols-1", "gap-3", "sm:grid-cols-2"],
    ];
    const exceptions = [join("components", "SectionDrawer.tsx")];
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "editableStyles.ts"))) continue;
      if (exceptions.some((exception) => file.endsWith(exception))) continue;
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (
          line.includes("className") &&
          recipes.some((recipe) => recipe.every((className) => hasClass(line, className)))
        ) {
          offenders.push(`${file}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
