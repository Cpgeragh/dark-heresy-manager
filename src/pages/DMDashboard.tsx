// src/pages/DMDashboard.tsx

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import type { User } from "firebase/auth";
import { db } from "../firebase";
import { createEmptyCharacterData } from "../utils/characterFactory";
import type { CampaignDocument, CharacterListItem } from "../types/Firestore";
import { useToast } from "../components/Toast";
import { 
  IMPORTANT_TOAST_DURATION,
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS 
} from "../constants/ui";

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
  const navigate = useNavigate();
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);

  // ----------------------------------
  // STABLE CALLBACKS
  // ----------------------------------
  const handleCampaignNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCampaignName(e.target.value);
  }, []);

  const handleCharacterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
  }, []);

  const handleCampaignClick = useCallback((campaignId: string) => {
    onActiveCampaignChange(campaignId);
  }, [onActiveCampaignChange]);

  const handleCharacterView = useCallback((characterId: string) => {
    navigate(
      `/campaign/${activeCampaignId}/character/${characterId}`,
      { state: { characterOrder: characters.map((c) => c.id) } }
    );
  }, [navigate, activeCampaignId, characters]);

  // ----------------------------------
  // Load campaigns owned by this DM
  // ----------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadCampaigns() {
      const snap = await getDocs(collection(db, "campaigns"));
      const list: CampaignWithId[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() as Omit<CampaignDocument, 'id'>;
        if (data.dmId === user.uid) {
          list.push({
            id: docSnap.id,
            ...data,
          });
        }
      });

      if (isMounted) {
        setCampaigns(list);
      }
    }

    loadCampaigns();

    return () => {
      isMounted = false;
    };
  }, [user.uid]);

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
        const data = c.data() as Omit<CharacterListItem, 'id'>;
        return {
          id: c.id,
          ...data,
        };
      });
      setCharacters(list);
    });

    return () => unsub();
  }, [activeCampaignId]);

  // ----------------------------------
  // Recovery code helper
  // ----------------------------------
  function generateRecoveryCode() {
    const seg = () =>
      Math.random()
        .toString(36)
        .substring(2, 2 + RECOVERY_CODE_SEGMENT_LENGTH)
        .toUpperCase();
    
    const segments = Array.from(
      { length: RECOVERY_CODE_SEGMENTS }, 
      () => seg()
    ).join('-');
    
    return `${RECOVERY_CODE_PREFIX}-${segments}`;
  }

  // ----------------------------------
  // Create campaign
  // ----------------------------------
  async function createCampaign() {
    const name = newCampaignName.trim() || "Untitled campaign";
    const newRef = doc(collection(db, "campaigns"));

    const campaignData: CampaignDocument = {
      name,
      dmId: user.uid,
      createdAt: new Date(),
    };

    await setDoc(newRef, campaignData);

    setNewCampaignName("");
    onActiveCampaignChange(newRef.id);
  }

  // ----------------------------------
  // Create character
  // ----------------------------------
  async function createCharacter() {
    if (!activeCampaignId) {
      toast.error("No campaign selected.");
      return;
    }

    const trimmedName = characterName.trim();
    if (!trimmedName) {
      toast.warning("Please enter a character name.");
      return;
    }

    const recoveryCode = generateRecoveryCode();

    try {
      const characterData = createEmptyCharacterData({
        campaignId: activeCampaignId,
        recoveryCode,
        userId: null,
        characterName: trimmedName,
      });

      const ref = doc(
        collection(db, "campaigns", activeCampaignId, "characters")
      );

      await setDoc(ref, characterData);

      await setDoc(doc(db, "recoveryIndex", recoveryCode), {
        campaignId: activeCampaignId,
        characterId: ref.id,
      });

      toast.success(
        `Character created successfully!\n\nRecovery Code: ${recoveryCode}\n\n(Click the copy button to save this code)`,
        IMPORTANT_TOAST_DURATION
      );
      setCharacterName("");
    } catch (err) {
      console.error("Character creation error:", err);
      toast.error("Failed to create character. Please try again.");
    }
  }

  return (
    <div className="text-slate-100">
      <h1 className="text-4xl font-bold mb-6">DM Dashboard</h1>

      {/* CREATE CAMPAIGN */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Create Campaign</h2>

        <div className="flex gap-2">
          <input
            id="campaign-name-input"
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-64"
            placeholder="Campaign Name"
            value={newCampaignName}
            onChange={handleCampaignNameChange}
            aria-label="New campaign name"
          />
          <button
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded"
            onClick={createCampaign}
            aria-label="Create new campaign"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* SELECT CAMPAIGN */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Your Campaigns</h2>

        {campaigns.length === 0 && (
          <p className="text-slate-400">No campaigns created yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className={`px-4 py-2 border rounded cursor-pointer ${
                activeCampaignId === c.id
                  ? "border-amber-400 bg-amber-500/20"
                  : "border-slate-600 hover:bg-slate-800"
              }`}
              onClick={() => handleCampaignClick(c.id)}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* CREATE CHARACTER + LIST */}
      {activeCampaignId && (
        <div>
          <h2 className="text-2xl font-semibold mb-3">Create Character</h2>

          <div className="flex gap-2 mb-4">
            <input
              id="character-name-input"
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-64"
              placeholder="Character Name"
              value={characterName}
              onChange={handleCharacterNameChange}
              aria-label="New character name"
            />

            <button
              className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded"
              onClick={createCharacter}
              aria-label="Create new character"
            >
              Create
            </button>
          </div>

          <h3 className="text-xl mb-2">Characters in campaign</h3>

          {characters.length === 0 ? (
            <p className="text-slate-400" role="status">No characters yet.</p>
          ) : (
            <ul 
              className="flex flex-col gap-2"
              role="list"
              aria-label="Characters in this campaign"
            >
              {characters.map((ch) => (
                <li
                  key={ch.id}
                  className="flex items-center justify-between border border-slate-700 rounded px-4 py-3 bg-slate-900/60"
                >
                  <div>
                    <div className="font-semibold">
                      {ch.header?.characterName ?? "Unnamed Character"}
                    </div>

                    <div className="text-xs text-slate-400">
                      Owner: {ch.userId ?? "Unclaimed"} · Editable:{" "}
                      {ch.isEditableByPlayer ? "Yes" : "No"}
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      Recovery: {ch.recoveryCode}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCharacterView(ch.id)}
                    className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
                    aria-label={`View ${ch.header?.characterName ?? "character"}`}
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}