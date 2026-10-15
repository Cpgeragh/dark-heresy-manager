import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { uiCell, uiSectionShell } from "../../src/ui/styles/editableStyles";
import { fieldColourClass } from "../../src/ui/styles/fieldStyles";
import { uiCorner, uiCornerSmall } from "../../src/ui/styles/shapeStyles";

const SRC = join(process.cwd(), "src");
const SHAPE_FILE = join(SRC, "ui", "styles", "shapeStyles.ts");
const HAND_TYPED_CORNER = /(^|\s)rounded(-(none|sm|md|lg|xl|2xl|3xl))?(?=\s|$)/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "data" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

function handTypedCorners(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const found: string[] = [];

  function visit(node: ts.Node) {
    const isLiteralPart =
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node);
    const inImport =
      ts.isStringLiteral(node) &&
      (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent));
    if (isLiteralPart && !inImport && HAND_TYPED_CORNER.test(node.text)) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      found.push(`${relative(SRC, file).split(sep).join("/")}:${line}`);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return found;
}

describe("corner styles", () => {
  it("defines the one corner and the small corner once", () => {
    expect(uiCorner).toBe("rounded-lg");
    expect(uiCornerSmall).toBe("rounded");
  });

  it("gives cards, inner boxes and text boxes the one corner", () => {
    expect(uiSectionShell).toContain(uiCorner);
    expect(uiCell).toContain(uiCorner);
    expect(fieldColourClass({ editable: true })).toContain(uiCorner);
  });

  it("has no hand-typed corner class outside shapeStyles.ts, apart from rounded-full", () => {
    const violations = sourceFiles(SRC)
      .filter((file) => file !== SHAPE_FILE)
      .flatMap(handTypedCorners);

    expect(violations).toEqual([]);
  });
});
