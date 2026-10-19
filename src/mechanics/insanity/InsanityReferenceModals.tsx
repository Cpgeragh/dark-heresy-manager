import { InfoParagraph, InfoSection } from "../../ui/InfoSection";
import { uiRuleName, uiStackBody } from "../../ui/styles/editableStyles";

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
          {typeDescription && <InfoParagraph>{typeDescription}</InfoParagraph>}
        </div>
      )}
      <div>
        <InfoParagraph>{description}</InfoParagraph>
      </div>
      {notes && (
        <InfoSection heading="Notes">
          <InfoParagraph>{notes}</InfoParagraph>
        </InfoSection>
      )}
    </div>
  );
}
