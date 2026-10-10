import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  uiDescriptionBox,
  uiTextBody,
  uiTextDescription,
  uiTextMeta,
  uiThresholdValue,
} from "../../src/ui/styles/editableStyles";
import {
  colourAmberPlain,
  colourMetadataLabelText,
  colourTextPrimary,
} from "../../src/ui/styles/colourTokens";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("shared text recipes", () => {
  it("builds the description paragraph from the body text colour", () => {
    expect(uiTextDescription).toBe(`text-sm lg:text-base ${uiTextBody} leading-relaxed`);
  });

  it("builds the description box from the body text colour", () => {
    expect(uiDescriptionBox).toContain(uiTextBody);
    expect(uiDescriptionBox).toContain("bg-slate-800/60");
  });

  it("builds the metadata line from the metadata sky blue", () => {
    expect(uiTextMeta).toBe(`text-xs lg:text-sm ${colourMetadataLabelText}`);
  });

  it("builds the threshold number from the amber text colour", () => {
    expect(uiThresholdValue).toBe(`font-code text-sm lg:text-base font-bold ${colourAmberPlain}`);
  });

  it("keeps the primary text colour in one token", () => {
    expect(colourTextPrimary).toBe("text-slate-200");

    const offenders: string[] = [];
    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "colourTokens.ts"))) continue;
      const text = readFileSync(file, "utf8");
      if (/(^|[^:\w-])text-slate-(100|200)\b/m.test(text)) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it("keeps text colours in tokens, apart from the files other items still own", () => {
    const owned = [
      join("ui", "styles", "colourTokens.ts"),
      join("ui", "styles", "sourceStyles.ts"),
      join("ui", "styles", "craftsmanship.ts"),
      join("ui", "chips"),
      join("ui", "buttons", "Button.tsx"),
      join("pages", "CharacterSheet", "ArmourTab", "index.tsx"),
      join("ui", "icons", "ExpandChevron.tsx"),
      join("ui", "icons", "PickerArrows.tsx"),
      join("ui", "pickers", "PickerModal.tsx"),
    ];
    const handTyped =
      /(^|[^:\w-])text-(slate|gray|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-\d{2,3})?(\/\d+)?(?![\w-])/;
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (owned.some((part) => file.includes(part))) continue;
      const text = readFileSync(file, "utf8");
      if (handTyped.test(text)) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it("keeps backgrounds and borders in tokens, apart from the files other items still own", () => {
    const owned = [
      join("ui", "styles"),
      join("ui", "chips"),
      join("ui", "buttons", "Button.tsx"),
      join("pages", "CharacterSheet", "ArmourTab", "index.tsx"),
      join("pages", "CharacterSheet", "weapons", "ExplosiveMishapsContent.tsx"),
      join("components", "MessageDrawer.tsx"),
      join("components", "SectionDrawer.tsx"),
      join("ui", "pickers", "PickerModal.tsx"),
    ];
    const handTyped =
      /(^|[^:\w-])(bg|border(-[trblxy])?|divide)-(slate|gray|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-\d{2,3})?(\/\d+)?(?![\w-])/;
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (owned.some((part) => file.includes(part))) continue;
      const text = readFileSync(file, "utf8");
      if (handTyped.test(text)) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it("keeps dividers, page backgrounds and popover fills in their tokens", () => {
    const hardTyped = [
      /border-[tblrxy] border-slate-(600|700|800)(\/\d+)?(?![\w/-])/,
      /border-slate-(600|700|800)(\/\d+)? border-[tblrxy](?![\w-])/,
      /(^|[^:\w-])bg-slate-950(?![\w/-])/,
      /bg-slate-900 border-slate-700/,
    ];
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "colourTokens.ts"))) continue;
      const text = readFileSync(file, "utf8");
      for (const pattern of hardTyped) {
        if (pattern.test(text)) offenders.push(`${file}: ${pattern}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("leaves no hand-written copy of these recipes in the source", () => {
    const copies = [
      /text-sm lg:text-base \$\{uiTextBody\} (mt-1 )?leading-relaxed/,
      /text-sm leading-relaxed \$\{uiTextBody\} lg:text-base/,
      /text-xs lg:text-sm \$\{uiTextBody\} bg-slate-800\/60 rounded p-3 lg:p-4 leading-relaxed/,
      /text-xs lg:text-sm \$\{colourMetadataLabelText\}/,
      /text-xs \$\{colourMetadataLabelText\} lg:text-sm/,
      /font-code text-sm lg:text-base font-bold text-amber-400/,
    ];
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "editableStyles.ts"))) continue;
      const text = readFileSync(file, "utf8");
      for (const copy of copies) {
        if (copy.test(text)) offenders.push(`${file}: ${copy}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
