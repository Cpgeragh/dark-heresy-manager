import { useState } from "react";
import { Button } from "./buttons/Button";
import { RemoveButton } from "./buttons/RemoveButton";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { PickerBody, PickerModal } from "./pickers/PickerModal";
import { uiTextBody } from "./styles/editableStyles";

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
      {open && verb === "Remove" && (
        <PickerModal
          title={title}
          query=""
          onQueryChange={() => undefined}
          onClose={close}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            blockedMessage ? (
              <Button fullWidth variant="ghost" onClick={close}>
                Close
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {extra && (
                  <Button variant="warningOutline" onClick={run(extra.onClick)}>
                    {extra.label}
                  </Button>
                )}
                <Button variant="primary" onClick={run(onRemove)}>
                  {extra ? `${verb} ${kind}` : verb}
                </Button>
                <Button
                  className={extra ? "col-span-2" : undefined}
                  variant="neutral"
                  onClick={close}
                >
                  Cancel
                </Button>
              </div>
            )
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>{message}</p>
          </PickerBody>
        </PickerModal>
      )}
    </>
  );
}
