// src/pages/CampaignOverview/PartyRosterTile.tsx

import { PortraitUpload } from "../../components/PortraitUpload";
import { uiSection, uiCardTitle } from "../../ui/editableStyles";
import type { CharacterSummaryWithId } from "../../types/Firestore";

export function PartyRosterTile({ summary }: { summary: CharacterSummaryWithId }) {
  return (
    <div className={uiSection + " flex items-center gap-3"}>
      <PortraitUpload
        campaignId={summary.campaignId}
        characterId={summary.id}
        currentPortraitUrl={summary.portraitUrl}
        canEdit={false}
      />
      <div>
        <div className={uiCardTitle}>{summary.characterName}</div>
        {summary.playerName && (
          <div className="text-xs lg:text-sm text-slate-500">{summary.playerName}</div>
        )}
        {(summary.career || summary.rank) && (
          <div className="text-xs lg:text-sm text-slate-400">
            {[summary.career, summary.rank].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
