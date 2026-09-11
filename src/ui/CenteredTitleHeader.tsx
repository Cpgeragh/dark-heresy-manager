import type { ReactNode } from "react";

interface CenteredTitleHeaderProps {
  as?: "h1" | "h2";
  className?: string;
  left?: ReactNode;
  right?: ReactNode;
  size?: "modal" | "page";
  title: ReactNode;
  titleClassName?: string;
}

export function CenteredTitleHeader({
  as: Heading = "h2",
  className = "",
  left,
  right,
  size = "modal",
  title,
  titleClassName = "text-red-500",
}: CenteredTitleHeaderProps) {
  const titleSizeClass = size === "page" ? "text-base lg:text-lg" : "text-sm lg:text-base";

  return (
    <div
      className={`grid grid-cols-[2rem_1fr_2rem] items-center border-b border-slate-700 px-4 py-3 lg:px-5 lg:py-4 ${className}`.trim()}
    >
      {left ?? <span aria-hidden />}
      <Heading className={`text-center font-cinzel font-bold ${titleSizeClass} ${titleClassName}`}>
        {title}
      </Heading>
      {right ?? <span aria-hidden />}
    </div>
  );
}
