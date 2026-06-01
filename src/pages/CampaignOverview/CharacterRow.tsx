// src/pages/CampaignOverview/CharacterRow.tsx

import { Link } from "react-router-dom";
import { useClaimLogs } from "../../hooks/useClaimLogs";

export function CharacterRow({
  campaignId,
  characterId,
  characterName,
  userId,
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
  userId: string | null;
}) {
  const { logs } = useClaimLogs(campaignId, characterId);

  const latest = logs.length > 0 ? logs[0] : null;

  return (
    <div className="border border-slate-700 p-4 rounded bg-slate-900/40">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{characterName}</h2>
          <p className="text-xs text-slate-400">
            Character ID: <code>{characterId}</code>
          </p>
          <p className="text-xs text-slate-400">
            Owner UID: <code>{userId ?? "Unclaimed"}</code>
          </p>

          {latest && (
            <p className="text-xs text-slate-300 mt-1">
              Last event: {latest.action} by {latest.actorUid}
            </p>
          )}
        </div>

        <Link
          to={`/campaign/${campaignId}/character/${characterId}`}
          className="px-3 py-1 rounded bg-amber-500 text-black text-sm border border-amber-400 hover:bg-amber-400"
        >
          Open Sheet
        </Link>
      </div>
    </div>
  );
}
