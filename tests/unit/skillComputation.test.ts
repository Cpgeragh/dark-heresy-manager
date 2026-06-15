import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSkillComputation } from "../../src/hooks/useSkillComputation";
import type { Characteristics, SkillEntry } from "../../src/types/Character";
import type { CharField } from "../../src/utils/characterFactory";

const makeGetCharField = (base: number, advances: number) =>
  (_key: keyof Characteristics): CharField => ({ base, advances });

const makeSkill = (
  name: string,
  level: SkillEntry["level"],
  extra: Partial<SkillEntry> = {}
): SkillEntry => ({
  id: name,
  name,
  characteristic: "ag",
  level,
  category: "General",
  advanced: false,
  source: "CR",
  ...extra,
});

describe("useSkillComputation", () => {
  it("computes total for untrained skill", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [makeSkill("Acrobatics", "untrained")],
        getCharField: makeGetCharField(30, 0),
      })
    );
    expect(result.current[0].total).toBe(30);
  });

  it("adds +10 for +10 skill level", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [makeSkill("Acrobatics", "+10")],
        getCharField: makeGetCharField(30, 0),
      })
    );
    expect(result.current[0].total).toBe(40);
  });

  it("adds +20 for +20 skill level", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [makeSkill("Acrobatics", "+20")],
        getCharField: makeGetCharField(30, 0),
      })
    );
    expect(result.current[0].total).toBe(50);
  });

  it("includes characteristic advances in total", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [makeSkill("Acrobatics", "trained")],
        getCharField: makeGetCharField(30, 10),
      })
    );
    expect(result.current[0].total).toBe(40);
  });

  it("applies miscModifier", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [makeSkill("Acrobatics", "trained", { miscModifier: 5 })],
        getCharField: makeGetCharField(30, 0),
      })
    );
    expect(result.current[0].total).toBe(35);
  });

  it("computes half value as floor(total / 2)", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [makeSkill("Acrobatics", "trained")],
        getCharField: makeGetCharField(31, 0),
      })
    );
    expect(result.current[0].half).toBe(15);
  });

  it("handles multiple skills independently", () => {
    const { result } = renderHook(() =>
      useSkillComputation({
        skills: [
          makeSkill("Acrobatics", "trained"),
          makeSkill("Athletics", "+10"),
        ],
        getCharField: makeGetCharField(25, 0),
      })
    );
    expect(result.current[0].total).toBe(25);
    expect(result.current[1].total).toBe(35);
  });
});
