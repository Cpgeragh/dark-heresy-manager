// src/pages/DMDashboard.tsx

import { useEffect, useState } from "react";
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
  const [campaigns, setCampaigns] = useState<
    { id: string; name: string; dmId: string }[]
  >([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [characterName, setCharacterName] = useState("");

  const [characters, setCharacters] = useState<
    { id: string; name: string; recoveryCode: string; userId: string | null }[]
  >([]);

  // Load campaigns owned by this DM
  useEffect(() => {
    async function loadCampaigns() {
      const snap = await getDocs(collection(db, "campaigns"));
      const list: { id: string; name: string; dmId: string }[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.dmId === user.uid) {
          list.push({
            id: docSnap.id,
            name: data.name ?? "Untitled",
            dmId: data.dmId,
          });
        }
      });

      setCampaigns(list);
    }

    loadCampaigns();
  }, [user.uid]);

  // Watch characters inside the active campaign
  useEffect(() => {
    if (!activeCampaignId) {
      setCharacters([]);
      return;
    }

    const ref = collection(db, "campaigns", activeCampaignId, "characters");

    const unsub = onSnapshot(ref, (snap) => {
      const list: any[] = snap.docs.map((c) => ({
        id: c.id,
        ...(c.data() as any),
      }));
      setCharacters(list);
    });

    return () => unsub();
  }, [activeCampaignId]);

  // Create a campaign
  async function createCampaign() {
    const name = newCampaignName.trim() || "Untitled campaign";
    const newRef = doc(collection(db, "campaigns"));

    await setDoc(newRef, {
      name,
      dmId: user.uid,
      createdAt: new Date(),
    });

    setNewCampaignName("");
    onActiveCampaignChange(newRef.id);
  }

  // Generate recovery code
  function generateRecoveryCode() {
    const seg = () =>
      Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DH-${seg()}-${seg()}`;
  }

  // Create Character (FULL OBJECT)
  async function createCharacter() {
    if (!activeCampaignId) return alert("No campaign selected.");

    const trimmedName = characterName.trim();
    if (!trimmedName) return alert("Enter a character name.");

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

      alert(`Character created.\nRecovery Code: ${recoveryCode}`);
      setCharacterName("");
    } catch (err) {
      console.error("Character creation error:", err);
      alert("Failed to create character.");
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
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-64"
            placeholder="Campaign Name"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded"
            onClick={createCampaign}
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
              onClick={() => onActiveCampaignChange(c.id)}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* CREATE CHARACTER */}
      {activeCampaignId && (
        <div>
          <h2 className="text-2xl font-semibold mb-3">Create Character</h2>

          <div className="flex gap-2 mb-4">
            <input
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-64"
              placeholder="Character Name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
            />

            <button
              className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded"
              onClick={createCharacter}
            >
              Create
            </button>
          </div>

          {/* Character List */}
          <h3 className="text-xl mb-2">Characters in campaign:</h3>

          {characters.length === 0 ? (
            <p className="text-slate-400">No characters yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {characters.map((ch) => (
                <li
                  key={ch.id}
                  className="border border-slate-700 rounded px-4 py-2 bg-slate-900"
                >
                  <div className="font-semibold">{ch.name}</div>
                  <div className="text-sm text-slate-400">
                    Recovery Code: {ch.recoveryCode}
                  </div>
                  <div className="text-sm text-slate-400">
                    Claimed by: {ch.userId || "Unclaimed"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}