// src/pages/ClaimCharacter/ClaimPreview.tsx

import { useCallback } from "react";
import type { OwnershipState } from "./hooks/useRecoveryLookup";
import type { CharacterDocument, CampaignDocument } from "../../types/Firestore";

interface ClaimPreviewProps {
  character: CharacterDocument & { id: string };
  campaign: CampaignDocument;
  ownership: OwnershipState;
  onClaim: () => Promise<void> | void;
}

export function ClaimPreview({ character, campaign, ownership, onClaim }: ClaimPreviewProps) {
  const name = character.header?.characterName ?? "Unnamed Character";

  function renderStatus() {
    switch (ownership) {
      case "unclaimed":
        return <p className="text-green-400 text-sm">This character is unclaimed and available.</p>;

      case "claimed-by-you":
        return <p className="text-amber-300 text-sm">You already own this character.</p>;

      case "claimed-by-other":
        return (
          <p className="text-red-400 text-sm">
            This character is already claimed by another player.
          </p>
        );

      case "locked":
        return (
          <p className="text-red-400 text-sm">This character is claimed and locked by the DM.</p>
        );
    }
  }

  function canClaim() {
    return ownership === "unclaimed";
  }

  const handleClaim = useCallback(() => {
    if (!canClaim()) return;
    onClaim();
  }, [ownership, onClaim]);

  return (
    <div className="border border-slate-700 bg-slate-900 p-4 rounded space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">Character Found</h2>

      <div className="text-slate-300 text-sm space-y-1">
        <p>
          <span className="text-slate-400">Character:</span>{" "}
          <span className="font-semibold">{name}</span>
        </p>

        <p>
          <span className="text-slate-400">Campaign:</span>{" "}
          <span className="font-semibold">{campaign.name ?? "Unnamed Campaign"}</span>
        </p>
      </div>

      {/* Ownership status */}
      {renderStatus()}

      {/* Action */}
      <button
        disabled={!canClaim()}
        onClick={handleClaim}
        className={`w-full px-4 py-2 rounded font-semibold
          ${
            canClaim()
              ? "bg-green-600 text-white hover:bg-green-500"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
      >
        {ownership === "unclaimed" ? "Claim This Character" : "Claim Unavailable"}
      </button>
    </div>
  );
}
