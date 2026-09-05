// src/pages/CharacterSheet/CharacterKebabContent.tsx

import { useState, useCallback } from "react";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";
import { Button } from "../../ui/buttons/Button";
import { uiSubheading } from "../../ui/styles/editableStyles";
import { QrModal } from "../../ui/modals/QrModal";

interface Props {
  recoveryCode?: string;
  canManageRecoveryCode: boolean;
  onGenerateRecoveryCode: () => Promise<void>;
  onRevokeRecoveryCode: () => Promise<void>;
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
  onRevokeRecoveryCode,
  canExport,
  onExport,
  canPlayerRelease,
  onPlayerRelease,
  isReleasing,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
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

  const handleRevoke = useCallback(async () => {
    setRevoking(true);
    setRevokeError(null);
    try {
      await onRevokeRecoveryCode();
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Failed to revoke Recovery Code.");
    } finally {
      setRevoking(false);
    }
  }, [onRevokeRecoveryCode]);

  return (
    <div className="space-y-4">
      {/* Recovery Code */}
      {recoveryCode ? (
        <div className="space-y-2">
          <p className={uiSubheading}>Recovery Code</p>
          <div className="space-y-2">
            <code className="block w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-600 rounded text-amber-300 text-sm lg:text-base break-all">
              {recoveryCode}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copyCode}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowQr(true)}>
                Share
              </Button>
              {canManageRecoveryCode && (
                <Button variant="danger" size="sm" onClick={handleRevoke} disabled={revoking}>
                  {revoking ? "Revoking…" : "Revoke"}
                </Button>
              )}
            </div>
          </div>
          {revokeError && <p className="text-xs lg:text-sm text-red-400">{revokeError}</p>}
        </div>
      ) : (
        canManageRecoveryCode && (
          <div className="space-y-2">
            <p className={uiSubheading}>Recovery Code</p>
            <p className="text-xs lg:text-sm text-slate-400">
              This character has no Recovery Code yet.
            </p>
            <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate Recovery Code"}
            </Button>
            {generateError && <p className="text-xs lg:text-sm text-red-400">{generateError}</p>}
          </div>
        )
      )}

      {/* Export */}
      {canExport && (
        <div className="space-y-2">
          <p className={uiSubheading}>Character Data</p>
          <Button variant="secondary" size="sm" onClick={onExport}>
            Export JSON
          </Button>
        </div>
      )}

      {/* Release */}
      {canPlayerRelease && (
        <div className="space-y-2">
          <p className={uiSubheading}>Release Character</p>
          <p className="text-xs lg:text-sm text-slate-400">
            Unlinks this character from your account.
          </p>
          <Button variant="danger" onClick={onPlayerRelease} disabled={isReleasing}>
            {isReleasing ? "Releasing…" : "Release Character"}
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
