import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSkillGroupCollapse } from "../../src/hooks/useSkillGroupCollapse";

describe("useSkillGroupCollapse", () => {
  it("initialises all groups as collapsed", () => {
    const { result } = renderHook(() =>
      useSkillGroupCollapse(["ag", "int", "wp"])
    );
    expect(result.current.collapsed["ag"]).toBe(true);
    expect(result.current.collapsed["int"]).toBe(true);
    expect(result.current.collapsed["wp"]).toBe(true);
  });

  it("toggleGroup expands a collapsed group", () => {
    const { result } = renderHook(() =>
      useSkillGroupCollapse(["ag", "int"])
    );
    act(() => result.current.toggleGroup("ag"));
    expect(result.current.collapsed["ag"]).toBe(false);
    expect(result.current.collapsed["int"]).toBe(true);
  });

  it("toggleGroup collapses an expanded group", () => {
    const { result } = renderHook(() =>
      useSkillGroupCollapse(["ag"])
    );
    act(() => result.current.toggleGroup("ag"));
    act(() => result.current.toggleGroup("ag"));
    expect(result.current.collapsed["ag"]).toBe(true);
  });

  it("setGroupCollapsed sets a group to a specific value", () => {
    const { result } = renderHook(() =>
      useSkillGroupCollapse(["ag", "int"])
    );
    act(() => result.current.setGroupCollapsed("ag", false));
    expect(result.current.collapsed["ag"]).toBe(false);
    act(() => result.current.setGroupCollapsed("ag", true));
    expect(result.current.collapsed["ag"]).toBe(true);
  });

  it("expandAll sets all groups to false", () => {
    const { result } = renderHook(() =>
      useSkillGroupCollapse(["ag", "int", "wp"])
    );
    act(() => result.current.expandAll());
    expect(Object.values(result.current.collapsed).every((v) => v === false)).toBe(true);
  });

  it("collapseAll sets all groups to true", () => {
    const { result } = renderHook(() =>
      useSkillGroupCollapse(["ag", "int", "wp"])
    );
    act(() => result.current.expandAll());
    act(() => result.current.collapseAll());
    expect(Object.values(result.current.collapsed).every((v) => v === true)).toBe(true);
  });

  it("handles empty initial keys", () => {
    const { result } = renderHook(() => useSkillGroupCollapse([]));
    expect(result.current.collapsed).toEqual({});
  });
});
