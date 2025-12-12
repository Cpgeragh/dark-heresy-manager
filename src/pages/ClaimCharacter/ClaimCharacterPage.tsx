// src/pages/ClaimCharacter/ClaimCharacterPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRecoveryLookup } from "./hooks/useRecoveryLookup";
import { useClaimActions } from "./hooks/useClaimActions";
import { useDmActions } from "./hooks/useDmActions";

import { ClaimForm } from "./ClaimForm";
import { ClaimPreview } from "./ClaimPreview";
import DMTools from "./DMTools";

export default function ClaimCharacterPage() {
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const navigate = useNavigate();

  const { loading, error, data, lookup } = useRecoveryLookup();
  const { claimCharacter } = useClaimActions();
  const { forceAssign, forceRelease } = useDmActions();

  async function handleClaim() {
    if (!data || claiming) return;

    // Ownership gate (final safety net)
    if (data.ownership !== "unclaimed") {
      setClaimError("This character cannot be claimed.");
      return;
    }

    try {
      setClaiming(true);
      setClaimError(null);

      await claimCharacter(data.campaignId, data.character);

      // Redirect only after successful ownership write
      navigate(
        `/campaign/${data.campaignId}/character/${data.characterId}`
      );
    } catch (err: any) {
      console.error(err);
      setClaimError(
        err?.message ??
          "Failed to claim character. It may have been claimed already."
      );
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 text-slate-200">
      <h1 className="text-3xl font-bold text-center mb-4">
        Claim Character
      </h1>

      {/* CLAIM FORM */}
      <ClaimForm
        code={code}
        onCodeChange={setCode}
        onSubmit={() => lookup(code)}
        loading={loading}
      />

      {/* LOOKUP ERROR */}
      {error && (
        <p className="text-red-400 text-sm border border-red-600 bg-red-900/20 p-2 rounded">
          {error}
        </p>
      )}

      {/* CLAIM ERROR */}
      {claimError && (
        <p className="text-red-400 text-sm border border-red-600 bg-red-900/20 p-2 rounded">
          {claimError}
        </p>
      )}

      {/* PREVIEW */}
      {data && (
        <ClaimPreview
          character={data.character}
          campaign={data.campaign}
          ownership={data.ownership}
          onClaim={handleClaim}
        />
      )}

      {/* DM TOOLS */}
      {data && (
        <DMTools
          recovery={data}
          onForceAssign={(uid) =>
            forceAssign(data.campaignId, data.character.id, uid)
          }
          onForceRelease={() =>
            forceRelease(data.campaignId, data.character.id)
          }
        />
      )}

      {claiming && (
        <p className="text-xs text-slate-400 text-center">
          Claiming character…
        </p>
      )}
    </div>
  );
}