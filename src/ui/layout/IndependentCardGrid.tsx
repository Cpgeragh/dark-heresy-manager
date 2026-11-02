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
    if (!root || !useColumns || root.childElementCount === 0) return;
    const cards = Array.from(root.children) as HTMLElement[];
    const heights = new Map<Element, number>();
    const observer = new ResizeObserver((entries) => {
      // Use the browser's completed layout measurements rather than forcing
      // synchronous layout with a height read for every mounted card.
      entries.forEach((entry) => {
        heights.set(entry.target, entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
      });
      if (heights.size !== cards.length) return;
      const gap = Number.parseFloat(getComputedStyle(root).columnGap) || 0;
      const bottoms = [0, 0];
      cards.forEach((card, index) => {
        const column = index % 2;
        card.style.position = "absolute";
        card.style.width = "calc((100% - 0.5rem) / 2)";
        card.style.left = column === 0 ? "0px" : "calc((100% + 0.5rem) / 2)";
        const top = `${bottoms[column]}px`;
        if (card.style.top !== top) card.style.top = top;
        bottoms[column] += heights.get(card)! + gap;
      });
      const height = `${Math.max(0, ...bottoms.map((bottom) => bottom - gap))}px`;
      if (root.style.height !== height) root.style.height = height;
    });
    cards.forEach((card) => observer.observe(card));
    return () => {
      observer.disconnect();
      root.style.removeProperty("height");
      cards.forEach((card) => {
        ["top", "left", "width", "position"].forEach((property) =>
          card.style.removeProperty(property)
        );
      });
    };
  }, [items, useColumns]);

  const desktopClass =
    breakpoint === "lg"
      ? "lg:grid lg:grid-cols-2 lg:gap-2 lg:items-start"
      : "sm:grid sm:grid-cols-2 sm:gap-2 sm:items-start";

  return (
    <div ref={rootRef} className={`relative ${uiStackList} ${desktopClass}`}>
      {Children.toArray(items).map((item, index) => (
        <div
          key={typeof item === "object" && "key" in item ? item.key : index}
          className="min-w-0"
          style={
            useColumns
              ? {
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
