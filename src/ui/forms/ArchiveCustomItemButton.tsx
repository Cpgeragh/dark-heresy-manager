// src/ui/forms/ArchiveCustomItemButton.tsx

import { useState } from "react";
import { Button } from "../buttons/Button";
import { ConfirmModal } from "../modals/ConfirmModal";

interface ArchiveCustomItemButtonProps {
  name: string;
  /** Any library action is running for this item. */
  busy: boolean;
  /** The archive itself is running for this item. */
  archiving: boolean;
  /** Archives the item. Returning false leaves the pop-up open. */
  onArchive: () => unknown;
}

/** The Archive button for a custom item, with the pop-up that asks before it removes every copy. */
export function ArchiveCustomItemButton({
  name,
  busy,
  archiving,
  onArchive,
}: ArchiveCustomItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="xs" variant="warningOutline" disabled={busy} onClick={() => setOpen(true)}>
        Archive
      </Button>
      {open && (
        <ConfirmModal
          title="Archive Custom Item"
          message={`This archives ${name} and removes it from every character in this campaign.`}
          confirmLabel="Archive"
          confirmVariant="warning"
          busy={archiving}
          loadingLabel="Archiving"
          onConfirm={async () => {
            if ((await onArchive()) !== false) setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
