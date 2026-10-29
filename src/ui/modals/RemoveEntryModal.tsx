import { ConfirmModal } from "./ConfirmModal";

export interface RemoveEntryExtra {
  label: string;
  message: string;
  onClick: () => unknown;
}

interface RemoveEntryModalProps {
  kind: string;
  name: string;
  onRemove: () => unknown;
  onCancel: () => void;
  from?: string;
  blockedMessage?: string;
  extra?: RemoveEntryExtra;
}

/** The shared pop-up for removing saved data without permanently deleting it. */
export function RemoveEntryModal({
  kind,
  name,
  onRemove,
  onCancel,
  from = "this character",
  blockedMessage,
  extra,
}: RemoveEntryModalProps) {
  const title = blockedMessage
    ? `Cannot Remove ${kind}`
    : extra
      ? `Manage ${kind}`
      : `Remove ${kind}`;
  const message = blockedMessage ?? extra?.message ?? `Remove ${name} from ${from}?`;
  const run = (action: () => unknown) => async () => {
    if ((await action()) !== false) onCancel();
  };

  if (blockedMessage) {
    return <ConfirmModal title={title} message={message} onCancel={onCancel} />;
  }

  return (
    <ConfirmModal
      title={title}
      message={message}
      confirmLabel={extra ? `Remove ${kind}` : "Remove"}
      onConfirm={run(onRemove)}
      extraAction={extra ? { label: extra.label, onClick: run(extra.onClick) } : undefined}
      onCancel={onCancel}
    />
  );
}
