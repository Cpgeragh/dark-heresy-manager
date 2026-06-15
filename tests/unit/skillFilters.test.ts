import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSkillFiltering } from "../../src/hooks/useSkillFiltering";
import type { SkillWithComputed } from "../../src/hooks/useSkillComputation";

const makeSkill = (name: string, level: SkillWithComputed["level"]): SkillWithComputed => ({
  id: name,
  name,
  characteristic: "ag",
  level,
  category: "General",
  advanced: false,
  source: "CR",
  total: 30,
  half: 15,
  full: 30,
  opposed: 30,
});

const skills = [
  makeSkill("Acrobatics", "trained"),
  makeSkill("Athletics", "+10"),
  makeSkill("Barter", "untrained"),
  makeSkill("Blather", "untrained"),
];

describe("useSkillFiltering", () => {
  it("returns all skills with empty search and showOnlyTrained false", () => {
    const { result } = renderHook(() =>
      useSkillFiltering({ skills, searchQuery: "", showOnlyTrained: false })
    );
    expect(result.current).toHaveLength(4);
  });

  it("filters by search query case-insensitively", () => {
    const { result } = renderHook(() =>
      useSkillFiltering({ skills, searchQuery: "acrob", showOnlyTrained: false })
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe("Acrobatics");
  });

  it("filters out untrained when showOnlyTrained is true", () => {
    const { result } = renderHook(() =>
      useSkillFiltering({ skills, searchQuery: "", showOnlyTrained: true })
    );
    expect(result.current).toHaveLength(2);
    expect(result.current.every((s) => s.level !== "untrained")).toBe(true);
  });

  it("combines search and showOnlyTrained filters", () => {
    const { result } = renderHook(() =>
      useSkillFiltering({ skills, searchQuery: "a", showOnlyTrained: true })
    );
    // "a" matches Acrobatics, Athletics, Barter — only trained/+10 pass
    expect(result.current).toHaveLength(2);
    expect(result.current.map((s) => s.name)).toEqual(["Acrobatics", "Athletics"]);
  });

  it("returns empty array when search matches nothing", () => {
    const { result } = renderHook(() =>
      useSkillFiltering({ skills, searchQuery: "zzz", showOnlyTrained: false })
    );
    expect(result.current).toHaveLength(0);
  });

  it("trims whitespace from search query", () => {
    const { result } = renderHook(() =>
      useSkillFiltering({ skills, searchQuery: "  Acrobatics  ", showOnlyTrained: false })
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe("Acrobatics");
  });
});
