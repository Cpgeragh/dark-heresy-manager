import { useState } from "react";
import type { CareerData } from "../../data/careerData";
import { DEFAULT_SKILLS } from "../../data/defaultSkills";
import { TALENT_LIST } from "../../data/talentData";
import type { CareerStartingChoices } from "../../types/Character";
import { Button } from "../../ui/Button";
import { PickerBody, PickerModal } from "../../ui/PickerModal";
import { uiFormLabel } from "../../ui/editableStyles";

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
        <Button variant="primary" disabled={!allResolved} onClick={() => onComplete({ skillChoices, talentChoices })}>
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
                  <button
                    type="button"
                    key={option.skillId}
                    aria-pressed={skillChoices[index] === optionIndex}
                    onClick={() => setSkillChoices((prev) => ({ ...prev, [index]: optionIndex }))}
                    className={`flex-1 px-3 py-2 rounded border text-sm ${
                      skillChoices[index] === optionIndex
                        ? "border-sky-400 bg-sky-500/10 text-sky-300 font-semibold"
                        : "border-slate-500 bg-slate-800 text-slate-100"
                    }`}
                  >
                    {skillNameById.get(option.skillId) ?? option.skillId}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {talentGrants.map(({ grant, index }) => (
            <div key={`talent-${index}`} className="space-y-1.5">
              <label className={uiFormLabel}>Starting Talent</label>
              <div className="flex flex-wrap gap-2">
                {grant.options.map((option, optionIndex) => (
                  <button
                    type="button"
                    key={`${option.talentId}-${option.specialisation ?? ""}`}
                    aria-pressed={talentChoices[index] === optionIndex}
                    onClick={() => setTalentChoices((prev) => ({ ...prev, [index]: optionIndex }))}
                    className={`flex-1 px-3 py-2 rounded border text-sm ${
                      talentChoices[index] === optionIndex
                        ? "border-sky-400 bg-sky-500/10 text-sky-300 font-semibold"
                        : "border-slate-500 bg-slate-800 text-slate-100"
                    }`}
                  >
                    {talentOptionLabel(option.talentId, option.specialisation)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PickerBody>
    </PickerModal>
  );
}
