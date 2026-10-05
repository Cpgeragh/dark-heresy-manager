import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { OPTIMISTIC_SETTLE_MS, useOptimisticOverlay } from "../../src/hooks/useOptimisticOverlay";

interface Sheet {
  id: string;
  weapons: { id: string; equipped: boolean }[];
  gear: string[];
}

const baseSheet: Sheet = {
  id: "char-1",
  weapons: [{ id: "w1", equipped: false }],
  gear: ["rope"],
};

const equipped = [{ id: "w1", equipped: true }];

function setup(initial: Sheet | null = baseSheet) {
  return renderHook(({ server }: { server: Sheet | null }) => useOptimisticOverlay(server), {
    initialProps: { server: initial },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useOptimisticOverlay", () => {
  it("returns the server value untouched when nothing is pending", () => {
    const { result } = setup();
    expect(result.current.value).toBe(baseSheet);
  });

  it("returns null while there is no server value", () => {
    const { result } = setup(null);
    expect(result.current.value).toBeNull();
  });

  it("shows an applied value on top of the server value, leaving other fields alone", () => {
    const { result } = setup();
    act(() => {
      result.current.apply("weapons", equipped);
    });
    expect(result.current.value?.weapons).toEqual(equipped);
    expect(result.current.value?.gear).toBe(baseSheet.gear);
  });

  it("goes back to the server value when the change is reverted", () => {
    const { result } = setup();
    let version = 0;
    act(() => {
      version = result.current.apply("weapons", equipped);
    });
    act(() => {
      result.current.revert("weapons", version);
    });
    expect(result.current.value).toBe(baseSheet);
  });

  it("keeps the applied value after confirm until the server value catches up", () => {
    const { result, rerender } = setup();
    let version = 0;
    act(() => {
      version = result.current.apply("weapons", equipped);
    });
    act(() => {
      result.current.confirm("weapons", version);
    });
    expect(result.current.value?.weapons).toEqual(equipped);

    rerender({ server: { ...baseSheet, weapons: [{ id: "w1", equipped: true }] } });
    expect(result.current.value?.weapons).toEqual(equipped);

    rerender({ server: { ...baseSheet, weapons: [{ id: "w1", equipped: false }] } });
    expect(result.current.value?.weapons).toEqual([{ id: "w1", equipped: false }]);
  });

  it("drops the applied value at once when the server already shows the same value", () => {
    const { result, rerender } = setup();
    let version = 0;
    act(() => {
      version = result.current.apply("weapons", equipped);
    });
    rerender({ server: { ...baseSheet, weapons: [{ id: "w1", equipped: true }] } });
    act(() => {
      result.current.confirm("weapons", version);
    });
    rerender({ server: { ...baseSheet, weapons: [{ id: "w1", equipped: false }] } });
    expect(result.current.value?.weapons).toEqual([{ id: "w1", equipped: false }]);
  });

  it("does not drop a change before it is confirmed, even if the server matches", () => {
    const { result, rerender } = setup();
    act(() => {
      result.current.apply("weapons", equipped);
    });
    rerender({ server: { ...baseSheet, weapons: [{ id: "w1", equipped: true }] } });
    rerender({ server: { ...baseSheet, weapons: [{ id: "w1", equipped: false }] } });
    expect(result.current.value?.weapons).toEqual(equipped);
  });

  it("lets an older failure leave a newer change in place", () => {
    const { result } = setup();
    let first = 0;
    act(() => {
      first = result.current.apply("weapons", equipped);
    });
    const second = [{ id: "w1", equipped: false }];
    act(() => {
      result.current.apply("weapons", second);
    });
    act(() => {
      result.current.revert("weapons", first);
    });
    expect(result.current.value?.weapons).toEqual(second);
  });

  it("removes a confirmed change after the settle time if the server never matches it", () => {
    vi.useFakeTimers();
    const { result } = setup();
    let version = 0;
    act(() => {
      version = result.current.apply("weapons", equipped);
    });
    act(() => {
      result.current.confirm("weapons", version);
    });
    expect(result.current.value?.weapons).toEqual(equipped);

    act(() => {
      vi.advanceTimersByTime(OPTIMISTIC_SETTLE_MS + 1);
    });
    expect(result.current.value).toBe(baseSheet);
  });

  it("tracks different fields independently", () => {
    const { result } = setup();
    let weaponsVersion = 0;
    act(() => {
      weaponsVersion = result.current.apply("weapons", equipped);
      result.current.apply("gear", ["rope", "torch"]);
    });
    act(() => {
      result.current.revert("weapons", weaponsVersion);
    });
    expect(result.current.value?.weapons).toBe(baseSheet.weapons);
    expect(result.current.value?.gear).toEqual(["rope", "torch"]);
  });
});
