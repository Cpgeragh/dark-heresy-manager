// src/pages/ClaimCharacter/ClaimForm.tsx

import { useCallback } from "react";
import { Button } from "../../ui/buttons/Button";
import { RecoveryCodeInput } from "../../ui/forms/RecoveryCodeInput";
import { formatRecoveryCodeInput } from "../../utils/recoveryCode";
import { validateRecoveryCode } from "../../utils/validation";
import { uiSection, uiTextBody } from "../../ui/styles/editableStyles";

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
    <div className={`${uiSection} space-y-3`}>
      <RecoveryCodeInput
        value={code}
        onValueChange={onCodeChange}
        disabled={loading}
        label="Enter Recovery Code"
        labelClassName={`block text-sm lg:text-base ${uiTextBody}`}
        accent="red"
        showValidation
      />

      <Button
        fullWidth
        disabled={!isValid}
        loading={loading}
        loadingLabel="Checking"
        onClick={handleSubmit}
      >
        Look Up Character
      </Button>
    </div>
  );
}
