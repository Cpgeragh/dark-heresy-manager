import type { ReactNode } from "react";

interface ErrorStateProps {
  children: ReactNode;
  className?: string;
}

export function ErrorState({ children, className = "" }: ErrorStateProps) {
  return (
    <p role="alert" className={`text-sm lg:text-base text-red-400 ${className}`.trim()}>
      {children}
    </p>
  );
}
