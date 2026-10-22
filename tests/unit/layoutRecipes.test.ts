import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";
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
  it("keeps owned entries on the shared owned entry row", () => {
    const skillRow = readFileSync(
      join(__dirname, "../../src/pages/CharacterSheet/SkillsTab/SkillRow.tsx"),
      "utf8"
    );
    const talentEntries = readFileSync(
      join(__dirname, "../../src/mechanics/talents/TalentEntryCards.tsx"),
      "utf8"
    );
    const corruptionEntries = readFileSync(
      join(__dirname, "../../src/mechanics/corruption/CorruptionEntryRow.tsx"),
      "utf8"
    );
    const insanityEntries = readFileSync(
      join(__dirname, "../../src/mechanics/insanity/InsanityEntryLists.tsx"),
      "utf8"
    );

    expect(skillRow).toContain("<OwnedEntryRow");
    expect(talentEntries).toContain("<OwnedEntryRow");
    expect(corruptionEntries).toContain("<OwnedEntryRow");
    expect(insanityEntries).toContain("<OwnedEntryRow");

    for (const file of [
      "src/pages/CharacterSheet/GearTab/ItemRow.tsx",
      "src/pages/CharacterSheet/GearTab/ConsumableRow.tsx",
      "src/pages/CharacterSheet/DrugsTab/DrugRow.tsx",
      "src/pages/CharacterSheet/CyberneticsTab/ImplantRow.tsx",
      "src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow.tsx",
      "src/pages/CharacterSheet/ArmourTab/PieceRow.tsx",
      "src/pages/CharacterSheet/ArmourTab/ForceFieldRow.tsx",
      "src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow.tsx",
      "src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow.tsx",
      "src/pages/CharacterSheet/ArcheotechTab/ItemCard.tsx",
    ]) {
      expect(readFileSync(join(__dirname, "../..", file), "utf8")).toContain("<OwnedEntryRow");
    }
    expect(skillRow).not.toContain('"px-3 lg:px-4 py-2.5 lg:py-3"');
    expect(talentEntries).not.toContain('uiSection + " flex items-start justify-between');
  });

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
      ["flex", "items-center", "justify-between", "gap-2"],
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

  it("keeps small chips inside nested item content", () => {
    const directSmallChipOffenders: string[] = [];
    const nestedChipOffenders: string[] = [];
    const chipComponents = new Set(["Chip", "ItemMetaChips", "StatChip", "DamageTypeChip"]);
    const nestedChipComponents = new Set(["NestedChip", "NestedItemMetaChips", "NestedStatChip"]);
    const nestedChipFiles = [
      "src/pages/CharacterSheet/ArmourTab/ArmourUpgradePicker.tsx",
      "src/pages/CharacterSheet/weapons/AmmoEntryRow.tsx",
      "src/pages/CharacterSheet/weapons/MeleeCard.tsx",
      "src/pages/CharacterSheet/weapons/RangedCard.tsx",
      "src/pages/CharacterSheet/weapons/weaponShared.tsx",
      "src/ui/buttons/StateToggleButton.tsx",
    ];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (!file.endsWith(".tsx")) continue;
      const normalisedFile = file.replaceAll("\\", "/");
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      function inspect(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tagName = node.tagName.getText(source);
          const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
          if (chipComponents.has(tagName) && !normalisedFile.endsWith("src/ui/chips/Chip.tsx")) {
            const hasSmallSize = node.attributes.properties.some(
              (attribute) =>
                ts.isJsxAttribute(attribute) &&
                ts.isIdentifier(attribute.name) &&
                attribute.name.text === "size" &&
                attribute.initializer !== undefined &&
                ts.isStringLiteral(attribute.initializer) &&
                attribute.initializer.text === "sm"
            );
            if (hasSmallSize) directSmallChipOffenders.push(`${file}:${line} ${tagName}`);
          }
          if (
            nestedChipComponents.has(tagName) &&
            !nestedChipFiles.some((allowedFile) => normalisedFile.endsWith(allowedFile))
          ) {
            nestedChipOffenders.push(`${file}:${line} ${tagName}`);
          }
        }
        ts.forEachChild(node, inspect);
      }

      inspect(source);
    }

    expect(directSmallChipOffenders).toEqual([]);
    expect(nestedChipOffenders).toEqual([]);
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

  it("keeps the table look in tableStyles.ts", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (file.endsWith(join("ui", "styles", "tableStyles.ts"))) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (line.includes("border-collapse")) offenders.push(`${file}:${index + 1}`);
          if (line.includes("<table") && !line.includes("uiTable")) {
            offenders.push(`${file}:${index + 1}`);
          }
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
