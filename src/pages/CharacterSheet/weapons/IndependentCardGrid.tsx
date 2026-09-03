import type { ReactNode } from "react";

export function IndependentCardGrid({
  items,
  breakpoint = "sm",
  spacing = 3,
}: {
  items: ReactNode[];
  breakpoint?: "sm" | "lg";
  spacing?: 2 | 3;
}) {
  const columns = [
    items.filter((_, index) => index % 2 === 0),
    items.filter((_, index) => index % 2 === 1),
  ];

  const spaceClass = spacing === 2 ? "space-y-2" : "space-y-3";
  const smGapClass = spacing === 2 ? "sm:gap-2" : "sm:gap-3";
  const lgGapClass = spacing === 2 ? "lg:gap-2" : "lg:gap-3";

  const mobileClass = breakpoint === "lg" ? `${spaceClass} lg:hidden` : `${spaceClass} sm:hidden`;
  const desktopClass =
    breakpoint === "lg"
      ? `hidden lg:grid lg:grid-cols-2 ${lgGapClass} lg:items-start`
      : `hidden sm:grid sm:grid-cols-2 ${smGapClass} sm:items-start`;

  return (
    <>
      <div className={mobileClass}>{items}</div>
      <div className={desktopClass}>
        {columns.map((column, index) => (
          <div key={index} className={spaceClass}>
            {column}
          </div>
        ))}
      </div>
    </>
  );
}
