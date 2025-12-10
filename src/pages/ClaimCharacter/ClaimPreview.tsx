// src/pages/ClaimCharacter/ClaimPreview.tsx

interface ClaimPreviewProps {
  character: any;
  campaign: any;
  onClaim: () => Promise<void> | void;
}

export function ClaimPreview({ character, campaign, onClaim }: ClaimPreviewProps) {
  return (
    <div className="border border-slate-700 bg-slate-900 p-4 rounded space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">
        Character Found
      </h2>

      <div className="text-slate-300 text-sm space-y-1">
        <p>
          <span className="text-slate-400">Character:</span>{" "}
          <span className="font-semibold">{character.header?.characterName ?? character.name}</span>
        </p>

        <p>
          <span className="text-slate-400">Campaign:</span>{" "}
          <span className="font-semibold">{campaign.name ?? "Unnamed Campaign"}</span>
        </p>
      </div>

      <button
        onClick={onClaim}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-semibold"
      >
        Claim This Character
      </button>
    </div>
  );
}