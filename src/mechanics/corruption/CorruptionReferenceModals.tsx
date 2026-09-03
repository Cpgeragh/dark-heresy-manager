import { uiTextBody, uiTextLabel } from "../../ui/styles/editableStyles";
import type { CorruptionMalignancyRef } from "./corruptionReference";
import type { MutationRef } from "./mutationsReference";

function RuleParagraph({ children }: { children: React.ReactNode }) {
  return <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{children}</p>;
}

export function MalignancyInfoContent({
  malignancy,
  notes,
}: {
  malignancy: Partial<Pick<CorruptionMalignancyRef, "roll" | "effect">>;
  notes?: string;
}) {
  return (
    <div className="space-y-3">
      {malignancy.roll && (
        <div>
          <p className="text-sm lg:text-base font-semibold text-amber-300">{malignancy.roll}</p>
        </div>
      )}
      {malignancy.effect && <RuleParagraph>{malignancy.effect}</RuleParagraph>}
      {notes && (
        <div>
          <p className={uiTextLabel}>Notes</p>
          <RuleParagraph>{notes}</RuleParagraph>
        </div>
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
    <div className="space-y-3">
      {mutation.roll && (
        <div>
          <p className="text-sm lg:text-base font-semibold text-amber-300">{mutation.roll}</p>
        </div>
      )}
      {mutation.effect && <RuleParagraph>{mutation.effect}</RuleParagraph>}
      {notes && (
        <div>
          <p className={uiTextLabel}>Notes</p>
          <RuleParagraph>{notes}</RuleParagraph>
        </div>
      )}
    </div>
  );
}
