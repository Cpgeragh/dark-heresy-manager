import type { ReactNode } from "react";
import { uiTextError } from "./styles/editableStyles";

interface ErrorStateProps {
  children: ReactNode;
  className?: string;
}

export function ErrorState({ children, className = "" }: ErrorStateProps) {
  return (
    <p role="alert" className={`text-sm lg:text-base ${uiTextError} ${className}`.trim()}>
      {children}
    </p>
  );
}
