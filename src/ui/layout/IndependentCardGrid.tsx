import { Children, useLayoutEffect, useRef, type ReactNode } from "react";

import { useMediaQuery } from "../../hooks/useMediaQuery";
import { uiStackList } from "../styles/editableStyles";

export function IndependentCardGrid({
  items,
  breakpoint = "sm",
}: {
  items: ReactNode[];
  breakpoint?: "sm" | "lg";
}) {
  const useColumns = useMediaQuery(
    breakpoint === "lg" ? "(min-width: 1024px)" : "(min-width: 640px)"
  );

  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !useColumns) return;
    const cards = Array.from(root.children) as HTMLElement[];
    const layout = () => {
      // Read sizes before writing positions. Expansion only moves the cards
      // in the same column, without moving or remounting any React children.
      const heights = cards.map((card) => card.getBoundingClientRect().height);
      const gap = Number.parseFloat(getComputedStyle(root).columnGap) || 0;
      const bottoms = [0, 0];
      cards.forEach((card, index) => {
        const column = index % 2;
        const top = `${bottoms[column]}px`;
        if (card.style.top !== top) card.style.top = top;
        bottoms[column] += heights[index] + gap;
      });
      const height = `${Math.max(0, ...bottoms.map((bottom) => bottom - gap))}px`;
      if (root.style.height !== height) root.style.height = height;
    };
    layout();
    const observer = new ResizeObserver(layout);
    cards.forEach((card) => observer.observe(card));
    return () => {
      observer.disconnect();
      root.style.removeProperty("height");
      cards.forEach((card) => card.style.removeProperty("top"));
    };
  }, [items, useColumns]);

  const desktopClass =
    breakpoint === "lg"
      ? "lg:grid lg:grid-cols-2 lg:gap-x-2 lg:items-start"
      : "sm:grid sm:grid-cols-2 sm:gap-x-2 sm:items-start";

  return (
    <div ref={rootRef} className={`relative ${uiStackList} ${desktopClass}`}>
      {Children.toArray(items).map((item, index) => (
        <div
          key={typeof item === "object" && "key" in item ? item.key : index}
          style={
            useColumns
              ? {
                  position: "absolute",
                  width: "calc((100% - 0.5rem) / 2)",
                  left: index % 2 === 0 ? 0 : "calc((100% + 0.5rem) / 2)",
                  marginTop: 0,
                }
              : undefined
          }
        >
          {item}
        </div>
      ))}
    </div>
  );
}
