// src/pages/ClaimCharacter.tsx

import { useState } from "react";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

type Props = {
  user: User;
  onActiveCampaignChange: (id: string | null, name?: string) => void;
};

export default function ClaimCharacter({ user, onActiveCampaignChange }: Props) {
  const [code, setCode] = useState("");

  async function claim() {
    console.log("=== CLAIM START ===");
    console.log("Player UID:", user.uid);

    const recoveryCode = code.trim().toUpperCase();
    console.log("Recovery code entered:", recoveryCode);

    if (!recoveryCode) return alert("Enter a code.");

    const campaignsSnap = await getDocs(collection(db, "campaigns"));

    let foundCampaignId: string | null = null;
    let foundCharacterId: string | null = null;

    // First pass: find the matching character
    for (const campaign of campaignsSnap.docs) {
      const charsRef = collection(db, "campaigns", campaign.id, "characters");
      const charSnap = await getDocs(charsRef);

      for (const ch of charSnap.docs) {
        const data = ch.data();
        if (data.recoveryCode === recoveryCode) {
          foundCampaignId = campaign.id;
          foundCharacterId = ch.id;
          console.log("Match found in campaign:", foundCampaignId);
          console.log("Character ID:", foundCharacterId);
          break;
        }
      }

      if (foundCampaignId && foundCharacterId) break;
    }

    if (!foundCampaignId || !foundCharacterId) {
      alert("Invalid recovery code.");
      return;
    }

    // Safe: both are now guaranteed strings
    const charRef = doc(
      db,
      "campaigns",
      foundCampaignId,
      "characters",
      foundCharacterId
    );

    // Load the character document directly instead of re-querying whole campaign
    const charactersSnap = await getDocs(
      collection(db, "campaigns", foundCampaignId, "characters")
    );

    const existingDoc = charactersSnap.docs.find((d) => d.id === foundCharacterId);

    if (!existingDoc) {
      alert("Character not found.");
      return;
    }

    const existingData = existingDoc.data();
    console.log("Existing character document:", existingData);

    if (existingData.userId) {
      alert("This character is already claimed by another player.");
      return;
    }

    // Payload for claim
    const payload = {
      userId: user.uid,
      isEditableByPlayer: true,
    };

    console.log("Attempting update with payload:", payload);

    try {
      await updateDoc(charRef, payload);

      // Write claim log entry
      const logsRef = collection(
        db,
        "campaigns",
        foundCampaignId,
        "characters",
        foundCharacterId,
        "claimLog"
      );

      await addDoc(logsRef, {
        action: "claim",
        actorUid: user.uid,
        previousOwnerUid: null,
        newOwnerUid: user.uid,
        timestamp: serverTimestamp(),
      });

      console.log("=== CLAIM SUCCESS ===");

      // Reset campaign selection for consistency
      onActiveCampaignChange(null);

      alert("Character claimed successfully.");
    } catch (err) {
      console.error("Claim error:", err);
      alert("Claim failed. See console for details.");
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Claim Character</h1>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded w-full max-w-sm"
        placeholder="Enter recovery code"
      />

      <button
        onClick={claim}
        className="px-4 py-2 bg-amber-500 text-black font-semibold rounded mt-3"
      >
        Claim
      </button>
    </div>
  );
}