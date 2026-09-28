// tests/integration/LoadingDots.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoadingDots } from "../../src/ui/LoadingDots";

afterEach(() => {
  vi.useRealTimers();
});

function visibleDotCount(container: HTMLElement): number {
  return container.querySelectorAll("span span:not(.invisible)").length;
}

describe("LoadingDots", () => {
  it("shows at least one dot immediately, before any timer has ticked", () => {
    const { container } = render(<LoadingDots />);
    expect(visibleDotCount(container)).toBe(1);
  });

  it("never shows zero dots at any point in its cycle", () => {
    vi.useFakeTimers();
    const { container } = render(<LoadingDots />);

    for (let tick = 0; tick < 12; tick += 1) {
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(visibleDotCount(container)).toBeGreaterThan(0);
    }
  });

  it("cycles through one, two, then three dots before repeating", () => {
    vi.useFakeTimers();
    const { container } = render(<LoadingDots />);

    expect(visibleDotCount(container)).toBe(1);
    act(() => vi.advanceTimersByTime(300));
    expect(visibleDotCount(container)).toBe(2);
    act(() => vi.advanceTimersByTime(300));
    expect(visibleDotCount(container)).toBe(3);
    act(() => vi.advanceTimersByTime(300));
    expect(visibleDotCount(container)).toBe(1);
  });
});
