// src/pages/ClaimCharacter/DMTools.tsx

import { useState, useCallback } from "react";

interface Props {
  recovery: {
    campaignId: string;
    characterId: string;
    character: any;
    campaign: any;
  };
  onForceAssign: (uid: string) => Promise<void>;
  onForceRelease: () => Promise<void>;
}

export default function DMTools({ recovery, onForceAssign, onForceRelease }: Props) {
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
        />

        <button
          className="px-3 py-1 bg-blue-600 text-white rounded border border-blue-500 hover:bg-blue-500 text-xs"
          onClick={handleForceAssign}
        >
          Force Assign
        </button>
      </div>

      <button
        className="px-3 py-1 bg-red-700 text-white rounded border border-red-500 hover:bg-red-600 text-xs"
        onClick={onForceRelease}
      >
        Force Release
      </button>
    </div>
  );
}