import { useState } from "react";
import { TALENT_LIST, type CareerData } from "shared-rules";
import { DEFAULT_SKILLS } from "../../data/reference/defaultSkills";
import type { CareerStartingChoices } from "../../types/Character";
import { Button } from "../../ui/buttons/Button";
import { ToggleButton } from "../../ui/buttons/ToggleButton";
import { colourToggleSelected } from "../../ui/styles/colourTokens";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { FormLabel } from "../../ui/forms/FormLabel";
import { uiStackBody, uiStackField } from "../../ui/styles/editableStyles";

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
  onComplete: (choices: CareerStartingChoices) => void | Promise<boolean | void>;
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
        <div className={uiStackBody}>
          {skillGrants.map(({ grant, index }) => (
            <fieldset key={`skill-${index}`} className={uiStackField}>
              <FormLabel as="legend">Starting Skill</FormLabel>
              <div className="flex flex-wrap gap-2">
                {grant.options.map((option, optionIndex) => (
                  <ToggleButton
                    key={option.skillId}
                    selected={skillChoices[index] === optionIndex}
                    selectedClassName={colourToggleSelected.red}
                    className="flex-1 px-3 py-2 text-sm"
                    onClick={() => setSkillChoices((prev) => ({ ...prev, [index]: optionIndex }))}
                  >
                    {skillNameById.get(option.skillId) ?? option.skillId}
                  </ToggleButton>
                ))}
              </div>
            </fieldset>
          ))}
          {talentGrants.map(({ grant, index }) => (
            <fieldset key={`talent-${index}`} className={uiStackField}>
              <FormLabel as="legend">Starting Talent</FormLabel>
              <div className="flex flex-wrap gap-2">
                {grant.options.map((option, optionIndex) => (
                  <ToggleButton
                    key={`${option.talentId}-${option.specialisation ?? ""}`}
                    selected={talentChoices[index] === optionIndex}
                    selectedClassName={colourToggleSelected.red}
                    className="flex-1 px-3 py-2 text-sm"
                    onClick={() => setTalentChoices((prev) => ({ ...prev, [index]: optionIndex }))}
                  >
                    {talentOptionLabel(option.talentId, option.specialisation)}
                  </ToggleButton>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </PickerBody>
    </PickerModal>
  );
}
