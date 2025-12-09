// src/pages/ClaimCharacter.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { buildClaimLogPayload } from "../utils/claimLog";

export default function ClaimCharacterPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function normalize(input: string) {
    return input.trim().toUpperCase();
  }

  async function handleClaim() {
    setErrorMsg(null);

    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("You must be signed in to claim a character.");
      return;
    }

    const formatted = normalize(code);

    if (!/^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(formatted)) {
      setErrorMsg("Invalid recovery code format.");
      return;
    }

    setLoading(true);

    try {
      // 1. Lookup recovery index
      const indexRef = doc(db, "recoveryIndex", formatted);
      const indexSnap = await getDoc(indexRef);

      if (!indexSnap.exists()) {
        setErrorMsg("No character found with that recovery code.");
        setLoading(false);
        return;
      }

      const { campaignId, characterId } = indexSnap.data() as {
        campaignId: string;
        characterId: string;
      };

      // 2. Load campaign
      const campaignSnap = await getDoc(doc(db, "campaigns", campaignId));
      const campaignData = campaignSnap.data();

      // If DM enters a recovery code, redirect without claiming
      if (campaignData?.dmId === user.uid) {
        setErrorMsg(null);
        setLoading(true);

        setTimeout(() => {
          navigate(`/campaign/${campaignId}/character/${characterId}`);
        }, 1200);

        return;
      }

      // 3. Load character
      const charRef = doc(
        db,
        "campaigns",
        campaignId,
        "characters",
        characterId
      );

      const charSnap = await getDoc(charRef);

      if (!charSnap.exists()) {
        setErrorMsg("Character not found. (Corrupted index)");
        setLoading(false);
        return;
      }

      const charData = charSnap.data() as any;

      // Character belongs to someone else
      if (charData.userId && charData.userId !== user.uid) {
        setErrorMsg("This character is already claimed by another player.");
        setLoading(false);
        return;
      }

      // Character already owned by this user (new device)
      if (charData.userId === user.uid) {
        setErrorMsg(null);
        setLoading(true);

        setTimeout(() => {
          navigate(`/campaign/${campaignId}/character/${characterId}`);
        }, 1200);

        return;
      }

      // 4. Claim ownership
      await updateDoc(charRef, {
        userId: user.uid,
      });

      // 5. Write claim log
      const logRef = collection(
        db,
        "campaigns",
        campaignId,
        "characters",
        characterId,
        "claimLog"
      );

      await addDoc(
        logRef,
        buildClaimLogPayload("claim", user.uid, charData.userId ?? null, user.uid)
      );

      // 6. Redirect to character sheet
      navigate(`/campaign/${campaignId}/character/${characterId}`);
    } catch (err) {
      console.error("Claim error:", err);
      setErrorMsg("An unexpected error occurred. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto text-slate-100 mt-10">
      <h1 className="text-3xl font-bold mb-6">Claim Character</h1>

      <div className="mb-4">
        <label className="block mb-1 text-sm text-slate-300">
          Recovery Code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-slate-100"
          placeholder="DH-XXXX-XXXX"
        />
      </div>

      {errorMsg && (
        <div className="mb-4 text-red-400 border border-red-600 bg-red-900/30 p-3 rounded">
          {errorMsg}
        </div>
      )}

      {loading && !errorMsg && (
        <p className="text-xs text-slate-400 mb-3">Checking character ownership…</p>
      )}

      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full py-2 bg-amber-500 text-slate-900 font-semibold rounded disabled:opacity-50"
      >
        {loading ? "Claiming..." : "Claim Character"}
      </button>
    </div>
  );
}