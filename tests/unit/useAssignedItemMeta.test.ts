import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAssignedItemMeta } from "../../src/hooks/useAssignedItemMeta";

describe("useAssignedItemMeta", () => {
  it("rejects invalid costs and permits zero when rarity is optional", () => {
    const { result } = renderHook(() => useAssignedItemMeta({ requiresRarity: false }));

    act(() => result.current.setGmCost("-1"));
    expect(result.current.costValid).toBe(false);
    expect(result.current.canConfirm).toBe(false);

    act(() => result.current.setGmCost("1.5"));
    expect(result.current.costValid).toBe(false);

    act(() => result.current.setGmCost("0"));
    expect(result.current.costValid).toBe(true);
    expect(result.current.canConfirm).toBe(true);
  });

  it("does not require a cost when configured, but still requires rarity if asked for", () => {
    const { result } = renderHook(() =>
      useAssignedItemMeta({ requiresCost: false, requiresRarity: true })
    );

    expect(result.current.costValid).toBe(true);
    expect(result.current.canConfirm).toBe(false);

    act(() => result.current.setGmRarity("Rare"));
    expect(result.current.canConfirm).toBe(true);
  });

  it("requires rarity when configured and resets every field", () => {
    const { result } = renderHook(() => useAssignedItemMeta({ requiresRarity: true }));

    act(() => {
      result.current.setGmCost("100");
      result.current.setShowRarityPicker(true);
    });
    expect(result.current.canConfirm).toBe(false);

    act(() => result.current.setGmRarity("Rare"));
    expect(result.current.canConfirm).toBe(true);

    act(() => result.current.resetAssignedItemMeta());
    expect(result.current.gmCost).toBe("");
    expect(result.current.gmRarity).toBe("");
    expect(result.current.showRarityPicker).toBe(false);
    expect(result.current.canConfirm).toBe(false);
  });
});
