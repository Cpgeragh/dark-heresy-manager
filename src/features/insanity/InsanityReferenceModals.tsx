import { uiTextBody, uiTextLabel } from "../../ui/editableStyles";

function RuleParagraph({ children }: { children: React.ReactNode }) {
  return <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{children}</p>;
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
    <div className="space-y-3">
      {(type !== name || typeDescription) && (
        <div>
          <p className="text-sm lg:text-base font-semibold text-amber-300">{type}</p>
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
