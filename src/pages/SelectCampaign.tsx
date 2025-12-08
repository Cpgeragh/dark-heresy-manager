import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import type { DocumentData } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";

type Props = {
  user: User; 
  role: "player" | "dm";
  activeCampaignId: string | null;
  onActiveCampaignChange: (id: string | null) => void;
};

export default function SelectCampaign({
  user: _user,          // intentionally unused (no warning)
  role: _role,          // intentionally unused (no warning)
  activeCampaignId,
  onActiveCampaignChange,
}: Props) {

  const [campaigns, setCampaigns] = useState<
    { id: string; name: string; dmId: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "campaigns"));
      const list = snap.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          name: data.name ?? "Unnamed Campaign",
          dmId: data.dmId ?? "",
        };
      });

      setCampaigns(list);
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Select Campaign</h2>

      {campaigns.length === 0 && (
        <p className="text-slate-400">No campaigns exist yet.</p>
      )}

      <div className="grid gap-3">
        {campaigns.map((c) => {
          const isActive = activeCampaignId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => onActiveCampaignChange(c.id)}
              className={`px-4 py-2 rounded border text-left transition
                ${
                  isActive
                    ? "bg-amber-500 text-slate-900 border-amber-400"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
            >
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-slate-400">
                DM: {c.dmId.slice(0, 8)}…
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}