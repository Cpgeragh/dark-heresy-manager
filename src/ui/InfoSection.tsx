import type { ReactNode } from "react";
import { uiRuleName, uiSplitRow, uiTextDescription } from "./styles/editableStyles";

interface InfoSectionProps {
  heading: string;
  /** A control on the heading row, to the right of the heading. */
  action?: ReactNode;
  children: ReactNode;
}

/** A headed section inside an info window. */
export function InfoSection({ heading, action, children }: InfoSectionProps) {
  return (
    <div>
      {action ? (
        <div className={uiSplitRow}>
          <p className={uiRuleName}>{heading}</p>
          {action}
        </div>
      ) : (
        <p className={uiRuleName}>{heading}</p>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** A headed section whose body is one paragraph of text. */
export function InfoTextSection({ heading, text }: { heading: string; text: string }) {
  return (
    <InfoSection heading={heading}>
      <InfoParagraph>{text}</InfoParagraph>
    </InfoSection>
  );
}

/** A paragraph of description or rules text inside an info window. */
export function InfoParagraph({ children }: { children: ReactNode }) {
  return <p className={uiTextDescription}>{children}</p>;
}
