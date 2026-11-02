import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function filesMatching(pattern: RegExp, allowed: string[]): string[] {
  return sourceFiles(join(process.cwd(), "src")).filter(
    (file) =>
      pattern.test(readFileSync(file, "utf8")) &&
      !allowed.some((suffix) => file.replaceAll("\\", "/").endsWith(suffix))
  );
}

describe("assigned cost pieces", () => {
  it("calls useAssignedItemMeta only from the shared hooks", () => {
    expect(
      filesMatching(/useAssignedItemMeta\(/, [
        "src/hooks/useAssignedItemMeta.ts",
        "src/hooks/useAssignedItemPick.ts",
      ])
    ).toEqual([]);
  });

  it("draws AssignedItemMetaScreen only from AssignedItemPickScreen", () => {
    expect(
      filesMatching(/<AssignedItemMetaScreen\b/, [
        "src/ui/pickers/AssignedItemMetaScreen.tsx",
        "src/ui/pickers/AssignedItemPickScreen.tsx",
      ])
    ).toEqual([]);
  });
});
