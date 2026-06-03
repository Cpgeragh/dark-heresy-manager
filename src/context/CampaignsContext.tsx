// src/context/CampaignsContext.tsx

import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";

type CampaignWithId = CampaignDocument & { id: string };

interface CampaignsContextValue {
  campaigns: CampaignWithId[];
  loading: boolean;
  error: string | null;
}

const CampaignsContext = createContext<CampaignsContextValue>({
  campaigns: [],
  loading: true,
  error: null,
});

export function CampaignsProvider({
  uid,
  role,
  children,
}: {
  uid: string;
  role: "dm" | "player";
  children: React.ReactNode;
}) {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const field = role === "dm" ? "dmId" : "memberIds";
    const op    = role === "dm" ? "==" : "array-contains";

    const unsubscribe = onSnapshot(
      query(collection(db, "campaigns"), where(field, op, uid)),
      (snap) => {
        setCampaigns(snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CampaignDocument, "id">),
        })));
        setLoading(false);
      },
      (err) => {
        console.error("CampaignsProvider error:", err);
        setError("Failed to load campaigns.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, role]);

  return (
    <CampaignsContext.Provider value={{ campaigns, loading, error }}>
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaignsContext() {
  return useContext(CampaignsContext);
}
