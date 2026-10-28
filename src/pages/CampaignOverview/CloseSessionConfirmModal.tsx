// src/pages/CampaignOverview/CloseSessionConfirmModal.tsx
// Asks whether the XP is right before the session is closed. No cancels the save.

import { ConfirmModal } from "../../ui/modals/ConfirmModal";

interface Props {
  xpAwarded: number;
  attendeeNames: string[];
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function CloseSessionConfirmModal({
  xpAwarded,
  attendeeNames,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const givesXp = xpAwarded > 0 && attendeeNames.length > 0;
  const sortedNames = [...attendeeNames].sort((a, b) => a.localeCompare(b));

  return (
    <ConfirmModal
      title="Close Session"
      message={
        givesXp
          ? `Give ${xpAwarded} XP to ${joinNames(sortedNames)}. Is that correct?`
          : "No XP will be given. Close the session?"
      }
      confirmLabel="Close Session"
      busy={busy}
      loadingLabel="Closing"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
