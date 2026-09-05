import { useState } from "react";
import type { HomeworldTraitChoices } from "../../types/Character";
import { Button } from "../../ui/buttons/Button";
import { RequiredFieldsNote } from "../../ui/forms/CustomFormFooter";
import { editableInputClass, uiFormLabel } from "../../ui/styles/editableStyles";
import { OptionPickerScreen, type PickerOption } from "../../ui/pickers/OptionPickerScreen";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { PickerField } from "../../ui/pickers/PickerField";
import { sanitizePositiveIntegerInput } from "../../utils/formInput";

const NOBLE_PEER_OPTIONS: readonly PickerOption[] = [
  "Academics",
  "Adeptus Mechanicus",
  "Administratum",
  "Astropaths",
  "Ecclesiarchy",
  "Government",
  "Mercantile",
  "Military",
  "Underworld",
].map((value) => ({ value, label: value }));

const WEAPON_OPTIONS: readonly PickerOption[] = [
  { value: "Las", label: "Las" },
  { value: "SP", label: "SP" },
];

type ChoicePicker = "peer" | "basic" | "pistol" | null;

export function HomeworldTraitAcquisitionModal({
  homeworldId,
  onComplete,
  onClose,
}: {
  homeworldId: string;
  onComplete: (choices: HomeworldTraitChoices) => void;
  onClose: () => void;
}) {
  const [picker, setPicker] = useState<ChoicePicker>(null);
  const [peerGroup, setPeerGroup] = useState("");
  const [basicWeaponGroup, setBasicWeaponGroup] = useState<"Las" | "SP" | "">("");
  const [pistolWeaponGroup, setPistolWeaponGroup] = useState<"Las" | "SP" | "">("");
  const [startingInsanity, setStartingInsanity] = useState("");

  const title =
    homeworldId === "noble-born"
      ? "Supremely Connected"
      : homeworldId === "schola-progenium"
        ? "Skill at Arms"
        : "Through a Mirror Darkly";

  if (picker) {
    const options = picker === "peer" ? NOBLE_PEER_OPTIONS : WEAPON_OPTIONS;
    const selected =
      picker === "peer" ? peerGroup : picker === "basic" ? basicWeaponGroup : pistolWeaponGroup;
    return (
      <OptionPickerScreen
        title={
          picker === "peer"
            ? "Peer Group"
            : picker === "basic"
              ? "Basic Weapon Group"
              : "Pistol Weapon Group"
        }
        options={options}
        selected={selected}
        onSelect={(value) => {
          if (picker === "peer") setPeerGroup(value);
          else if (picker === "basic") setBasicWeaponGroup(value as "Las" | "SP");
          else setPistolWeaponGroup(value as "Las" | "SP");
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    );
  }

  const insanityValue = Number(startingInsanity);
  const canSubmit =
    (homeworldId === "noble-born" && !!peerGroup) ||
    (homeworldId === "schola-progenium" && !!basicWeaponGroup && !!pistolWeaponGroup) ||
    (homeworldId === "mind-cleansed" &&
      Number.isInteger(insanityValue) &&
      insanityValue >= 3 &&
      insanityValue <= 7);

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => undefined}
      onClose={onClose}
      hideSearch
      isEmpty={false}
      maxWidth="max-w-lg"
    >
      <PickerBody>
        <div className="space-y-3">
          {homeworldId === "noble-born" && (
            <PickerField
              id="noble-peer-group"
              label="Additional Peer group"
              value={peerGroup}
              placeholder="Choose Peer group…"
              required
              onClick={() => setPicker("peer")}
            />
          )}
          {homeworldId === "schola-progenium" && (
            <>
              <PickerField
                id="schola-basic-group"
                label="Basic Weapon Training"
                value={basicWeaponGroup}
                placeholder="Choose Las or SP…"
                required
                onClick={() => setPicker("basic")}
              />
              <PickerField
                id="schola-pistol-group"
                label="Pistol Weapon Training"
                value={pistolWeaponGroup}
                placeholder="Choose Las or SP…"
                required
                onClick={() => setPicker("pistol")}
              />
            </>
          )}
          {homeworldId === "mind-cleansed" && (
            <div>
              <label htmlFor="mind-cleansed-insanity" className={uiFormLabel}>
                Starting Insanity Points <span className="text-red-500">*</span>
              </label>
              <input
                id="mind-cleansed-insanity"
                type="text"
                inputMode="numeric"
                value={startingInsanity}
                onChange={(event) =>
                  setStartingInsanity(sanitizePositiveIntegerInput(event.target.value))
                }
                placeholder="3–7"
                className={`${editableInputClass(true)} mt-0.5`}
              />
            </div>
          )}
          <RequiredFieldsNote />
          <Button
            fullWidth
            disabled={!canSubmit}
            onClick={() =>
              onComplete({
                ...(peerGroup ? { peerGroup } : {}),
                ...(basicWeaponGroup ? { basicWeaponGroup } : {}),
                ...(pistolWeaponGroup ? { pistolWeaponGroup } : {}),
                ...(homeworldId === "mind-cleansed" ? { startingInsanity: insanityValue } : {}),
              })
            }
          >
            Apply Homeworld
          </Button>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
