import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAssignedItemPick } from "../../src/hooks/useAssignedItemPick";

interface Thing {
  name: string;
  priced: boolean;
}

const needsOf = (thing: Thing) => ({ cost: thing.priced, weight: false, rarity: false });

describe("useAssignedItemPick", () => {
  it("holds the picked item and what it needs until it is cancelled", () => {
    const { result } = renderHook(() => useAssignedItemPick(needsOf));
    expect(result.current.pending).toBeNull();

    act(() => result.current.begin({ name: "Cilice", priced: true }));
    expect(result.current.pending?.name).toBe("Cilice");
    expect(result.current.needs.cost).toBe(true);

    act(() => result.current.meta.setGmCost("500"));
    act(() => result.current.cancel());
    expect(result.current.pending).toBeNull();
    expect(result.current.meta.gmCost).toBe("");
  });

  it("clears the typed values when a new item begins", () => {
    const { result } = renderHook(() => useAssignedItemPick(needsOf));
    act(() => result.current.begin({ name: "One", priced: true }));
    act(() => result.current.meta.setGmCost("75"));
    act(() => result.current.begin({ name: "Two", priced: true }));
    expect(result.current.meta.gmCost).toBe("");
  });

  it("submits only when the values are valid, then closes", async () => {
    const submit = vi.fn();
    const { result } = renderHook(() => useAssignedItemPick(needsOf));
    act(() => result.current.begin({ name: "Cilice", priced: true }));

    await act(() => result.current.confirm(submit));
    expect(submit).not.toHaveBeenCalled();
    expect(result.current.pending).not.toBeNull();

    act(() => result.current.meta.setGmCost("500"));
    await act(() => result.current.confirm(submit));
    expect(submit).toHaveBeenCalledWith({ name: "Cilice", priced: true });
    expect(result.current.pending).toBeNull();
  });

  it("passes the lowest cost to the typed-value check", () => {
    const { result } = renderHook(() =>
      useAssignedItemPick((thing: Thing) => ({ ...needsOf(thing), minimumCost: 20 }))
    );
    act(() => result.current.begin({ name: "Cylinder", priced: true }));
    act(() => result.current.meta.setGmCost("19"));
    expect(result.current.meta.canConfirm).toBe(false);
    act(() => result.current.meta.setGmCost("20"));
    expect(result.current.meta.canConfirm).toBe(true);
  });
});
