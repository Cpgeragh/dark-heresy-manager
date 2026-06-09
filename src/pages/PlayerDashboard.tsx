// src/pages/PlayerDashboard.tsx

import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { PortraitUpload } from "../components/PortraitUpload";
import type { User } from "firebase/auth";
import { useCampaignsForUser } from "../hooks/useCampaignsForUser";
import { usePlayerCharacters } from "../hooks/usePlayerCharacters";
import { buildRoute, ROUTES } from "../constants/routes";
import type { CharacterListItem } from "../types/Firestore";
import { uiSectionHeader } from "../ui/editableStyles";

type Props = {
  user: User;
};

// ─── Character Card ───────────────────────────────────────────────────────────

function CharacterCard({
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

  return (
    <Link
      to={buildRoute.characterSheet(campaignId, character.id)}
      className="border border-slate-700 rounded-lg p-4 bg-slate-900/60 block hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <PortraitUpload
          campaignId={campaignId}
          characterId={character.id}
          currentPortraitUrl={character.portraitUrl}
          canEdit={true}
        />
      <div className="flex-1 space-y-1">
        <div className="font-semibold text-slate-100 leading-tight">{name}</div>
        {(career || rank) && (
          <div className="text-sm text-slate-400">
            {[career, rank].filter(Boolean).join(" · ")}
          </div>
        )}
        {(character.wounds || xpLeft !== null) && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            {character.wounds && (
              <span>
                ❤{" "}
                <span className={character.wounds.current <= 2 ? "text-red-400 font-semibold" : "text-slate-200"}>
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
        <div className="text-xs text-slate-600 font-mono">Recovery: {character.recoveryCode}</div>
      </div>
      </div>
    </Link>
  );
}

// ─── Campaign Section ─────────────────────────────────────────────────────────

function CampaignSection({
  campaignId,
  campaignName,
  userId,
}: {
  campaignId: string;
  campaignName: string;
  userId: string;
}) {
  const { characters, loading } = usePlayerCharacters(campaignId, userId);

  return (
    <div>
      <p className={`${uiSectionHeader} mb-3`}>{campaignName}</p>

      {loading && <p className="text-sm text-slate-500">Loading characters…</p>}

      {!loading && characters.length === 0 && (
        <p className="text-sm text-slate-500">No characters claimed in this campaign.</p>
      )}

      {!loading && characters.length > 0 && (
        <div className="space-y-3">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} campaignId={campaignId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Player Dashboard ─────────────────────────────────────────────────────────

export default function PlayerDashboard({ user }: Props) {
  const navigate = useNavigate();
  const { campaigns, loading, error } = useCampaignsForUser(user.uid, "player");

  const isEmpty = !loading && !error && campaigns.length === 0;

  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-semibold text-slate-100 text-center">Campaign Hub</h1>

      <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">
        {error && (
          <p className="text-sm text-red-400 border border-red-700 bg-red-900/20 rounded p-2">
            {error}
          </p>
        )}

        {loading && <p className="text-slate-400 text-sm">Loading campaigns…</p>}

        {isEmpty && (
          <div className="space-y-4 text-center py-8">
            <p className="text-slate-400">
              You are not part of any campaigns yet. Ask your DM for a recovery code to claim your
              character.
            </p>
          </div>
        )}

        {!loading && campaigns.length > 0 && (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignSection
                key={campaign.id}
                campaignId={campaign.id}
                campaignName={campaign.name}
                userId={user.uid}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating action button — claim a character */}
      <button
        onClick={() => navigate(ROUTES.CLAIM_CHARACTER)}
        aria-label="Claim a Character"
        className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-amber-500 text-slate-900 shadow-lg hover:bg-amber-400 transition flex items-center justify-center z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
