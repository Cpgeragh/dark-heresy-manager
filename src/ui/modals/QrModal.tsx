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
    <ModalShell ariaLabel={title} onClose={onClose} className="max-w-xs lg:max-w-sm overflow-y-auto">
      <ModalHeader title={title} onClose={onClose} />
      <div className="p-5 lg:p-6 space-y-4">
        <div className="p-3 bg-white rounded-lg flex justify-center">
          <QRCodeSVG value={url} size={220} />
        </div>
        <p className="text-xs lg:text-sm text-slate-500 break-all text-center">{url}</p>
      </div>
    </ModalShell>
  );
}
