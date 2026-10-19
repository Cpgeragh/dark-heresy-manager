import type { ReactNode } from "react";
import { uiRuleName } from "./styles/editableStyles";

interface InfoSectionProps {
  heading: string;
  children: ReactNode;
}

/** A headed section inside an info window. */
export function InfoSection({ heading, children }: InfoSectionProps) {
  return (
    <div>
      <p className={uiRuleName}>{heading}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
