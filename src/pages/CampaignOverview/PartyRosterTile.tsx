// src/pages/CampaignOverview/PartyRosterTile.tsx

import { PortraitUpload } from "../../components/PortraitUpload";
import { uiSection, uiCardTitle, uiTextMeta } from "../../ui/styles/editableStyles";
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
        {summary.playerName && <div className={uiTextMeta}>{summary.playerName}</div>}
        {(summary.career || summary.rank) && (
          <div className={uiTextMeta}>
            {[summary.career, summary.rank].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
