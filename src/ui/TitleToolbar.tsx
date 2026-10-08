import type { ReactNode } from "react";
import { uiSectionShell } from "./styles/editableStyles";

interface TitleToolbarProps {
  title: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function TitleToolbar({ title, left, right, className = "" }: TitleToolbarProps) {
  return (
    <div
      className={`${uiSectionShell} grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center p-2 ${className}`.trim()}
    >
      <div className="flex items-center justify-start">{left}</div>
      <h1 className="px-2 text-center font-cinzel text-sm font-bold leading-tight text-red-500 sm:text-base lg:text-lg">
        {title}
      </h1>
      <div className="flex items-center justify-end">{right}</div>
    </div>
  );
}
