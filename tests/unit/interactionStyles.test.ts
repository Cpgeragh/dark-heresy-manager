import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  uiDisabledControl,
  uiDisabledLook,
  uiFocusRing,
  uiFocusWithinRing,
  uiHoverSurface,
  uiPressFeedback,
} from "../../src/ui/styles/buttonStyles";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("shared interaction states", () => {
  it("defines one press, hover, focus and disabled treatment", () => {
    expect(uiPressFeedback()).toBe("active:scale-[0.98] motion-reduce:active:scale-100");
    expect(uiPressFeedback(false)).toBe("");
    expect(uiHoverSurface).toBe("hover:bg-slate-800");
    expect(uiFocusRing).toBe("focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500");
    expect(uiFocusWithinRing).toBe(
      "focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500"
    );
    expect(uiDisabledControl).toBe("disabled:cursor-not-allowed disabled:opacity-50");
    expect(uiDisabledLook).toBe("cursor-not-allowed opacity-50");
  });

  it("keeps state colours and shared state copies out of call sites", () => {
    const sourceRoot = join(__dirname, "../../src");
    const owners = [
      join("ui", "styles", "buttonStyles.ts"),
      join("ui", "styles", "colourTokens.ts"),
    ];
    const stateColour =
      /(?:hover|focus|focus-visible|focus-within|active|disabled):!?[^\s"'`}]*(?:slate|red|amber|green|emerald|fuchsia|white|black|opacity)/;
    const oldPress = /active:scale-(?:95|\[0\.99\])/;
    const localDisabledLook =
      /(?:opacity-50[^\n]*cursor-not-allowed|cursor-not-allowed[^\n]*opacity-50)/;
    const offenders: string[] = [];

    for (const file of sourceFiles(sourceRoot)) {
      if (owners.some((owner) => file.endsWith(owner))) continue;
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (stateColour.test(line) || oldPress.test(line) || localDisabledLook.test(line)) {
          offenders.push(`${file}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
