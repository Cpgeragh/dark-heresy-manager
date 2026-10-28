import { useState } from "react";
import { RemoveButton } from "./buttons/RemoveButton";
import { ConfirmModal } from "./modals/ConfirmModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";

export interface RemoveEntryExtra {
  label: string;
  message: string;
  onClick: () => unknown;
}

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
  const title = blockedMessage
    ? `Cannot ${verb} ${kind}`
    : extra
      ? `Manage ${kind}`
      : `${verb} ${kind}`;
  const message = blockedMessage ?? extra?.message ?? `${verb} ${name} from ${from}?`;
  const run = (action: () => unknown) => async () => {
    if ((await action()) !== false) close();
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
      {open &&
        verb === "Remove" &&
        (blockedMessage ? (
          <ConfirmModal title={title} message={message} onCancel={close} />
        ) : (
          <ConfirmModal
            title={title}
            message={message}
            confirmLabel={extra ? `${verb} ${kind}` : verb}
            onConfirm={run(onRemove)}
            extraAction={extra ? { label: extra.label, onClick: run(extra.onClick) } : undefined}
            onCancel={close}
          />
        ))}
    </>
  );
}
