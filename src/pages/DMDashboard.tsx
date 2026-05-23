// src/pages/DMDashboard.tsx

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import type { CampaignDocument, CharacterListItem } from "../types/Firestore";
import CampaignSection from "./DMDashboard/CampaignSection";
import CharacterSection from "./DMDashboard/CharacterSection";
import { useIsMounted } from "../hooks/useIsMounted";

type CampaignWithId = CampaignDocument & { id: string };

interface Props {
  user: User;
  activeCampaignId: string | null;
  onActiveCampaignChange: (id: string | null) => void;
}

export default function DMDashboard({
  user,
  activeCampaignId,
  onActiveCampaignChange,
}: Props) {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const isMounted = useIsMounted();

  // ----------------------------------
  // Load campaigns owned by this DM
  // ----------------------------------
  useEffect(() => {
    async function loadCampaigns() {
      const snap = await getDocs(collection(db, "campaigns"));
      const list: CampaignWithId[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() as Omit<CampaignDocument, "id">;
        if (data.dmId === user.uid) {
          list.push({
            id: docSnap.id,
            ...data,
          });
        }
      });

      if (isMounted()) {
        setCampaigns(list);
      }
    }

    loadCampaigns();
  }, [user.uid, isMounted]);

  // ----------------------------------
  // Watch characters in active campaign
  // ----------------------------------
  useEffect(() => {
    if (!activeCampaignId) {
      setCharacters([]);
      return;
    }

    const ref = collection(db, "campaigns", activeCampaignId, "characters");

    const unsub = onSnapshot(ref, (snap) => {
      const list: CharacterListItem[] = snap.docs.map((c) => {
        const data = c.data() as Omit<CharacterListItem, "id">;
        return {
          id: c.id,
          ...data,
        };
      });
      setCharacters(list);
    });

    return () => unsub();
  }, [activeCampaignId]);

  return (
    <div className="text-slate-100">
      <h1 className="text-4xl font-bold mb-6">DM Dashboard</h1>

      <CampaignSection
        userUid={user.uid}
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        onCampaignSelect={onActiveCampaignChange}
      />

      {activeCampaignId && (
        <div className="mt-10">
          <CharacterSection
            campaignId={activeCampaignId}
            characters={characters}
          />
        </div>
      )}
    </div>
  );
}