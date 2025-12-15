import type { ExperienceBlock } from "../../types/Character";
import {
  sectionContainerClass,
  readOnlyBadgeClass,
} from "../../ui/editableStyles";

interface ExperienceTabProps {
  experience: ExperienceBlock;
  editable: boolean; // intentionally unused for now (read-only by design)
  onUpdate: (exp: ExperienceBlock) => void;
}

export function ExperienceTab({
  experience,
}: ExperienceTabProps) {
  const remaining = experience.total - experience.spent;

  return (
    <div className="space-y-6 text-slate-300">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Experience</h2>
        <span className={readOnlyBadgeClass()}>Read-only</span>
      </div>

      {/* SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={sectionContainerClass(false) + " text-center"}>
          <div className="text-xs text-slate-400 mb-1">Total XP</div>
          <div className="text-2xl font-semibold font-mono text-slate-100">
            {experience.total}
          </div>
        </div>

        <div className={sectionContainerClass(false) + " text-center"}>
          <div className="text-xs text-slate-400 mb-1">Spent XP</div>
          <div className="text-2xl font-semibold font-mono text-slate-100">
            {experience.spent}
          </div>
        </div>

        <div className={sectionContainerClass(false) + " text-center"}>
          <div className="text-xs text-slate-400 mb-1">Remaining XP</div>
          <div
            className={`text-2xl font-semibold font-mono ${
              remaining < 0 ? "text-red-400" : "text-slate-100"
            }`}
          >
            {remaining}
          </div>
        </div>
      </section>

      {/* PURCHASED ADVANCES */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-200">
          Purchased Advances
        </h3>

        {experience.ranks.length === 0 && (
          <p className="text-sm text-slate-400">
            No advances purchased yet.
          </p>
        )}

        <div className="space-y-4">
          {experience.ranks.map((rankBlock) => (
            <div
              key={rankBlock.rank}
              className={sectionContainerClass(false)}
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-2">
                Rank {rankBlock.rank}
              </h4>

              {rankBlock.advances.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No advances at this rank.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rankBlock.advances.map((adv) => (
                    <li
                      key={adv.id}
                      className="rounded border border-slate-700 bg-slate-900/60 p-3"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="font-mono text-sm text-slate-100">
                          {adv.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {adv.cost} XP
                        </div>
                      </div>

                      {adv.notes && (
                        <div className="mt-1 text-xs text-slate-400">
                          {adv.notes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER NOTE */}
      <p className="text-xs text-slate-500">
        Experience editing will be added in a later phase.
      </p>
    </div>
  );
}