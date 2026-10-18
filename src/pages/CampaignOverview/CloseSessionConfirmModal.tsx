// src/pages/CampaignOverview/CloseSessionConfirmModal.tsx
// Asks whether the XP is right before the session is closed. No cancels the save.

import { Button } from "../../ui/buttons/Button";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { uiTextBody } from "../../ui/styles/editableStyles";

interface Props {
  xpAwarded: number;
  attendeeNames: string[];
  busy: boolean;
  onYes: () => void;
  onNo: () => void;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function CloseSessionConfirmModal({ xpAwarded, attendeeNames, busy, onYes, onNo }: Props) {
  const givesXp = xpAwarded > 0 && attendeeNames.length > 0;
  const sortedNames = [...attendeeNames].sort((a, b) => a.localeCompare(b));

  return (
    <PickerModal
      title="Close Session"
      query=""
      onQueryChange={() => undefined}
      onClose={() => {
        if (!busy) onNo();
      }}
      isEmpty={false}
      hideSearch
      maxWidth="max-w-sm"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" loading={busy} loadingLabel="Closing" onClick={onYes}>
            Yes
          </Button>
          <Button variant="neutral" disabled={busy} onClick={onNo}>
            No
          </Button>
        </div>
      }
    >
      <PickerBody>
        <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
          {givesXp
            ? `Give ${xpAwarded} XP to ${joinNames(sortedNames)}. Is that correct?`
            : "No XP will be given. Close the session?"}
        </p>
      </PickerBody>
    </PickerModal>
  );
}
