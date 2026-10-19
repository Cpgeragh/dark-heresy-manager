import { useState } from "react";
import { Button } from "./buttons/Button";
import { RemoveButton } from "./buttons/RemoveButton";
import { PickerBody, PickerModal } from "./pickers/PickerModal";
import { uiTextBody } from "./styles/editableStyles";

interface RemoveEntryExtra {
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
  const close = () => setOpen(false);
  const title = blockedMessage
    ? `Cannot ${verb} ${kind}`
    : extra
      ? `Manage ${kind}`
      : `${verb} ${kind}`;
  const message = blockedMessage ?? extra?.message ?? `${verb} ${name} from ${from}?`;
  const run = (action: () => unknown) => async () => {
    if ((await action()) !== false) close();
  };

  return (
    <>
      <RemoveButton label={`${verb} ${name}`} className={className} onClick={() => setOpen(true)} />
      {open && (
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
