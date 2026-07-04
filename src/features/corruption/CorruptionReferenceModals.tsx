import { uiTextBody, uiTextLabel } from "../../ui/editableStyles";
import type { CorruptionMalignancyRef } from "./corruptionReference";
import type { MutationRef } from "./mutationsReference";

function RuleParagraph({ children }: { children: React.ReactNode }) {
  return <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{children}</p>;
}

export function MalignancyInfoContent({
  malignancy,
  notes,
  hideName = false,
}: {
  malignancy: Pick<CorruptionMalignancyRef, "name"> & Partial<Pick<CorruptionMalignancyRef, "roll" | "effect">>;
  notes?: string;
  hideName?: boolean;
}) {
  return (
    <div className="space-y-3">
      {malignancy.roll && (
        <div>
          <p className="text-sm lg:text-base font-semibold text-amber-300">{malignancy.roll}</p>
        </div>
      )}
      {(!hideName || malignancy.effect) && (
        <div>
          {!hideName && <p className="text-sm lg:text-base font-semibold text-slate-200">{malignancy.name}</p>}
          {malignancy.effect && <RuleParagraph>{malignancy.effect}</RuleParagraph>}
        </div>
      )}
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
  hideName = false,
}: {
  mutation: Pick<MutationRef, "name"> & Partial<Pick<MutationRef, "roll" | "effect">>;
  notes?: string;
  hideName?: boolean;
}) {
  return (
    <div className="space-y-3">
      {mutation.roll && (
        <div>
          <p className="text-sm lg:text-base font-semibold text-amber-300">{mutation.roll}</p>
        </div>
      )}
      {(!hideName || mutation.effect) && (
        <div>
          {!hideName && <p className="text-sm lg:text-base font-semibold text-slate-200">{mutation.name}</p>}
          {mutation.effect && <RuleParagraph>{mutation.effect}</RuleParagraph>}
        </div>
      )}
      {notes && (
        <div>
          <p className={uiTextLabel}>Notes</p>
          <RuleParagraph>{notes}</RuleParagraph>
        </div>
      )}
    </div>
  );
}
