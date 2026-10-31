// src/pages/CharacterSheet/CharacterKebabContent.tsx

import { useState, useCallback } from "react";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";
import { Button } from "../../ui/buttons/Button";
import {
  uiCodeBox,
  uiCodeText,
  uiSubheading,
  uiTextError,
  uiTextMeta,
  uiStackBody,
  uiStackList,
} from "../../ui/styles/editableStyles";
import { QrModal } from "../../ui/modals/QrModal";

interface Props {
  recoveryCode?: string;
  canManageRecoveryCode: boolean;
  onGenerateRecoveryCode: () => Promise<void>;
  onRequestRevoke: () => void;
  canExport: boolean;
  onExport: () => void;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  isReleasing: boolean;
}

export function CharacterKebabContent({
  recoveryCode,
  canManageRecoveryCode,
  onGenerateRecoveryCode,
  onRequestRevoke,
  canExport,
  onExport,
  canPlayerRelease,
  onPlayerRelease,
  isReleasing,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const copyCode = useCallback(async () => {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error("Failed to copy recovery code:", err);
    }
  }, [recoveryCode]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await onGenerateRecoveryCode();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate Recovery Code.");
    } finally {
      setGenerating(false);
    }
  }, [onGenerateRecoveryCode]);

  return (
    <div className={uiStackBody}>
      {/* Recovery Code */}
      {recoveryCode ? (
        <div className={uiStackList}>
          <p className={uiSubheading}>Recovery Code</p>
          <div className={uiStackList}>
            <code className={`block w-full ${uiCodeBox} ${uiCodeText}`}>{recoveryCode}</code>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copyCode}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowQr(true)}>
                Share
              </Button>
              {canManageRecoveryCode && (
                <Button variant="danger" size="sm" onClick={onRequestRevoke}>
                  Revoke
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        canManageRecoveryCode && (
          <div className={uiStackList}>
            <p className={uiSubheading}>Recovery Code</p>
            <p className={uiTextMeta}>This character has no Recovery Code yet.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerate}
              loading={generating}
              loadingLabel="Generating"
            >
              Generate Recovery Code
            </Button>
            {generateError && (
              <p className={`text-xs lg:text-sm ${uiTextError}`}>{generateError}</p>
            )}
          </div>
        )
      )}

      {/* Export */}
      {canExport && (
        <div className={uiStackList}>
          <p className={uiSubheading}>Character Data</p>
          <Button variant="secondary" size="sm" onClick={onExport}>
            Export JSON
          </Button>
        </div>
      )}

      {/* Release */}
      {canPlayerRelease && (
        <div className={uiStackList}>
          <p className={uiSubheading}>Release Character</p>
          <p className={uiTextMeta}>
            Unlinks this character from your account. To move devices, connect the new device with
            your account recovery code instead.
          </p>
          <Button
            variant="danger"
            onClick={onPlayerRelease}
            loading={isReleasing}
            loadingLabel="Releasing"
          >
            Release Character
          </Button>
        </div>
      )}

      {recoveryCode && showQr && (
        <QrModal
          title="Share Character"
          url={`${window.location.origin}?code=${recoveryCode}`}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}
