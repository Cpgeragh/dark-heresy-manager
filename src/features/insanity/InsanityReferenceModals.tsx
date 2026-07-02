import { InfoModal } from "../../components/InfoModal";
import { uiInfoModalWrapper, uiTextBody, uiTextLabel } from "../../ui/editableStyles";
import {
  INSANITY_DISORDER_REFERENCE,
  INSANITY_RECOVERY_EXAMPLES,
  INSANITY_RULE_TEXT,
  INSANITY_SEVERITIES,
  INSANITY_TRACK,
  MENTAL_TRAUMAS,
} from "./insanityReference";

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

export function InsanityReferenceModals() {
  return (
    <div className="space-y-1">
      <div className={uiTextLabel}>Reference</div>
      <div className="flex flex-wrap gap-1.5">
        <ReferenceInfoItem
          label="Track"
          title="Insanity Track"
          content={
            <div className="space-y-3">
              <RuleParagraph>{INSANITY_RULE_TEXT.degrees}</RuleParagraph>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs lg:text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-700">
                      <th className="py-1 pr-3">Points</th>
                      <th className="py-1 pr-3">Degree</th>
                      <th className="py-1 pr-3">Trauma</th>
                      <th className="py-1">Disorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INSANITY_TRACK.map((row) => (
                      <tr key={row.pointsLabel} className="border-b border-slate-800">
                        <td className="py-1.5 pr-3 font-code text-slate-300">{row.pointsLabel}</td>
                        <td className="py-1.5 pr-3 text-slate-200">{row.degree}</td>
                        <td className="py-1.5 pr-3 font-code text-slate-300">{row.traumaModifier}</td>
                        <td className="py-1.5 text-slate-300">{row.disorderLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
        />
        <ReferenceInfoItem
          label="Trauma"
          title="Mental Trauma"
          content={
            <div className="space-y-3">
              <RuleParagraph>{INSANITY_RULE_TEXT.trauma}</RuleParagraph>
              <div className="space-y-2">
                {MENTAL_TRAUMAS.map((entry) => (
                  <div key={entry.roll} className="rounded border border-slate-700 bg-slate-900/50 p-2">
                    <p className="font-code text-xs lg:text-sm text-amber-300">{entry.roll}</p>
                    <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{entry.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          }
        />
        <ReferenceInfoItem
          label="Disorders"
          title="Gaining Mental Disorders"
          content={
            <div className="space-y-3">
              <RuleParagraph>{INSANITY_RULE_TEXT.disorders}</RuleParagraph>
              <div className="space-y-2">
                {INSANITY_DISORDER_REFERENCE.filter((ref) => !ref.custom).map((ref) => (
                  <div key={ref.id} className="rounded border border-slate-700 bg-slate-900/50 p-2">
                    <p className="text-sm lg:text-base font-semibold text-slate-200">
                      {ref.type === ref.name ? ref.name : `${ref.type}: ${ref.name}`}
                    </p>
                    <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{ref.description}</p>
                  </div>
                ))}
              </div>
            </div>
          }
        />
        <ReferenceInfoItem
          label="Severity"
          title="Disorder Severity"
          content={
            <div className="space-y-3">
              {INSANITY_SEVERITIES.map((entry) => (
                <div key={entry.severity}>
                  <p className="text-sm lg:text-base font-semibold text-amber-300">{entry.severity}</p>
                  <RuleParagraph>{entry.description}</RuleParagraph>
                </div>
              ))}
            </div>
          }
        />
        <ReferenceInfoItem
          label="Recovery"
          title="Removing Insanity Points"
          content={
            <div className="space-y-3">
              <RuleParagraph>{INSANITY_RULE_TEXT.recovery}</RuleParagraph>
              <ul className="list-disc pl-5 space-y-1">
                {INSANITY_RECOVERY_EXAMPLES.map((example) => (
                  <li key={example} className={`text-sm lg:text-base ${uiTextBody}`}>{example}</li>
                ))}
              </ul>
            </div>
          }
        />
      </div>
    </div>
  );
}

export function DisorderInfoContent({
  type,
  name,
  description,
  typeDescription,
  notes,
  hideName = false,
}: {
  type: string;
  name: string;
  description: string;
  typeDescription?: string;
  notes?: string;
  hideName?: boolean;
}) {
  return (
    <div className="space-y-3">
      {(!hideName || type !== name || typeDescription) && (
        <div>
          <p className="text-sm lg:text-base font-semibold text-amber-300">{type}</p>
          {typeDescription && <RuleParagraph>{typeDescription}</RuleParagraph>}
        </div>
      )}
      <div>
        {!hideName && <p className="text-sm lg:text-base font-semibold text-slate-200">{name}</p>}
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
