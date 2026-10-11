import type { ReactNode } from "react";

import { uiStackList } from "../styles/editableStyles";

export function IndependentCardGrid({
  items,
  breakpoint = "sm",
}: {
  items: ReactNode[];
  breakpoint?: "sm" | "lg";
}) {
  const columns = [
    items.filter((_, index) => index % 2 === 0),
    items.filter((_, index) => index % 2 === 1),
  ];

  const mobileClass = breakpoint === "lg" ? `${uiStackList} lg:hidden` : `${uiStackList} sm:hidden`;
  const desktopClass =
    breakpoint === "lg"
      ? "hidden lg:grid lg:grid-cols-2 lg:gap-2 lg:items-start"
      : "hidden sm:grid sm:grid-cols-2 sm:gap-2 sm:items-start";

  return (
    <>
      <div className={mobileClass}>{items}</div>
      <div className={desktopClass}>
        {columns.map((column, index) => (
          <div key={index} className={uiStackList}>
            {column}
          </div>
        ))}
      </div>
    </>
  );
}
