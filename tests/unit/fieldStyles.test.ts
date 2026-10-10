// tests/unit/fieldStyles.test.ts
import { describe, expect, it } from "vitest";
import { editableInputClass, editableInputColour } from "../../src/ui/styles/editableStyles";

const sizeClasses = ["w-full", "px-2", "py-1", "text-sm", "lg:text-base"];

describe("editableInputColour", () => {
  it("gives the dark fill, grey border and red selected border with no size classes", () => {
    const classes = editableInputColour(true).split(" ");

    expect(classes).toEqual(
      expect.arrayContaining([
        "bg-slate-900",
        "border-slate-500",
        "text-slate-200",
        "focus:border-red-500",
      ])
    );
    for (const sizeClass of sizeClasses) {
      expect(classes).not.toContain(sizeClass);
    }
  });

  it("shows a red border when the value is invalid", () => {
    expect(editableInputColour(true, true).split(" ")).toContain("border-red-500");
  });

  it("shows the not-allowed cursor when read-only", () => {
    expect(editableInputColour(false).split(" ")).toContain("cursor-not-allowed");
  });

  it("is the colour part of the full text box class", () => {
    const full = editableInputClass(true).split(" ");

    expect(full).toEqual(expect.arrayContaining(editableInputColour(true).split(" ")));
    expect(full).toEqual(expect.arrayContaining(sizeClasses));
  });
});
