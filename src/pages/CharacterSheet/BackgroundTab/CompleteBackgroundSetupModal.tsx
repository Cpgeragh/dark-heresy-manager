import type {
  Character,
  CharacterHeader,
  CyberneticItem,
  GearItem,
  TalentsAndTraitsBlock,
} from "../../../types/Character";
import { Button } from "../../../ui/buttons/Button";
import { ModalShell } from "../../../ui/modals/ModalShell";
import { CenteredTitleHeader } from "../../../ui/CenteredTitleHeader";
import { uiStackBody } from "../../../ui/styles/editableStyles";
import {
  colourAmberPlain,
  colourTextPrimary,
  colourDivider,
} from "../../../ui/styles/colourTokens";
import { BackgroundSetupFields } from "./BackgroundSetupFields";

interface CompleteBackgroundSetupModalProps {
  header: CharacterHeader;
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  saving?: boolean;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  cybernetics?: CyberneticItem[];
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<boolean | void>;
  gear?: GearItem[];
  onUpdateGear?: (next: GearItem[]) => void | Promise<boolean | void>;
  onUpdateCharacter?: (partial: Partial<Character>) => Promise<boolean>;
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
  onUpdateCharacter,
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
      <CenteredTitleHeader size="page" title="Complete Background" />

      <div className={`${uiStackBody} px-4 py-4 lg:px-6 lg:py-5`}>
        <p className={`text-sm ${colourTextPrimary} lg:text-base`}>
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
          onUpdateCharacter={onUpdateCharacter}
        />

        {!editable && (
          <p className={`text-sm ${colourAmberPlain} lg:text-base`}>
            The DM must enable character editing before you can complete this setup.
          </p>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-2 border-t ${colourDivider} px-4 py-4 lg:px-6 lg:py-5`}>
        <Button variant="neutral" onClick={onReturnToDashboard} disabled={saving}>
          Return
        </Button>
        <Button
          onClick={onComplete}
          disabled={!editable || !canContinue}
          loading={saving}
          loadingLabel="Saving"
        >
          Continue
        </Button>
      </div>
    </ModalShell>
  );
}
