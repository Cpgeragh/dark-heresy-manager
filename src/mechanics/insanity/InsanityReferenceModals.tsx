import { InfoParagraph, InfoSection } from "../../ui/InfoSection";
import { uiStackBody } from "../../ui/styles/editableStyles";

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
        <InfoSection heading={type}>
          {typeDescription && <InfoParagraph>{typeDescription}</InfoParagraph>}
        </InfoSection>
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
