import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSkillSorting } from "../../src/hooks/useSkillSorting";
import type { SkillWithComputed } from "../../src/hooks/useSkillComputation";

const makeSkill = (
  name: string,
  characteristic: SkillWithComputed["characteristic"],
  total: number,
  category: string = "General"
): SkillWithComputed => ({
  id: name,
  name,
  characteristic,
  level: "trained",
  category,
  advanced: false,
  source: "CR",
  total,
  half: Math.floor(total / 2),
  full: total,
  opposed: total,
});

const skills: SkillWithComputed[] = [
  makeSkill("Stealth", "ag", 45, "Combat"),
  makeSkill("Acrobatics", "ag", 30, "Athletic"),
  makeSkill("Intimidate", "s", 50, "Combat"),
  makeSkill("Logic", "int", 35, "Academic"),
];

describe("useSkillSorting", () => {
  it("sorts by name alphabetically", () => {
    const { result } = renderHook(() =>
      useSkillSorting({ skills, sortMode: "name" })
    );
    const names = result.current.map((s) => s.name);
    expect(names).toEqual(["Acrobatics", "Intimidate", "Logic", "Stealth"]);
  });

  it("sorts by total descending", () => {
    const { result } = renderHook(() =>
      useSkillSorting({ skills, sortMode: "total" })
    );
    const totals = result.current.map((s) => s.total);
    expect(totals).toEqual([50, 45, 35, 30]);
  });

  it("sorts by characteristic in GROUP_ORDER, then name within group", () => {
    const { result } = renderHook(() =>
      useSkillSorting({ skills, sortMode: "characteristic" })
    );
    const names = result.current.map((s) => s.name);
    // s group: Intimidate; ag group: Acrobatics, Stealth (alphabetical); int group: Logic
    expect(names).toEqual(["Intimidate", "Acrobatics", "Stealth", "Logic"]);
  });

  it("sorts by category alphabetically, then name within category", () => {
    const { result } = renderHook(() =>
      useSkillSorting({ skills, sortMode: "category" })
    );
    const names = result.current.map((s) => s.name);
    // Academic: Logic; Athletic: Acrobatics; Combat: Intimidate, Stealth
    expect(names).toEqual(["Logic", "Acrobatics", "Intimidate", "Stealth"]);
  });

  it("does not mutate the original array", () => {
    const original = [...skills];
    renderHook(() => useSkillSorting({ skills, sortMode: "name" }));
    expect(skills.map((s) => s.name)).toEqual(original.map((s) => s.name));
  });

  it("handles skills with no category in category sort", () => {
    const noCategory = [
      makeSkill("Zeal", "wp", 30),
      makeSkill("Awareness", "per", 40),
    ];
    const { result } = renderHook(() =>
      useSkillSorting({ skills: noCategory, sortMode: "category" })
    );
    const names = result.current.map((s) => s.name);
    expect(names).toEqual(["Awareness", "Zeal"]);
  });
});
