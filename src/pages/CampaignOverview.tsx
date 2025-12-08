// src/pages/CampaignOverview.tsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

import { useClaimLogs } from "../hooks/useClaimLogs";

type CharacterSummary = {
  id: string;
  name: string;
  userId: string | null;
};

export default function CampaignOverview() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;

  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Runtime guard AND TS narrowing
  if (!campaignId) {
    return (
      <div className="text-slate-300 text-center py-10">
        No campaign selected.
      </div>
    );
  }

  // TS now knows this is always a string
  const safeCampaignId: string = campaignId;

  useEffect(() => {
    async function load() {
      setLoading(true);

      const charsRef = collection(db, "campaigns", safeCampaignId, "characters");
      const snap = await getDocs(charsRef);

      const list: CharacterSummary[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || "Unnamed",
          userId: data.userId || null,
        };
      });

      setCharacters(list);
      setLoading(false);
    }

    load();
  }, [safeCampaignId]);

  if (loading) {
    return (
      <div className="text-slate-300 text-center py-10">
        Loading campaign...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Campaign Overview</h1>

      <p className="text-slate-400 text-sm mb-4">
        Campaign ID: <code>{safeCampaignId}</code>
      </p>

      <div className="space-y-4">
        {characters.map((char) => (
          <CampaignOverviewCharacterRow
            key={char.id}
            campaignId={safeCampaignId}
            characterId={char.id}
            name={char.name}
            userId={char.userId}
          />
        ))}
      </div>
    </div>
  );
}

function CampaignOverviewCharacterRow({
  campaignId,
  characterId,
  name,
  userId,
}: {
  campaignId: string;
  characterId: string;
  name: string;
  userId: string | null;
}) {
  const { logs } = useClaimLogs(campaignId, characterId);

  const latest = logs.length > 0 ? logs[0] : null;

  return (
    <div className="border border-slate-700 p-4 rounded bg-slate-900/40">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-xs text-slate-400">
            Character ID: <code>{characterId}</code>
          </p>
          <p className="text-xs text-slate-400">
            Owner UID: <code>{userId || "Unclaimed"}</code>
          </p>

          {latest && (
            <p className="text-xs text-slate-300 mt-1">
              Last event: {latest.action} by {latest.actorUid}
            </p>
          )}
        </div>

        <Link
          to={`/campaign/${campaignId}/character/${characterId}`}
          className="px-3 py-1 rounded bg-amber-500 text-black text-sm border border-amber-400 hover:bg-amber-400"
        >
          Open Sheet
        </Link>
      </div>
    </div>
  );
}