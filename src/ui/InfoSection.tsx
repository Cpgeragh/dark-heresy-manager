import type { ReactNode } from "react";
import { uiRuleName, uiTextDescription } from "./styles/editableStyles";

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

/** A paragraph of description or rules text inside an info window. */
export function InfoParagraph({ children }: { children: ReactNode }) {
  return <p className={uiTextDescription}>{children}</p>;
}
