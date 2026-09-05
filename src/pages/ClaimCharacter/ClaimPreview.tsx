// src/pages/ClaimCharacter/ClaimPreview.tsx

import { useCallback } from "react";
import type { OwnershipState } from "../../types/Recovery";
import { Button } from "../../ui/buttons/Button";
import { uiTextError } from "../../ui/styles/editableStyles";

interface ClaimPreviewProps {
  characterName: string;
  campaignName: string;
  ownership: OwnershipState;
  onClaim: () => Promise<void> | void;
}

export function ClaimPreview({
  characterName,
  campaignName,
  ownership,
  onClaim,
}: ClaimPreviewProps) {
  function renderStatus() {
    switch (ownership) {
      case "unclaimed":
        return (
          <p className="text-green-400 text-sm lg:text-base">
            This character is unclaimed and available.
          </p>
        );

      case "claimed-by-you":
        return (
          <p className="text-amber-300 text-sm lg:text-base">You already own this character.</p>
        );

      case "claimed-by-other":
        return <p className={uiTextError}>This character is already claimed by another player.</p>;

      case "locked":
        return <p className={uiTextError}>This character is claimed and locked by the DM.</p>;
    }
  }

  const handleClaim = useCallback(() => {
    if (ownership !== "unclaimed") return;
    onClaim();
  }, [ownership, onClaim]);

  return (
    <div className="border border-slate-700 bg-slate-900 p-4 lg:p-5 rounded space-y-4">
      <h2 className="text-xl lg:text-2xl font-semibold text-slate-100">Character Found</h2>

      <div className="text-slate-300 text-sm lg:text-base space-y-1">
        <p>
          <span className="text-slate-400">Character:</span>{" "}
          <span className="font-semibold">{characterName}</span>
        </p>

        <p>
          <span className="text-slate-400">Campaign:</span>{" "}
          <span className="font-semibold">{campaignName}</span>
        </p>
      </div>

      {renderStatus()}

      {ownership === "unclaimed" ? (
        <Button variant="success" fullWidth onClick={handleClaim}>
          Claim This Character
        </Button>
      ) : (
        <Button variant="secondary" fullWidth disabled>
          Unavailable
        </Button>
      )}
    </div>
  );
}
