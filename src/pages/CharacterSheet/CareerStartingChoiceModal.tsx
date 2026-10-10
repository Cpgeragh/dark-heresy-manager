import { useState } from "react";
import { TALENT_LIST, type CareerData } from "shared-rules";
import { DEFAULT_SKILLS } from "../../data/reference/defaultSkills";
import type { CareerStartingChoices } from "../../types/Character";
import { Button } from "../../ui/buttons/Button";
import { ToggleButton } from "../../ui/buttons/ToggleButton";
import { colourToggleSelectedSky } from "../../ui/styles/colourTokens";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { uiFormLabel } from "../../ui/styles/editableStyles";

const skillNameById = new Map(DEFAULT_SKILLS.map((skill) => [skill.id, skill.name]));
const talentNameById = new Map(TALENT_LIST.map((talent) => [talent.id, talent.name]));

function talentOptionLabel(talentId: string, specialisation?: string): string {
  const name = talentNameById.get(talentId) ?? talentId;
  return specialisation ? `${name} (${specialisation})` : name;
}

export function CareerStartingChoiceModal({
  career,
  onComplete,
  onClose,
}: {
  career: CareerData;
  onComplete: (choices: CareerStartingChoices) => void;
  onClose: () => void;
}) {
  const skillGrants = (career.startingSkillGrants ?? [])
    .map((grant, index) => ({ grant, index }))
    .filter(({ grant }) => grant.options.length > 1);
  const talentGrants = (career.startingTalentGrants ?? [])
    .map((grant, index) => ({ grant, index }))
    .filter(({ grant }) => grant.options.length > 1);

  const [skillChoices, setSkillChoices] = useState<Record<number, number>>({});
  const [talentChoices, setTalentChoices] = useState<Record<number, number>>({});

  const allResolved =
    skillGrants.every(({ index }) => skillChoices[index] !== undefined) &&
    talentGrants.every(({ index }) => talentChoices[index] !== undefined);

  return (
    <PickerModal
      title={`${career.name} Starting Choices`}
      query=""
      onQueryChange={() => undefined}
      onClose={onClose}
      isEmpty={false}
      hideSearch
      maxWidth="max-w-md"
      footer={
        <Button
          variant="primary"
          disabled={!allResolved}
          onClick={() => onComplete({ skillChoices, talentChoices })}
        >
          Confirm
        </Button>
      }
    >
      <PickerBody>
        <div className="space-y-4">
          {skillGrants.map(({ grant, index }) => (
            <div key={`skill-${index}`} className="space-y-1.5">
              <label className={uiFormLabel}>Starting Skill</label>
              <div className="flex flex-wrap gap-2">
                {grant.options.map((option, optionIndex) => (
                  <ToggleButton
                    key={option.skillId}
                    selected={skillChoices[index] === optionIndex}
                    selectedClassName={colourToggleSelectedSky}
                    className="flex-1 px-3 py-2 text-sm"
                    onClick={() => setSkillChoices((prev) => ({ ...prev, [index]: optionIndex }))}
                  >
                    {skillNameById.get(option.skillId) ?? option.skillId}
                  </ToggleButton>
                ))}
              </div>
            </div>
          ))}
          {talentGrants.map(({ grant, index }) => (
            <div key={`talent-${index}`} className="space-y-1.5">
              <label className={uiFormLabel}>Starting Talent</label>
              <div className="flex flex-wrap gap-2">
                {grant.options.map((option, optionIndex) => (
                  <ToggleButton
                    key={`${option.talentId}-${option.specialisation ?? ""}`}
                    selected={talentChoices[index] === optionIndex}
                    selectedClassName={colourToggleSelectedSky}
                    className="flex-1 px-3 py-2 text-sm"
                    onClick={() => setTalentChoices((prev) => ({ ...prev, [index]: optionIndex }))}
                  >
                    {talentOptionLabel(option.talentId, option.specialisation)}
                  </ToggleButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PickerBody>
    </PickerModal>
  );
}
