import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");
const typesWithoutAutofill = new Set(['"file"', '"range"', '"checkbox"', '"radio"']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

function readAttribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}=("[^"]*"|\\{[^}]*\\})`));
  return match ? match[1] : null;
}

function readTag(source: string, start: number): string {
  let depth = 0;
  let quote: string | null = null;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (character === quote && source[index - 1] !== "\\") quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth++;
    else if (character === "}") depth--;
    else if (character === ">" && depth === 0 && source[index - 1] !== "=") {
      return source.slice(start, index + 1);
    }
  }
  return source.slice(start);
}

function inputsMissingAutofillOff(): string[] {
  const missing: string[] = [];
  for (const file of sourceFiles(sourceRoot)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/<(input|textarea)\b/g)) {
      const tag = readTag(source, match.index);
      const type = match[1] === "textarea" ? null : readAttribute(tag, "type");
      if (type && typesWithoutAutofill.has(type)) continue;
      if (readAttribute(tag, "autoComplete") === '"off"') continue;
      const line = source.slice(0, match.index).split("\n").length;
      missing.push(`${relative(process.cwd(), file).split(sep).join("/")}:${line}`);
    }
  }
  return missing;
}

describe("input autofill", () => {
  it("turns autofill off on every text style input and textarea", () => {
    expect(inputsMissingAutofillOff()).toEqual([]);
  });
});
