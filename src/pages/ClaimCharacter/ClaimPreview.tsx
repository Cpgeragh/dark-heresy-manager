// src/pages/ClaimCharacter/ClaimPreview.tsx

import { useCallback } from "react";
import type { OwnershipState } from "../../types/Recovery";
import { Button } from "../../ui/buttons/Button";
import { SectionHeader } from "../../ui/SectionHeader";
import {
  uiSection,
  uiTextBody,
  uiTextError,
  uiStackBody,
  uiStackField,
} from "../../ui/styles/editableStyles";
import {
  colourAmberPlain,
  colourSuccessPlain,
  colourMetadataLabelText,
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
    <div className={`${uiSection} ${uiStackBody}`}>
      <SectionHeader as="h3">Character Found</SectionHeader>

      <div className={`${uiTextBody} text-sm lg:text-base ${uiStackField}`}>
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
