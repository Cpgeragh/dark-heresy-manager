import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  colourDivideList,
  colourDivider,
  colourTextPrimary,
} from "../../src/ui/styles/colourTokens";
import { uiTextLabel } from "../../src/ui/styles/editableStyles";
import {
  uiTable,
  uiTableBody,
  uiTableCell,
  uiTableHeaderCell,
  uiTableHeaderRow,
} from "../../src/ui/styles/tableStyles";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) ? [path] : [];
  });
}

describe("shared table styles", () => {
  it("defines one table, heading, divider and cell treatment", () => {
    expect(uiTable).toBe(
      `w-full border-collapse text-left text-sm lg:text-base ${colourTextPrimary}`
    );
    expect(uiTableHeaderRow).toBe(`${uiTextLabel} border-b ${colourDivider}`);
    expect(uiTableBody).toBe(`divide-y ${colourDivideList}`);
    expect(uiTableHeaderCell).toBe("py-1.5 font-medium");
    expect(uiTableCell).toBe("py-2");
  });

  it("keeps table foundations and divider colours out of call sites", () => {
    const tableFiles = sourceFiles(join(__dirname, "../../src")).filter((file) =>
      readFileSync(file, "utf8").includes("<table")
    );
    const offenders: string[] = [];

    for (const file of tableFiles) {
      const text = readFileSync(file, "utf8");
      if (!text.includes("uiTable")) offenders.push(`${file}: table`);
      if (!text.includes("uiTableHeaderRow")) offenders.push(`${file}: heading`);
      if (!text.includes("uiTableBody")) offenders.push(`${file}: body`);
      if (!text.includes("uiTableHeaderCell")) offenders.push(`${file}: heading cell`);
      if (!text.includes("uiTableCell")) offenders.push(`${file}: body cell`);
      if (
        /border-collapse|divide-(?:slate|gray)-|text-(?:white|emerald|slate)-\d{2,3}/.test(text)
      ) {
        offenders.push(`${file}: hard-coded style`);
      }
      if (/uiHoverSurface|hover:/.test(text)) offenders.push(`${file}: passive row hover`);
    }

    expect(offenders).toEqual([]);
  });
});
