// src/pages/ClaimCharacter/ClaimPreview.tsx

import { useCallback } from "react";
import type { OwnershipState } from "../../types/Recovery";
import { Button } from "../../ui/buttons/Button";
import { uiSection, uiTextBody, uiTextError } from "../../ui/styles/editableStyles";
import {
  colourAmberPlain,
  colourSuccessPlain,
  colourMetadataLabelText,
  colourTextPrimary,
} from "../../ui/styles/colourTokens";

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
          <p className={`text-sm lg:text-base ${colourSuccessPlain}`}>
            This character is unclaimed and available.
          </p>
        );

      case "claimed-by-you":
        return (
          <p className={`${colourAmberPlain} text-sm lg:text-base`}>
            You already own this character.
          </p>
        );

      case "claimed-by-other":
        return <p className={uiTextError}>This character is already claimed by another player.</p>;

      case "locked":
        return <p className={uiTextError}>This character is claimed and locked by the DM.</p>;
    }
  }

  const handleClaim = useCallback(() => {
    if (ownership !== "unclaimed") return undefined;
    return onClaim();
  }, [ownership, onClaim]);

  return (
    <div className={`${uiSection} space-y-4`}>
      <h2 className={`text-xl lg:text-2xl font-semibold ${colourTextPrimary}`}>Character Found</h2>

      <div className={`${uiTextBody} text-sm lg:text-base space-y-1`}>
        <p>
          <span className={colourMetadataLabelText}>Character:</span>{" "}
          <span className="font-semibold">{characterName}</span>
        </p>

        <p>
          <span className={colourMetadataLabelText}>Campaign:</span>{" "}
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
