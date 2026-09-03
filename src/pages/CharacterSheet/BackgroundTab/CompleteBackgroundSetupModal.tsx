import type {
  CharacterHeader,
  CyberneticItem,
  GearItem,
  TalentsAndTraitsBlock,
} from "../../../types/Character";
import { Button } from "../../../ui/buttons/Button";
import { ModalShell } from "../../../ui/modals/ModalShell";
import { BackgroundSetupFields } from "./BackgroundSetupFields";

interface CompleteBackgroundSetupModalProps {
  header: CharacterHeader;
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  saving?: boolean;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  cybernetics?: CyberneticItem[];
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<void>;
  gear?: GearItem[];
  onUpdateGear?: (next: GearItem[]) => void | Promise<void>;
  onReturnToDashboard: () => void;
  onComplete: () => void;
}

export function CompleteBackgroundSetupModal({
  header,
  talents,
  editable,
  saving = false,
  onUpdateHeader,
  onUpdateTalents,
  cybernetics = [],
  onUpdateCybernetics,
  gear = [],
  onUpdateGear,
  onReturnToDashboard,
  onComplete,
}: CompleteBackgroundSetupModalProps) {
  const canContinue = Boolean(talents.homeworld && header.career && header.rank);

  return (
    <ModalShell
      ariaLabel="Complete Background"
      closeOnBackdrop={false}
      closeOnEscape={false}
      onClose={() => undefined}
      viewportAware
      className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto"
    >
      <div className="border-b border-slate-700 px-4 py-4 text-center lg:px-6 lg:py-5">
        <h2 className="font-cinzel text-base font-bold text-red-500 lg:text-lg">
          Complete Background
        </h2>
      </div>

      <div className="space-y-4 px-4 py-4 lg:px-6 lg:py-5">
        <p className="text-sm text-slate-200 lg:text-base">
          Choose your Homeworld and Career before entering the character sheet. Your starting Rank
          is assigned automatically by your Career.
        </p>

        <BackgroundSetupFields
          header={header}
          talents={talents}
          editable={editable && !saving}
          onUpdateHeader={onUpdateHeader}
          onUpdateTalents={onUpdateTalents}
          cybernetics={cybernetics}
          onUpdateCybernetics={onUpdateCybernetics}
          gear={gear}
          onUpdateGear={onUpdateGear}
        />

        {!editable && (
          <p className="text-sm text-amber-300 lg:text-base">
            The DM must enable character editing before you can complete this setup.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-700 px-4 py-4 lg:px-6 lg:py-5">
        <Button variant="neutral" onClick={onReturnToDashboard} disabled={saving}>
          Return
        </Button>
        <Button
          onClick={onComplete}
          disabled={!editable || !canContinue || saving}
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </ModalShell>
  );
}
