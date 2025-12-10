// src/pages/ClaimCharacter/ClaimForm.tsx

interface ClaimFormProps {
  code: string;
  onCodeChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function ClaimForm({ code, onCodeChange, onSubmit, loading }: ClaimFormProps) {
  return (
    <div className="border border-slate-700 bg-slate-900 p-4 rounded space-y-3">
      <label className="block text-sm text-slate-300">
        Enter Recovery Code
      </label>

      <input
        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-full font-mono text-slate-100"
        placeholder="DH-XXXX-XXXX"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
      />

      <button
        disabled={loading}
        onClick={onSubmit}
        className={`w-full px-4 py-2 rounded font-semibold text-slate-900 
          ${loading ? "bg-amber-300 cursor-wait" : "bg-amber-500 hover:bg-amber-400"}
        `}
      >
        {loading ? "Checking..." : "Look Up Character"}
      </button>
    </div>
  );
}