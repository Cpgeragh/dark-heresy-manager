// src/pages/characterSheet/ExperienceTab.tsx

import type { ExperienceBlock } from "../../types/Character";

interface ExperienceTabProps {
  experience: ExperienceBlock;
  editable: boolean;
  onUpdate: (exp: ExperienceBlock) => void;
}

export function ExperienceTab({
  experience,
  editable,
}: ExperienceTabProps) {
  const remaining = experience.total - experience.spent;

  return (
    <div className="space-y-4 text-slate-300">
      <h2 className="text-xl font-semibold mb-2">Experience</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded bg-slate-800 border border-slate-700">
          <div className="text-xs text-slate-400">Total XP</div>
          <div className="text-lg font-bold">{experience.total}</div>
        </div>

        <div className="p-3 rounded bg-slate-800 border border-slate-700">
          <div className="text-xs text-slate-400">Spent XP</div>
          <div className="text-lg font-bold">{experience.spent}</div>
        </div>

        <div className="p-3 rounded bg-slate-800 border border-slate-700">
          <div className="text-xs text-slate-400">Remaining XP</div>
          <div className="text-lg font-bold">{remaining}</div>
        </div>
      </div>

      {/* Ranks */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Purchased Advances</h3>

        {experience.ranks.length === 0 && (
          <p className="text-slate-400 text-sm">No advances purchased yet.</p>
        )}

        <div className="space-y-4">
          {experience.ranks.map((rankBlock) => (
            <div
              key={rankBlock.rank}
              className="p-3 rounded border border-slate-700 bg-slate-900/40"
            >
              <h4 className="font-semibold mb-2">Rank {rankBlock.rank}</h4>

              {rankBlock.advances.length === 0 ? (
                <p className="text-slate-500 text-sm">No advances at this rank.</p>
              ) : (
                <ul className="space-y-1">
                  {rankBlock.advances.map((adv) => (
                    <li
                      key={adv.id}
                      className="text-xs border border-slate-700 rounded p-2 bg-slate-900/60"
                    >
                      <div className="font-mono text-white">
                        {adv.name} — {adv.cost} XP
                      </div>
                      {adv.notes && (
                        <div className="text-slate-400">{adv.notes}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {!editable && (
        <p className="text-xs text-slate-500">XP editing coming soon.</p>
      )}
    </div>
  );
}