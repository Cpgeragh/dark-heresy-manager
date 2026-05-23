// src/pages/ClaimCharacter/DMTools.tsx

import { useState, useCallback } from "react";
import type { RecoveryLookupResult } from "./hooks/useRecoveryLookup";

interface Props {
  recovery: RecoveryLookupResult;
  onForceAssign: (uid: string) => Promise<void>;
  onForceRelease: () => Promise<void>;
  isForceAssigning?: boolean;
  isForceReleasing?: boolean;
}

export default function DMTools({ 
  recovery, 
  onForceAssign, 
  onForceRelease,
  isForceAssigning = false,
  isForceReleasing = false,
}: Props) {
  const [uid, setUid] = useState("");

  const handleUidChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUid(e.target.value);
  }, []);

  const handleForceAssign = useCallback(() => {
    if (uid.trim()) {
      onForceAssign(uid.trim());
    }
  }, [uid, onForceAssign]);

  return (
    <div className="border border-amber-600 bg-amber-900/20 p-4 rounded mt-6">
      <h2 className="text-lg font-semibold text-amber-300 mb-2">
        DM Tools
      </h2>

      <p className="text-sm text-amber-200 mb-2">
        Campaign: <code>{recovery.campaignId}</code>
      </p>
      <p className="text-sm text-amber-200 mb-4">
        Character: <code>{recovery.characterId}</code>
      </p>

      <div className="flex gap-2 mb-3">
        <input
          className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-100 font-mono text-xs flex-1"
          placeholder="Enter player UID"
          value={uid}
          onChange={handleUidChange}
          disabled={isForceAssigning}
        />

        <button
          className={`px-3 py-1 rounded border text-xs transition ${
            isForceAssigning
              ? "bg-blue-800 border-blue-700 text-blue-300 cursor-wait"
              : "bg-blue-600 border-blue-500 text-white hover:bg-blue-500"
          }`}
          onClick={handleForceAssign}
          disabled={isForceAssigning}
        >
          {isForceAssigning ? "Assigning..." : "Force Assign"}
        </button>
      </div>

      <button
        className={`px-3 py-1 rounded border text-xs transition ${
          isForceReleasing
            ? "bg-red-900 border-red-800 text-red-300 cursor-wait"
            : "bg-red-700 border-red-500 text-white hover:bg-red-600"
        }`}
        onClick={onForceRelease}
        disabled={isForceReleasing}
      >
        {isForceReleasing ? "Releasing..." : "Force Release"}
      </button>
    </div>
  );
}