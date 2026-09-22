// src/ui/modals/QrModal.tsx

import { QRCodeSVG } from "qrcode.react";
import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

interface Props {
  title: string;
  url: string;
  onClose: () => void;
}

export function QrModal({ title, url, onClose }: Props) {
  return (
    <ModalShell
      ariaLabel={title}
      onClose={onClose}
      className="max-w-[21rem] overflow-y-auto"
    >
      <ModalHeader title={title} onClose={onClose} />
      <div className="p-5 lg:p-6">
        <div className="mx-auto w-fit rounded-lg bg-white p-3">
          <QRCodeSVG value={url} size={200} />
        </div>
      </div>
    </ModalShell>
  );
}
