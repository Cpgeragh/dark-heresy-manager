// src/context/CampaignsContext.tsx
//
// Runs two parallel real-time listeners per uid:
//   - dmCampaigns: campaigns where dmId == uid
//   - playerCampaigns: campaigns where memberIds array-contains uid
//
// Both exclude archived campaigns (archivedAt == null).

import { createContext, useContext, useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { campaignsCollectionRef } from "../firebase/converters";
import type { CampaignWithId } from "../types/Firestore";

interface CampaignsContextValue {
  dmCampaigns: CampaignWithId[];
  playerCampaigns: CampaignWithId[];
  loading: boolean;
  error: string | null;
}

const CampaignsContext = createContext<CampaignsContextValue>({
  dmCampaigns: [],
  playerCampaigns: [],
  loading: true,
  error: null,
});

export function CampaignsProvider({
  uid,
  children,
}: {
  uid: string;
  children: React.ReactNode;
}) {
  const [dmCampaigns, setDmCampaigns] = useState<CampaignWithId[]>([]);
  const [playerCampaigns, setPlayerCampaigns] = useState<CampaignWithId[]>([]);
  const [dmLoading, setDmLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listener 1: campaigns this user runs as DM
  useEffect(() => {
    if (!uid) { setDmLoading(false); return; }
    setDmLoading(true);
    const q = query(
      campaignsCollectionRef(),
      where("dmId", "==", uid),
      where("archivedAt", "==", null)
    );
    return onSnapshot(
      q,
      (snap) => {
        setDmCampaigns(snap.docs.map((d) => d.data()));
        setDmLoading(false);
      },
      (err) => {
        console.error("CampaignsProvider (dm) error:", err);
        setError("Failed to load campaigns.");
        setDmLoading(false);
      }
    );
  }, [uid]);

  // Listener 2: campaigns this user is a player in
  useEffect(() => {
    if (!uid) { setPlayerLoading(false); return; }
    setPlayerLoading(true);
    const q = query(
      campaignsCollectionRef(),
      where("memberIds", "array-contains", uid),
      where("archivedAt", "==", null)
    );
    return onSnapshot(
      q,
      (snap) => {
        setPlayerCampaigns(snap.docs.map((d) => d.data()));
        setPlayerLoading(false);
      },
      (err) => {
        console.error("CampaignsProvider (player) error:", err);
        setError("Failed to load campaigns.");
        setPlayerLoading(false);
      }
    );
  }, [uid]);

  return (
    <CampaignsContext.Provider
      value={{
        dmCampaigns,
        playerCampaigns,
        loading: dmLoading || playerLoading,
        error,
      }}
    >
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaignsContext() {
  return useContext(CampaignsContext);
}
