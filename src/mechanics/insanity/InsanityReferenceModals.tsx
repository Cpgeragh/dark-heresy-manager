import {
  uiRuleName,
  uiTextLabel,
  uiTextDescription,
  uiStackBody,
} from "../../ui/styles/editableStyles";

function RuleParagraph({ children }: { children: React.ReactNode }) {
  return <p className={uiTextDescription}>{children}</p>;
}

export function DisorderInfoContent({
  type,
  name,
  description,
  typeDescription,
  notes,
}: {
  type: string;
  name: string;
  description: string;
  typeDescription?: string;
  notes?: string;
}) {
  return (
    <div className={uiStackBody}>
      {(type !== name || typeDescription) && (
        <div>
          <p className={uiRuleName}>{type}</p>
          {typeDescription && <RuleParagraph>{typeDescription}</RuleParagraph>}
        </div>
      )}
      <div>
        <RuleParagraph>{description}</RuleParagraph>
      </div>
      {notes && (
        <div>
          <p className={uiTextLabel}>Notes</p>
          <RuleParagraph>{notes}</RuleParagraph>
        </div>
      )}
    </div>
  );
}
