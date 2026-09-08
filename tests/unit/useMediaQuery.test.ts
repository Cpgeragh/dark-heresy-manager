import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DESKTOP_LAYOUT_QUERY, useMediaQuery } from "../../src/hooks/useMediaQuery";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("useMediaQuery", () => {
  it("reads the initial layout and follows breakpoint changes", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    window.matchMedia = (query: string) =>
      ({
        get matches() {
          return matches;
        },
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
          listeners.add(listener as () => void);
        },
        removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
          listeners.delete(listener as () => void);
        },
        dispatchEvent: () => true,
      }) as MediaQueryList;

    const { result, unmount } = renderHook(() => useMediaQuery(DESKTOP_LAYOUT_QUERY));
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(true);

    unmount();
    expect(listeners.size).toBe(0);
  });
});
