// src/pages/CharacterSheet/useRevokeRecoveryCodeFlow.tsx
//
// Asks before a character's Recovery Code is revoked. The question is drawn by the sheet, not by
// the header menu, because the menu closes on any press outside it.

import { useCallback, useState, type ReactNode } from "react";
import { useToast } from "../../components/Toast";
import { ConfirmModal } from "../../ui/modals/ConfirmModal";

export function useRevokeRecoveryCodeFlow(revoke: () => Promise<void>): {
  begin: () => void;
  modal: ReactNode;
} {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await revoke();
      setOpen(false);
    } catch (error) {
      console.error("Failed to revoke Recovery Code:", error);
      toast.error(error instanceof Error ? error.message : "Failed to revoke Recovery Code.");
    }
  };

  const begin = useCallback(() => setOpen(true), []);

  const modal = open ? (
    <ConfirmModal
      title="Revoke Recovery Code?"
      message="This code, and any link or QR code that carries it, will stop working. No replacement is issued."
      confirmLabel="Revoke"
      confirmVariant="danger"
      loadingLabel="Revoking"
      onConfirm={handleConfirm}
      onCancel={() => setOpen(false)}
    />
  ) : null;

  return { begin, modal };
}
