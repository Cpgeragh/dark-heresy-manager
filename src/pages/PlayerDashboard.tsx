// src/pages/PlayerDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";

type CharacterData = {
  header?: {
    characterName?: string;
  };
  userId: string | null;
  recoveryCode: string;
};

type Character = CharacterData & {
  id: string;
};

type Props = {
  user: User;
  activeCampaignId: string | null;
};

export default function PlayerDashboard({ user, activeCampaignId }: Props) {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (!activeCampaignId) {
      setCharacters([]);
      return;
    }

    const charsRef = collection(
      db,
      "campaigns",
      activeCampaignId,
      "characters"
    );

    const unsubscribe = onSnapshot(charsRef, (snapshot) => {
      const list: Character[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as CharacterData;
          return {
            id: docSnap.id,
            ...data,
          };
        })
        .filter((c) => c.userId === user.uid);

      setCharacters(list);
    });

    return () => unsubscribe();
  }, [activeCampaignId, user.uid]);

  return (
    <div className="space-y-4 text-slate-100">
      <h1 className="text-2xl font-bold">My Characters</h1>

      {!activeCampaignId && (
        <p className="text-slate-400">
          No campaign selected. Use “Select Campaign” in the top navigation.
        </p>
      )}

      {activeCampaignId && characters.length === 0 && (
        <p className="text-slate-400">
          You have no claimed characters in this campaign.
        </p>
      )}

      <div className="space-y-3">
        {characters.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between border border-slate-700 rounded-lg p-4 bg-slate-900/60"
          >
            <div>
              <div className="font-semibold">
                {c.header?.characterName ?? "Unnamed Character"}
              </div>

              <div className="text-xs text-slate-500 font-mono mt-1">
                Recovery: {c.recoveryCode}
              </div>
            </div>

            <button
              onClick={() =>
                navigate(
                  `/campaign/${activeCampaignId}/character/${c.id}`
                )
              }
              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}