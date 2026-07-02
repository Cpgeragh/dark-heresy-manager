import { InfoModal } from "../../components/InfoModal";
import { uiInfoModalWrapper, uiTextBody, uiTextLabel } from "../../ui/editableStyles";
import {
  CORRUPTION_MALIGNANCIES,
  CORRUPTION_RULE_TEXT,
  CORRUPTION_TRACK,
  MORAL_THREATS,
  type CorruptionMalignancyRef,
} from "./corruptionReference";

function RuleParagraph({ children }: { children: React.ReactNode }) {
  return <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{children}</p>;
}

function ReferenceInfoItem({
  label,
  title,
  content,
}: {
  label: string;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`text-xs lg:text-sm ${uiTextBody}`}>{label}</span>
      <span className={uiInfoModalWrapper}>
        <InfoModal title={title} content={content} />
      </span>
    </span>
  );
}

export function CorruptionReferenceModals() {
  return (
    <div className="space-y-1">
      <div className={uiTextLabel}>Reference</div>
      <div className="flex flex-wrap gap-1.5">
        <ReferenceInfoItem
          label="Track"
          title="Corruption Track"
          content={
            <div className="space-y-3">
              <RuleParagraph>{CORRUPTION_RULE_TEXT.points}</RuleParagraph>
              <RuleParagraph>{CORRUPTION_RULE_TEXT.commonCitizen}</RuleParagraph>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs lg:text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-700">
                      <th className="py-1 pr-3">CP Total</th>
                      <th className="py-1 pr-3">Degree</th>
                      <th className="py-1 pr-3">Malignancy Test</th>
                      <th className="py-1">Mutation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CORRUPTION_TRACK.map((row) => (
                      <tr key={row.pointsLabel} className="border-b border-slate-800">
                        <td className="py-1.5 pr-3 font-code text-slate-300">{row.pointsLabel}</td>
                        <td className="py-1.5 pr-3 text-slate-200">{row.degree}</td>
                        <td className="py-1.5 pr-3 text-slate-300">{row.malignancyModifier}</td>
                        <td className="py-1.5 text-slate-300">{row.mutation || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
        />
        <ReferenceInfoItem
          label="Threats"
          title="Moral Threats"
          content={
            <div className="space-y-3">
              <RuleParagraph>
                The exact level of Corruption Points inflicted by a particular event, revelation or encounter is
                determined by the GM. The following presents some guidelines:
              </RuleParagraph>
              <div className="space-y-2">
                {MORAL_THREATS.map((entry) => (
                  <div key={entry.title} className="rounded border border-slate-700 bg-slate-900/50 p-2">
                    <p className="text-sm lg:text-base font-semibold text-amber-300">{entry.title}</p>
                    <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          }
        />
        <ReferenceInfoItem
          label="Test"
          title="The Malignancy Test"
          content={<RuleParagraph>{CORRUPTION_RULE_TEXT.malignancyTest}</RuleParagraph>}
        />
        <ReferenceInfoItem
          label="Malignancies"
          title="Malignancies"
          content={
            <div className="space-y-2">
              {CORRUPTION_MALIGNANCIES.map((entry) => (
                <MalignancyInfoCard key={entry.id} malignancy={entry} />
              ))}
            </div>
          }
        />
        <ReferenceInfoItem
          label="Mutation"
          title="Mutation"
          content={<RuleParagraph>{CORRUPTION_RULE_TEXT.mutation}</RuleParagraph>}
        />
      </div>
    </div>
  );
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

function MalignancyInfoCard({
  malignancy,
}: {
  malignancy: Pick<CorruptionMalignancyRef, "name"> & Partial<Pick<CorruptionMalignancyRef, "roll" | "effect">>;
}) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/50 p-2">
      {malignancy.roll && <p className="font-code text-xs lg:text-sm text-amber-300">{malignancy.roll}</p>}
      <p className="mt-1 text-sm lg:text-base font-semibold text-slate-200">{malignancy.name}</p>
      {malignancy.effect && (
        <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{malignancy.effect}</p>
      )}
    </div>
  );
}
