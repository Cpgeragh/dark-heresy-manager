// src/pages/ClaimCharacter/ClaimForm.tsx

import { useCallback } from "react";

const RECOVERY_CODE_REGEX = /^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function normalizeRecoveryCode(input: string) {
  return input.toUpperCase().trim().replace(/\s+/g, "");
}

interface ClaimFormProps {
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function ClaimForm({ code, onCodeChange, onSubmit, loading }: ClaimFormProps) {
  const normalized = normalizeRecoveryCode(code);
  const isValid = RECOVERY_CODE_REGEX.test(normalized);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCodeChange(e.target.value);
    },
    [onCodeChange]
  );

  const handleSubmit = useCallback(() => {
    if (!isValid || loading) return;
    onSubmit();
  }, [isValid, loading, onSubmit]);

  return (
    <div className="border border-slate-700 bg-slate-900 p-4 rounded space-y-3">
      <label className="block text-sm text-slate-300">Enter Recovery Code</label>

      <input
        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-full font-code [font-feature-settings:'zero'] text-slate-100"
        placeholder="DH-XXXX-XXXX"
        value={code}
        onChange={handleChange}
        inputMode="text"
        autoCapitalize="characters"
        spellCheck={false}
      />

      {/* Format helper */}
      <div className="text-xs text-slate-400">
        Format: <span className="font-code [font-feature-settings:'zero']">DH-XXXX-XXXX</span>{" "}
        <span className={isValid ? "text-green-400" : "text-slate-500"}>
          {isValid ? "Valid" : "Not valid yet"}
        </span>
      </div>

      <button
        disabled={loading || !isValid}
        onClick={handleSubmit}
        className={`w-full px-4 py-2 rounded font-semibold text-slate-900
          ${
            loading
              ? "bg-amber-300 cursor-wait"
              : !isValid
                ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400"
          }`}
      >
        {loading ? "Checking..." : "Look Up Character"}
      </button>
    </div>
  );
}
