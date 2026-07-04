import { useCallback, useEffect, useRef, useState } from "react";

type TransitionState = "idle" | "sliding";

/**
 * Drives a swipeable, tab-switched group of panels (e.g. mobile "swipe between
 * Trauma/Disorders" or "Malignancies/Minor Mutations/Major Mutations" cards).
 *
 * Claims the gesture properly via `preventDefault` once a drag is recognised
 * as horizontal, instead of only comparing touch start/end position — that
 * matters because otherwise the browser/OS's own edge-swipe navigation
 * competes for the same touch the whole time and can win. Also ignores
 * touches that start on a button/link, and only reacts within the
 * container's own vertical bounds so it doesn't steal touches meant for
 * page chrome above or below it.
 */
export function useSwipeableTabs<T extends string>(
  groups: readonly T[],
  activeGroup: T,
  onChange: (next: T) => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transition, setTransition] = useState<TransitionState>("idle");

  const switchTo = useCallback(
    (next: T) => {
      if (next === activeGroup) return;
      setTransition("sliding");
      window.setTimeout(() => setTransition("idle"), 180);
      onChange(next);
    },
    [activeGroup, onChange]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let startX = NaN;
    let startY = 0;
    let isHorizontal: boolean | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, [role='button']")) {
        startX = NaN;
        isHorizontal = null;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      const rect = element.getBoundingClientRect();
      if (touch.clientY < rect.top || touch.clientY > rect.bottom) {
        startX = NaN;
        return;
      }
      startX = touch.clientX;
      startY = touch.clientY;
      isHorizontal = null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isNaN(startX)) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (isHorizontal === null) {
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;
        isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      }
      if (isHorizontal) event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      const wasHorizontal = isHorizontal;
      const start = startX;
      startX = NaN;
      isHorizontal = null;
      if (isNaN(start) || !wasHorizontal) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - start;
      if (Math.abs(deltaX) < 50) return;

      const currentIndex = groups.indexOf(activeGroup);
      const direction = deltaX < 0 ? 1 : -1;
      const nextIndex = (currentIndex + direction + groups.length) % groups.length;
      switchTo(groups[nextIndex]);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [groups, activeGroup, switchTo]);

  return { containerRef, transition, switchTo };
}
