import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { colourIconMuted } from "../../src/ui/styles/colourTokens";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) ? [path] : [];
  });
}

describe("shared icons", () => {
  it("keeps inline SVG pictures inside the shared icon directory", () => {
    const sourceRoot = join(__dirname, "../../src");
    const iconRoot = join("ui", "icons");
    const offenders = sourceFiles(sourceRoot).filter((file) => {
      if (file.includes(iconRoot)) return false;
      return /<svg\b/.test(readFileSync(file, "utf8"));
    });

    expect(offenders).toEqual([]);
  });

  it("keeps audited interface glyphs out of call sites", () => {
    const sourceRoot = join(__dirname, "../../src");
    const iconRoot = join("ui", "icons");
    const glyph = /[☰⚠✓ℹ📋❤✦⚖]|>\s*[+−×!]\s*</u;
    const offenders = sourceFiles(sourceRoot).filter((file) => {
      if (file.includes(iconRoot)) return false;
      return glyph.test(readFileSync(file, "utf8"));
    });

    expect(offenders).toEqual([]);
  });

  it("uses the muted icon colour token for directional icons", () => {
    expect(colourIconMuted).toBe("text-slate-400");

    for (const file of ["ExpandChevron.tsx", "PickerArrows.tsx"]) {
      const text = readFileSync(join(__dirname, "../../src/ui/icons", file), "utf8");
      expect(text).toContain("colourIconMuted");
      expect(text).not.toContain("text-slate-400");
    }
  });
});
