// src/pages/CampaignOverview/MyCharacterCard.tsx

import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { buildRoute } from "../../constants/routes";
import { PortraitUpload } from "../../components/PortraitUpload";
import { revealRecoveryCode } from "../../services/characterService";
import { useToast } from "../../components/Toast";
import type { CharacterListItem } from "../../types/Firestore";
import { RevealCodeButton } from "../../ui/buttons/RevealCodeButton";
import { uiSection, uiTextMeta, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import {
  colourMetadataLabelText,
  colourTextPrimary,
  colourErrorText,
} from "../../ui/styles/colourTokens";

export function MyCharacterCard({
  character,
  campaignId,
}: {
  character: CharacterListItem;
  campaignId: string;
}) {
  const name = character.header?.characterName ?? "Unnamed Character";
  const career = character.header?.career;
  const rank = character.header?.rank;
  const xpLeft = character.experience
    ? character.experience.total - character.experience.spent
    : null;
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const toast = useToast();

  const handleReveal = useCallback(async () => {
    setRevealing(true);
    try {
      const code = await revealRecoveryCode(campaignId, character.id);
      setRevealedCode(code);
    } catch (err) {
      console.error("Failed to reveal recovery code:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load recovery code.");
    } finally {
      setRevealing(false);
    }
  }, [campaignId, character.id, toast]);

  return (
    <Link
      to={buildRoute.characterSheet(campaignId, character.id)}
      className={`${uiSection} block hover:bg-slate-800 transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div onClick={(e) => e.stopPropagation()}>
          <PortraitUpload
            campaignId={campaignId}
            characterId={character.id}
            currentPortraitUrl={character.portraitUrl}
            canEdit={true}
          />
        </div>
        <div className="flex-1 space-y-1">
          <div className={`font-semibold ${colourTextPrimary} leading-tight lg:text-lg`}>
            {name}
          </div>
          {(career || rank) && (
            <div className={`text-sm lg:text-base ${colourMetadataLabelText}`}>
              {[career, rank].filter(Boolean).join(" · ")}
            </div>
          )}
          {(character.wounds || xpLeft !== null) && (
            <div className={`flex flex-wrap gap-3 ${uiTextMeta}`}>
              {character.wounds && (
                <span>
                  ❤{" "}
                  <span
                    className={
                      character.wounds.current <= 2
                        ? `${colourErrorText} font-semibold`
                        : colourTextPrimary
                    }
                  >
                    {character.wounds.current}
                  </span>
                  <span className={uiTextPlaceholder}> / </span>
                  <span className={colourTextPrimary}>{character.wounds.total}</span> Wounds
                </span>
              )}
              {xpLeft !== null && (
                <span>
                  ✦{" "}
                  <span
                    className={xpLeft < 0 ? `${colourErrorText} font-semibold` : colourTextPrimary}
                  >
                    {xpLeft}
                  </span>{" "}
                  XP remaining
                </span>
              )}
            </div>
          )}
          <div className={`${uiTextMeta} font-code`} onClick={(e) => e.stopPropagation()}>
            Recovery:{" "}
            {revealedCode ?? <RevealCodeButton revealing={revealing} onReveal={handleReveal} />}
          </div>
        </div>
      </div>
    </Link>
  );
}
