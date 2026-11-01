import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  uiChipRow,
  uiInlineRow,
  uiInputRowGrid,
  uiOptionGrid,
  uiSectionColumns,
  uiSplitRow,
  uiSplitRowTop,
  uiStackBody,
  uiStackField,
  uiStackList,
  uiStackPage,
  uiStackSection,
  uiStatGrid,
  uiSummaryGrid,
  uiTwoColumnGrid,
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

  it("keeps every expandable card on the shared accordion card", () => {
    const overlayAllowed = [
      "src/ui/AccordionCard.tsx",
      "src/pages/CharacterSheet/SkillsTab/SkillRow.tsx",
      "src/pages/CharacterSheet/NotesTab.tsx",
      "src/pages/CampaignOverview/SessionCard.tsx",
      "src/components/chat/ChatInboxRow.tsx",
    ];
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      const path = file.replace(/\\/g, "/");
      const text = readFileSync(file, "utf8");
      const importsOverlay = /import \{[^}]*\bCardOverlayButton\b[^}]*\} from/.test(text);
      const importsExpandButton = /import \{[^}]*\bExpandButton\b[^}]*\} from/.test(text);
      if (importsOverlay && !overlayAllowed.some((allowed) => path.endsWith(allowed))) {
        offenders.push(path);
      }
      if (importsExpandButton && !path.endsWith("src/ui/AccordionCard.tsx")) {
        offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps every picker row on the shared row name", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(__dirname, "../../src"))) {
      if (!file.endsWith(".tsx")) continue;
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      function containsRowName(node: ts.Node): boolean {
        let found = false;
        function look(child: ts.Node) {
          if (
            (ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) &&
            child.tagName.getText(source) === "PickerRowName"
          ) {
            found = true;
          }
          if (!found) ts.forEachChild(child, look);
        }
        look(node);
        return found;
      }

      function inspect(node: ts.Node) {
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "PickerRow") {
          offenders.push(`${file}:${line}`);
        }
        if (
          ts.isJsxElement(node) &&
          node.openingElement.tagName.getText(source) === "PickerRow" &&
          !containsRowName(node)
        ) {
          offenders.push(`${file}:${line}`);
        }
        ts.forEachChild(node, inspect);
      }

      inspect(source);
    }

    expect(offenders).toEqual([]);
  });

  it("defines the standard row and field layouts", () => {
    expect(uiChipRow).toBe("flex flex-wrap gap-1.5");
    expect(uiInlineRow).toBe("flex items-center gap-2");
    expect(uiSplitRow).toBe("flex items-center justify-between gap-2");
    expect(uiSplitRowTop).toBe("flex items-start justify-between gap-2");
    expect(uiTwoColumnGrid).toBe("grid grid-cols-2 gap-2");
    expect(uiSummaryGrid).toBe("grid gap-3");
    expect(uiOptionGrid).toBe("grid gap-1.5");
    expect(uiInputRowGrid).toBe("grid grid-cols-3 gap-2");
    expect(uiStatGrid).toBe("grid gap-1");
    expect(uiSectionColumns).toBe("gap-6 items-start");
  });

  it("leaves no hand-written copy in the source", () => {
    const recipes = [
      ["flex", "flex-wrap", "gap-1.5"],
      ["flex", "items-center", "gap-2"],
      ["flex", "items-center", "justify-between"],
      ["flex", "items-start", "justify-between"],
      ["grid", "grid-cols-2", "gap-2"],
      ["grid", "grid-cols-3", "gap-2"],
      ["grid", "grid-cols-2", "gap-3"],
      ["grid", "grid-cols-3", "gap-3"],
      ["grid", "gap-1.5"],
      ["grid", "gap-1"],
      ["gap-6", "items-start"],
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

describe("shared entry lines", () => {
  const root = join(__dirname, "../..");
  const read = (file: string) => readFileSync(join(root, file), "utf8");
  const relative = (file: string) => file.slice(root.length + 1).replaceAll("\\", "/");
  const sourceOf = (rule: (text: string) => boolean, skip: string[] = []) =>
    sourceFiles(join(root, "src"))
      .filter((file) => !skip.includes(relative(file)) && rule(readFileSync(file, "utf8")))
      .map(relative);

  const ownedEntryFiles = [
    "src/pages/CharacterSheet/SkillsTab/SkillRow.tsx",
    "src/mechanics/talents/TalentEntryCards.tsx",
    "src/mechanics/corruption/CorruptionEntryRow.tsx",
    "src/mechanics/insanity/InsanityEntryLists.tsx",
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
  ];
  const cardFiles = [
    "src/pages/CharacterSheet/weapons/RangedCard.tsx",
    "src/pages/CharacterSheet/weapons/MeleeCard.tsx",
    "src/pages/CharacterSheet/weapons/GrenadeCard.tsx",
    "src/pages/CharacterSheet/weapons/ShieldCard.tsx",
    "src/pages/CharacterSheet/weapons/ArcheotechWeaponCard.tsx",
    "src/pages/CharacterSheet/weapons/ArcheotechShieldRow.tsx",
    "src/pages/CharacterSheet/weapons/CyberneticWeaponCard.tsx",
    "src/pages/CharacterSheet/PsychicTab/PowerCard.tsx",
    "src/pages/CharacterSheet/CompanionsTab.tsx",
  ];

  it("draws the ordered entry labels only through EntryLines", () => {
    const pattern =
      /<EntryDetailLine\s+label="(Craftsmanship|Duration|Qualities|Rules|Mishaps|Gained from|Talent effects|Notes)"/;
    expect(
      sourceOf(
        (text) => pattern.test(text),
        [
          "src/ui/EntryLines.tsx",
          "src/pages/CharacterSheet/weapons/AmmoEntryRow.tsx",
          "src/ui/UpgradeEntryCard.tsx",
          "src/ui/pickers/PickerRowParts.tsx",
        ]
      )
    ).toEqual([]);
  });

  it("writes no entry label by hand", () => {
    const pattern =
      /<span className=\{uiTextLabel\}>(Craftsmanship|Duration|Qualities|Rules|Mishaps|Gained [Ff]rom|Talent effects|Notes|Linked|Spare Cells|Clips|Rounds|Quantity|Qty)</;
    expect(sourceOf((text) => pattern.test(text), ["src/ui/EntryQuantityRow.tsx"])).toEqual([]);
  });

  it("writes no heading in an information window by hand", () => {
    const pattern = /<p className=\{(`\$\{)?(uiRuleName|uiTextLabel)/;
    expect(sourceOf((text) => pattern.test(text), ["src/ui/InfoSection.tsx"])).toEqual([]);
  });

  it("keeps accordions out of the owned entry row files", () => {
    const offenders = ownedEntryFiles.filter(
      (file) => !file.endsWith("TalentEntryCards.tsx") && read(file).includes("AccordionCard")
    );
    expect(offenders).toEqual([]);
  });

  it("gives every owned entry row a Notes line", () => {
    const missing = ownedEntryFiles.filter((file) => !read(file).includes("entryNotesLine("));
    expect(missing).toEqual([]);
  });

  it("draws the labelled lines of every card through EntryLines", () => {
    const missing = cardFiles.filter((file) => !read(file).includes("<EntryLines"));
    expect(missing).toEqual([]);
  });

  it("keeps one character's personal note out of every reusable definition", () => {
    const mismatched = sourceOf(
      (text) =>
        (text.match(/function toCustom\w*Data\(/g) ?? []).length !==
        (text.match(/personalNotes: _personalNotes/g) ?? []).length
    );
    expect(mismatched).toEqual([]);
    const total = sourceFiles(join(root, "src")).reduce(
      (sum, file) =>
        sum + (readFileSync(file, "utf8").match(/function toCustom\w*Data\(/g) ?? []).length,
      0
    );
    expect(total).toBe(11);
  });

  it("keeps the note when a custom definition is rebuilt", () => {
    const missing = [
      "src/pages/CharacterSheet/GearTab/index.tsx",
      "src/pages/CharacterSheet/DrugsTab/index.tsx",
      "src/pages/CharacterSheet/CyberneticsTab/index.tsx",
      "src/pages/CharacterSheet/ArmourTab/index.tsx",
      "src/pages/CharacterSheet/ArcheotechTab/index.tsx",
      "src/pages/CharacterSheet/PsychicTab/index.tsx",
    ].filter((file) => !read(file).includes("keepPersonalNotes("));
    expect(missing).toEqual([]);
  });
});
