// src/ui/modals/RevealCodeModal.tsx
// The window that shows a recovery code with Copy code and Rotate Code, and the confirmation for rotating it.

import { useState } from "react";
import { Button } from "../buttons/Button";
import { PickerBody, PickerModal } from "../pickers/PickerModal";
import { colourAmberPlain } from "../styles/colourTokens";
import { uiTwoColumnGrid, uiCodeBox, uiCodeText } from "../styles/editableStyles";
import { ConfirmModal } from "./ConfirmModal";

interface RevealCodeModalProps {
  code: string;
  rotating: boolean;
  onClose: () => void;
  onCopy: () => unknown;
  /** Rotates the code and says whether it worked. The new code arrives through the code prop. */
  onRotate: () => Promise<boolean>;
}

export function RevealCodeModal({
  code,
  rotating,
  onClose,
  onCopy,
  onRotate,
}: RevealCodeModalProps) {
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);

  return (
    <>
      <PickerModal
        title="Reveal Code"
        query=""
        onQueryChange={() => undefined}
        onClose={onClose}
        isEmpty={false}
        hideSearch
        maxWidth="max-w-sm"
        suspended={rotateConfirmOpen}
        footer={
          <div className={uiTwoColumnGrid}>
            <Button variant="primary" onClick={() => void onCopy()}>
              Copy code
            </Button>
            <Button variant="neutral" onClick={() => setRotateConfirmOpen(true)}>
              Rotate Code
            </Button>
          </div>
        }
      >
        <PickerBody>
          <div className={uiCodeBox}>
            <span className={uiCodeText}>{code}</span>
          </div>
          <p className={`text-xs lg:text-sm ${colourAmberPlain} text-center`}>
            If anyone else may have seen this code, rotate it now to invalidate it.
          </p>
        </PickerBody>
      </PickerModal>

      {rotateConfirmOpen && (
        <ConfirmModal
          title="Rotate Code"
          message="Rotate code? A new one is generated and the old one stops working immediately."
          confirmLabel="Rotate"
          busy={rotating}
          loadingLabel="Rotating"
          onConfirm={async () => {
            if (await onRotate()) setRotateConfirmOpen(false);
          }}
          onCancel={() => setRotateConfirmOpen(false)}
        />
      )}
    </>
  );
}
