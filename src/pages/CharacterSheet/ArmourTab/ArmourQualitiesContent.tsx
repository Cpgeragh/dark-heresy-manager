// src/pages/CharacterSheet/ArmourTab/ArmourQualitiesContent.tsx

import { InfoModal } from "../../../components/InfoModal";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import { PickerRowLine } from "../../../ui/pickers/PickerRowParts";
import { uiRuleName, uiStackBody, uiTextDescription } from "../../../ui/styles/editableStyles";

/** The rule names and descriptions behind the Qualities line of an armour piece or force field. */
export function ArmourQualitiesContent({ qualities }: { qualities: string[] }) {
  return (
    <div className={uiStackBody}>
      {qualities.map((name) => {
        const desc = ARMOUR_SPECIAL_RULES[name];
        if (!desc) return null;
        return (
          <div key={name}>
            <p className={uiRuleName}>{name}</p>
            <p className={`${uiTextDescription} mt-1`}>{desc}</p>
          </div>
        );
      })}
    </div>
  );
}

/** The Qualities line of an armour or force field picker row, shown only when there are qualities. */
export function ArmourQualitiesLine({ name, qualities }: { name: string; qualities?: string[] }) {
  if (!qualities || qualities.length === 0) return null;
  return (
    <PickerRowLine
      label="Qualities"
      value={qualities.join(", ")}
      info={
        <InfoModal
          title={`${name} Qualities`}
          content={<ArmourQualitiesContent qualities={qualities} />}
          as="span"
        />
      }
    />
  );
}
