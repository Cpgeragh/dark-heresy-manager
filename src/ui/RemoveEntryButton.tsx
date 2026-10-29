import { useState } from "react";
import { RemoveButton } from "./buttons/RemoveButton";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { RemoveEntryModal, type RemoveEntryExtra } from "./modals/RemoveEntryModal";

export type { RemoveEntryExtra } from "./modals/RemoveEntryModal";

interface RemoveEntryButtonProps {
  kind: string;
  name: string;
  onRemove: () => unknown;
  verb?: "Remove" | "Delete";
  from?: string;
  blockedMessage?: string;
  extra?: RemoveEntryExtra;
  className?: string;
}

export function RemoveEntryButton({
  kind,
  name,
  onRemove,
  verb = "Remove",
  from = "this character",
  blockedMessage,
  extra,
  className,
}: RemoveEntryButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const close = () => {
    if (!deleting) setOpen(false);
  };
  const runDelete = async () => {
    setDeleting(true);
    try {
      if ((await onRemove()) !== false) setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <RemoveButton label={`${verb} ${name}`} className={className} onClick={() => setOpen(true)} />
      {open && verb === "Delete" && (
        <DeleteConfirmModal
          title={`Delete ${kind}`}
          message={`This permanently deletes ${name} from ${from}. This cannot be undone.`}
          typedLabel={`Type DELETE to permanently delete ${name}`}
          ready
          deleting={deleting}
          onConfirm={runDelete}
          onCancel={close}
        />
      )}
      {open && verb === "Remove" && (
        <RemoveEntryModal
          kind={kind}
          name={name}
          from={from}
          blockedMessage={blockedMessage}
          extra={extra}
          onRemove={onRemove}
          onCancel={close}
        />
      )}
    </>
  );
}
