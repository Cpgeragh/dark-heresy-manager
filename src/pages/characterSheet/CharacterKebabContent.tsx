// src/pages/characterSheet/CharacterKebabContent.tsx

import { useState, useCallback } from "react";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";
import { Button } from "../../ui/Button";
import { uiSubheading } from "../../ui/editableStyles";

interface Props {
  recoveryCode?: string;
  canExport: boolean;
  onExport: () => void;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  isReleasing: boolean;
}

export function CharacterKebabContent({
  recoveryCode,
  canExport,
  onExport,
  canPlayerRelease,
  onPlayerRelease,
  isReleasing,
}: Props) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Recovery Code */}
      {recoveryCode && (
        <div className="space-y-2">
          <p className={uiSubheading}>
            Recovery Code
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-600 rounded text-amber-300 text-sm lg:text-base break-all">
              {recoveryCode}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyCode}
              className="shrink-0"
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {/* Export */}
      {canExport && (
        <div className="space-y-2">
          <p className={uiSubheading}>
            Character Data
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
          >
            Export JSON
          </Button>
        </div>
      )}

      {/* Release */}
      {canPlayerRelease && (
        <div className="space-y-2">
          <p className={uiSubheading}>
            Release Character
          </p>
          <p className="text-xs lg:text-sm text-slate-400">Unlinks this character from your account.</p>
          <Button
            variant="danger"
            onClick={onPlayerRelease}
            disabled={isReleasing}
          >
            {isReleasing ? "Releasing…" : "Release Character"}
          </Button>
        </div>
      )}
    </div>
  );
}
