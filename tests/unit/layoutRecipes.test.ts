import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  uiChipRow,
  uiFieldGrid,
  uiInlineRow,
  uiSplitRow,
  uiStackBody,
  uiStackField,
  uiStackList,
  uiStackPage,
  uiStackSection,
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

  it("leaves no hand-written copy in the source", () => {
    const recipes = [
      ["flex", "flex-wrap", "gap-1.5"],
      ["flex", "items-center", "gap-2"],
      ["grid", "grid-cols-1", "gap-3", "sm:grid-cols-2"],
    ];
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "editableStyles.ts"))) continue;
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

  it("defines the standard stack gaps", () => {
    expect(uiStackPage).toBe("space-y-6");
    expect(uiStackBody).toBe("space-y-4");
    expect(uiStackSection).toBe("space-y-3");
    expect(uiStackList).toBe("space-y-2");
    expect(uiStackField).toBe("space-y-1");
  });

  it("leaves no hand-typed stack gap in the source", () => {
    const stackGap = /(?<![\w-])(?:(?:sm|md|lg|xl):)?space-y-(?!0\b)[\d.]+/;
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "editableStyles.ts"))) continue;
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
        if (stackGap.test(line)) offenders.push(`${file}:${index + 1}`);
      });
    }

    expect(offenders).toEqual([]);
  });

  it("keeps application layer classes in layerStyles.ts", () => {
    const layer = /(?<![\w-])(?:(?:sm|md|lg|xl):)?z-(?:\d+|\[[^\]]+\]|auto)(?![\w-])/;
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "layerStyles.ts"))) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (layer.test(line)) offenders.push(`${file}:${index + 1}`);
        });
    }

    expect(offenders).toEqual([]);
  });

  it("keeps focus ring, press scale and disabled opacity in the style files", () => {
    const state =
      /(?<![\w-])(?:focus-visible:ring-(?!inset)|focus:ring-|active:scale-|disabled:opacity-)/;
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.includes(join("ui", "styles"))) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (state.test(line)) offenders.push(`${file}:${index + 1}`);
        });
    }

    expect(offenders).toEqual([]);
  });

  it("keeps the drawer backdrop in DrawerBackdrop.tsx", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "DrawerBackdrop.tsx"))) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (line.includes("fixed inset-0") && line.includes("backdrop-blur")) {
            offenders.push(`${file}:${index + 1}`);
          }
        });
    }

    expect(offenders).toEqual([]);
  });
});
