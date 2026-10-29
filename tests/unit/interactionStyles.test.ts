import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  uiCardOverlayLinkFeedback,
  uiDismissButton,
  uiDisabledControl,
  uiDisabledLook,
  uiFieldButtonFeedback,
  uiFocusRing,
  uiFocusRingInset,
  uiFocusWithinRing,
  uiHoverSurface,
  uiInfoButton,
  uiOpacityHover,
  uiPressFeedback,
  uiStepButtonColour,
  uiTextButton,
} from "../../src/ui/styles/buttonStyles";
import {
  colourEnabledHoverSlateSurface,
  colourHoverSurface,
  colourOverlayHoverSurface,
} from "../../src/ui/styles/colourTokens";

const tailwindConfig = createRequire(import.meta.url)("../../tailwind.config.cjs");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("shared interaction states", () => {
  it("defines one press, hover, focus and disabled treatment", () => {
    expect(uiPressFeedback()).toBe("active:scale-press motion-reduce:active:scale-100");
    expect(uiPressFeedback(false)).toBe("");
    expect(uiHoverSurface).toBe("hover:bg-slate-800");
    expect(uiFocusRing).toBe("focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500");
    expect(uiFocusWithinRing).toBe(
      "focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500"
    );
    expect(uiDisabledControl).toBe("disabled:cursor-not-allowed disabled:opacity-50");
    expect(uiDisabledLook).toBe("cursor-not-allowed opacity-50");
  });

  it("defines the press scale once in the Tailwind theme and uses it for cards and controls", () => {
    expect(tailwindConfig.theme.extend.scale.press).toBe("0.98");
    expect(uiCardOverlayLinkFeedback).toContain("has-[a:active]:scale-press");
    expect(uiCardOverlayLinkFeedback).not.toContain("0.98");
  });

  it("draws the inset focus ring from the standard ring", () => {
    expect(uiFocusRingInset).toBe(`${uiFocusRing} focus-visible:ring-inset`);
  });

  it("gives the card overlay the same hover fill as other controls", () => {
    expect(colourOverlayHoverSurface.replace("has-[a:hover]:", "")).toBe(
      colourHoverSurface.replace("hover:", "")
    );
  });

  it("fades every shared control state and gives field buttons their hover and press", () => {
    for (const token of [uiDismissButton, uiInfoButton, uiStepButtonColour, uiTextButton]) {
      expect(token.split(" ")).toContain("transition");
    }
    expect(uiOpacityHover).toBe("hover:opacity-80");
    expect(uiFieldButtonFeedback(true)).toBe(
      `${colourEnabledHoverSlateSurface} ${uiPressFeedback()}`
    );
    expect(uiFieldButtonFeedback(false)).toBe("");
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
