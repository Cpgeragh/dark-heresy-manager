import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";

type CharacterData = {
  name: string;
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
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (!activeCampaignId) {
      setCharacters([]);
      return;
    }

    const charsRef = collection(db, "campaigns", activeCampaignId, "characters");

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Characters</h1>

      {!activeCampaignId && (
        <p className="text-slate-400">
          No campaign selected. Use “Select Campaign” in the top nav.
        </p>
      )}

      {activeCampaignId && characters.length === 0 && (
        <p className="text-slate-400">You have no claimed characters in this campaign.</p>
      )}

      {characters.map((c) => (
        <div
          key={c.id}
          className="border border-slate-700 rounded-lg p-4 bg-slate-900"
        >
          <div className="font-semibold">{c.name}</div>
          <div className="text-xs text-slate-400 mt-1">
            Character ID: {c.id}
          </div>
        </div>
      ))}
    </div>
  );
}