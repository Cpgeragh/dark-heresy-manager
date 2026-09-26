// src/pages/CampaignOverview/MyCharacterCard.tsx

import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { buildRoute } from "../../constants/routes";
import { PortraitUpload } from "../../components/PortraitUpload";
import { revealRecoveryCode } from "../../services/characterService";
import { useToast } from "../../components/Toast";
import type { CharacterListItem } from "../../types/Firestore";

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
      className="border border-slate-700 rounded-lg p-4 bg-slate-900/60 block hover:bg-slate-800 transition-colors"
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
          <div className="font-semibold text-slate-200 leading-tight lg:text-lg">{name}</div>
          {(career || rank) && (
            <div className="text-sm lg:text-base text-slate-400">
              {[career, rank].filter(Boolean).join(" · ")}
            </div>
          )}
          {(character.wounds || xpLeft !== null) && (
            <div className="flex flex-wrap gap-3 text-xs lg:text-sm text-slate-400">
              {character.wounds && (
                <span>
                  ❤{" "}
                  <span
                    className={
                      character.wounds.current <= 2
                        ? "text-red-400 font-semibold"
                        : "text-slate-200"
                    }
                  >
                    {character.wounds.current}
                  </span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-slate-200">{character.wounds.total}</span> Wounds
                </span>
              )}
              {xpLeft !== null && (
                <span>
                  ✦{" "}
                  <span className={xpLeft < 0 ? "text-red-400 font-semibold" : "text-slate-200"}>
                    {xpLeft}
                  </span>{" "}
                  XP remaining
                </span>
              )}
            </div>
          )}
          <div
            className="text-xs lg:text-sm text-slate-600 font-code"
            onClick={(e) => e.stopPropagation()}
          >
            Recovery:{" "}
            {revealedCode ?? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  void handleReveal();
                }}
                disabled={revealing}
                className="underline hover:text-slate-400 disabled:opacity-50"
              >
                {revealing ? "Revealing…" : "Reveal"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
