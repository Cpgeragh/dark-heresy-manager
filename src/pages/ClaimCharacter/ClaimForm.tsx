// src/pages/ClaimCharacter/ClaimForm.tsx

import { useCallback } from "react";
import { Button } from "../../ui/Button";

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
    <div className="border border-slate-700 bg-slate-900 p-4 lg:p-5 rounded space-y-3">
      <label className="block text-sm lg:text-base text-slate-300">Enter Recovery Code</label>

      <input
        className="px-3 lg:px-4 py-2 lg:py-2.5 bg-slate-800 border border-slate-600 rounded w-full font-code [font-feature-settings:'zero'] text-sm lg:text-base text-slate-100 focus:outline-none focus:border-red-500"
        placeholder="DH-XXXX-XXXX"
        value={code}
        onChange={handleChange}
        inputMode="text"
        autoCapitalize="characters"
        spellCheck={false}
      />

      {/* Format helper */}
      <div className="text-xs lg:text-sm text-slate-400">
        Format: <span className="font-code [font-feature-settings:'zero']">DH-XXXX-XXXX</span>{" "}
        <span className={isValid ? "text-green-400" : "text-slate-500"}>
          {isValid ? "Valid" : "Not valid yet"}
        </span>
      </div>

      <Button fullWidth disabled={loading || !isValid} onClick={handleSubmit}>
        {loading ? "Checking…" : "Look Up Character"}
      </Button>
    </div>
  );
}
