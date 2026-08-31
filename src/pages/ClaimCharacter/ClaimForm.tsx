// src/pages/ClaimCharacter/ClaimForm.tsx

import { useCallback } from "react";
import { Button } from "../../ui/Button";
import { RecoveryCodeInput } from "../../ui/RecoveryCodeInput";
import { formatRecoveryCodeInput } from "../../utils/recoveryCode";
import { validateRecoveryCode } from "../../utils/validation";

interface ClaimFormProps {
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function ClaimForm({ code, onCodeChange, onSubmit, loading }: ClaimFormProps) {
  const normalized = formatRecoveryCodeInput(code);
  const isValid = validateRecoveryCode(normalized).isValid;

  const handleSubmit = useCallback(() => {
    if (!isValid || loading) return;
    onSubmit();
  }, [isValid, loading, onSubmit]);

  return (
    <div className="border border-slate-700 bg-slate-900 p-4 lg:p-5 rounded space-y-3">
      <RecoveryCodeInput
        value={code}
        onValueChange={onCodeChange}
        disabled={loading}
        label="Enter Recovery Code"
        labelClassName="block text-sm lg:text-base text-slate-300"
        accent="red"
        showValidation
      />

      <Button fullWidth disabled={loading || !isValid} onClick={handleSubmit}>
        {loading ? "Checking…" : "Look Up Character"}
      </Button>
    </div>
  );
}
