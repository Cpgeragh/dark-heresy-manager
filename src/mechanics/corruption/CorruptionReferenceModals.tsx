import { InfoParagraph, InfoSection } from "../../ui/InfoSection";
import { uiStackBody } from "../../ui/styles/editableStyles";
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
      {malignancy.roll ? (
        <InfoSection heading={malignancy.roll}>
          {malignancy.effect && <InfoParagraph>{malignancy.effect}</InfoParagraph>}
        </InfoSection>
      ) : (
        malignancy.effect && <InfoParagraph>{malignancy.effect}</InfoParagraph>
      )}
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
      {mutation.roll ? (
        <InfoSection heading={mutation.roll}>
          {mutation.effect && <InfoParagraph>{mutation.effect}</InfoParagraph>}
        </InfoSection>
      ) : (
        mutation.effect && <InfoParagraph>{mutation.effect}</InfoParagraph>
      )}
      {notes && (
        <InfoSection heading="Notes">
          <InfoParagraph>{notes}</InfoParagraph>
        </InfoSection>
      )}
    </div>
  );
}
