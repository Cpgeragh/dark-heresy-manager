import type { ReactNode } from "react";

interface LoadingStateProps {
  children?: ReactNode;
  className?: string;
}

export function LoadingState({ children = "Loading…", className = "" }: LoadingStateProps) {
  return (
    <p role="status" className={`text-sm lg:text-base text-slate-400 ${className}`.trim()}>
      {children}
    </p>
  );
}
