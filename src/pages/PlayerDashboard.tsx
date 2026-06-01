// src/pages/PlayerDashboard.tsx

import { useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import { useCampaignsForUser } from "../hooks/useCampaignsForUser";
import { usePlayerCharacters } from "../hooks/usePlayerCharacters";
import { buildRoute, ROUTES } from "../constants/routes";
import type { CharacterListItem } from "../types/Firestore";

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
  const navigate = useNavigate();
  const name   = character.header?.characterName ?? "Unnamed Character";
  const career = character.header?.career;
  const rank   = character.header?.rank;
  const xpLeft = character.experience
    ? character.experience.total - character.experience.spent
    : null;

  return (
    <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/60 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-100 leading-tight">{name}</div>
          {(career || rank) && (
            <div className="text-sm text-slate-400 mt-0.5">
              {[career, rank].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(buildRoute.characterSheet(campaignId, character.id))}
          className="shrink-0 px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 transition"
        >
          View Sheet
        </button>
      </div>

      {(character.wounds || xpLeft !== null) && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {character.wounds && (
            <span>
              ❤{" "}
              <span className={character.wounds.current <= 2 ? "text-red-400 font-semibold" : "text-slate-200"}>
                {character.wounds.current}
              </span>
              <span className="text-slate-600"> / </span>
              <span className="text-slate-200">{character.wounds.total}</span>
              {" "}Wounds
            </span>
          )}
          {xpLeft !== null && (
            <span>
              ✦{" "}
              <span className={xpLeft < 0 ? "text-red-400 font-semibold" : "text-slate-200"}>
                {xpLeft}
              </span>
              {" "}XP remaining
            </span>
          )}
        </div>
      )}

      <div className="text-xs text-slate-600 font-mono">
        Recovery: {character.recoveryCode}
      </div>
    </div>
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
    <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-900/40">
      <h2 className="font-semibold text-lg text-slate-100">{campaignName}</h2>

      {loading && (
        <p className="text-sm text-slate-500">Loading characters…</p>
      )}

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
  const { campaigns, error } = useCampaignsForUser(user.uid, "player");

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <button
          onClick={() => navigate(ROUTES.CLAIM_CHARACTER)}
          className="px-3 py-1.5 text-sm bg-amber-500 text-slate-900 font-semibold rounded hover:bg-amber-400 transition"
        >
          + Claim a Character
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 border border-red-700 bg-red-900/20 rounded p-2">
          {error}
        </p>
      )}

      {!error && campaigns.length === 0 && (
        <div className="space-y-3">
          <p className="text-slate-400">
            You are not part of any campaigns yet. Ask your DM for a recovery code to claim your character.
          </p>
          <button
            onClick={() => navigate(ROUTES.CLAIM_CHARACTER)}
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm hover:bg-amber-400 transition"
          >
            Claim a Character
          </button>
        </div>
      )}

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
    </div>
  );
}
