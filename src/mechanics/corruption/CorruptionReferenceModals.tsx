import { InfoParagraph, InfoSection } from "../../ui/InfoSection";
import { uiRuleName, uiStackBody } from "../../ui/styles/editableStyles";
import type { CorruptionMalignancyRef } from "./corruptionReference";
import type { MutationRef } from "./mutationsReference";

export function MalignancyInfoContent({
  malignancy,
  notes,
}: {
  malignancy: Partial<Pick<CorruptionMalignancyRef, "roll" | "effect">>;
  notes?: string;
}) {
  return (
    <div className={uiStackBody}>
      {malignancy.roll && (
        <div>
          <p className={uiRuleName}>{malignancy.roll}</p>
        </div>
      )}
      {malignancy.effect && <InfoParagraph>{malignancy.effect}</InfoParagraph>}
      {notes && (
        <InfoSection heading="Notes">
          <InfoParagraph>{notes}</InfoParagraph>
        </InfoSection>
      )}
    </div>
  );
}

export function MutationInfoContent({
  mutation,
  notes,
}: {
  mutation: Partial<Pick<MutationRef, "roll" | "effect">>;
  notes?: string;
}) {
  return (
    <div className={uiStackBody}>
      {mutation.roll && (
        <div>
          <p className={uiRuleName}>{mutation.roll}</p>
        </div>
      )}
      {mutation.effect && <InfoParagraph>{mutation.effect}</InfoParagraph>}
      {notes && (
        <InfoSection heading="Notes">
          <InfoParagraph>{notes}</InfoParagraph>
        </InfoSection>
      )}
    </div>
  );
}
