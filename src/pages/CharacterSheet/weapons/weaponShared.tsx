// src/pages/CharacterSheet/weapons/weaponShared.tsx
// Shared weapon display components.

import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { Button } from "../../../ui/buttons/Button";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { Chip, NestedChip } from "../../../ui/chips/Chip";
import { RemovableChip } from "../../../ui/chips/RemovableChip";
import { ItemMetaChips, NestedItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import type { WeaponUpgradeRef } from "../../../data/reference/weaponUpgradeReference";
import { PickerList, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { InfoParagraph } from "../../../ui/InfoSection";
import { PickerField } from "../../../ui/pickers/PickerField";
import { formatWeightForDisplay } from "../../../ui/format/weightFormat";
import { UpgradeEntryCard } from "../../../ui/UpgradeEntryCard";
import { WeightIcon } from "../../../ui/icons/WeightIcon";
import {
  uiChipRow,
  editableInputColour,
  uiTextPlaceholder,
  uiRuleName,
  uiTextDescription,
  uiStackField,
  uiStackBody,
} from "../../../ui/styles/editableStyles";
import { sanitizePositiveIntegerInput } from "../../../utils/formInput";
import { parseDamageType, getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { FormLabel } from "../../../ui/forms/FormLabel";
import { uiIconSize } from "../../../ui/styles/iconStyles";

export function WeaponQualitySelector({
  selected,
  pendingQuality,
  needsParameter,
  parameterValue,
  canConfirm,
  onParameterValueChange,
  onOpenPicker,
  onConfirmPending,
  onRemove,
}: {
  selected: string[];
  pendingQuality: string | null;
  needsParameter: boolean;
  parameterValue: string;
  canConfirm: boolean;
  onParameterValueChange: (value: string) => void;
  onOpenPicker: () => void;
  onConfirmPending: () => void;
  onRemove: (quality: string) => void;
}) {
  return (
    <div className={`col-span-2 ${uiStackField}`}>
      <FormLabel htmlFor="weapon-quality-picker">Qualities</FormLabel>
      <div className="flex gap-2">
        <PickerField
          id="weapon-quality-picker"
          ariaLabel="Qualities"
          className="w-full"
          value={pendingQuality ?? ""}
          placeholder="Choose quality…"
          onClick={onOpenPicker}
        />
        {needsParameter && (
          <input
            type="text"
            inputMode="numeric"
            value={parameterValue}
            onChange={(event) =>
              onParameterValueChange(sanitizePositiveIntegerInput(event.target.value))
            }
            aria-label={`${pendingQuality} value`}
            placeholder="Value"
            className={`w-20 border px-2 py-1 text-sm lg:text-base ${editableInputColour(true)}`}
            autoComplete="off"
          />
        )}
        <Button variant="ghost" onClick={onConfirmPending} disabled={!canConfirm}>
          Add
        </Button>
      </div>
      {selected.length > 0 && (
        <div className={`${uiChipRow}`}>
          {selected.map((quality) => (
            <RemovableChip key={quality} name={quality} onRemove={() => onRemove(quality)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

// ─── Damage Type Helpers ──────────────────────────────────────────────────────

export function DamageTypeChip({ damage }: { damage: string }) {
  const damageType = parseDamageType(damage);
  if (!damageType) return null;
  return <StatChip label="Type" value={damageType.label} valueColour={damageType.colour} />;
}

// ─── Equip Toggle ─────────────────────────────────────────────────────────────

export function EquipToggle({
  equipped,
  disabled,
  editable,
  onChange,
}: {
  equipped: boolean;
  disabled: boolean;
  editable: boolean;
  onChange: () => void | Promise<void>;
}) {
  return (
    <StateToggleButton
      active={equipped}
      activeLabel="Unequip"
      inactiveLabel="Equip"
      activeBusyLabel="Unequipping"
      inactiveBusyLabel="Equipping"
      statusLabel="Equipped"
      disabled={disabled}
      editable={editable}
      onChange={onChange}
      disabledTitle="Slots full"
    />
  );
}

// ─── Special Rules Modal ──────────────────────────────────────────────────────

export function SpecialRulesContent({
  rules,
  description,
}: {
  rules: string;
  description?: string;
}) {
  const ruleNames = getKnownSpecialRuleNames(rules);

  return (
    <div className={uiStackBody}>
      {description && <p className={uiTextDescription}>{description}</p>}
      {ruleNames.map((name) => {
        const desc = WEAPON_SPECIAL_RULES[name];
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

// ─── Upgrade Card ──────────────────────────────────────────────────────────

export function UpgradeCard({
  upgrade,
  editable,
  onRemove,
}: {
  upgrade: WeaponUpgradeRef;
  editable: boolean;
  onRemove: (upgradeId: string) => unknown;
}) {
  const displayedWeightModifier = formatWeightModifier(upgrade.weightModifier);

  return (
    <UpgradeEntryCard
      name={upgrade.name}
      removeFrom="this weapon"
      editable={editable}
      onRemove={() => onRemove(upgrade.id)}
      chips={
        <div className="flex flex-wrap gap-1 mt-1">
          <NestedChip colour="slate">
            <WeightIcon className={`${uiIconSize.inline} shrink-0`} />
            <span className="leading-none">{displayedWeightModifier}</span>
          </NestedChip>
          <NestedItemMetaChips
            value={upgrade.value}
            availability={upgrade.availability}
            source={upgrade.source}
            bare
          />
        </div>
      }
      rules={
        <div className={uiStackBody}>
          <p className={uiTextDescription}>{upgrade.description}</p>
          <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>{upgrade.applicableTo}</p>
        </div>
      }
    />
  );
}

// ─── Upgrade Picker ────────────────────────────────────────────────────────

export function UpgradePicker({
  compatibleUpgrades,
  editable = true,
  onSelect,
  onClose,
}: {
  compatibleUpgrades: WeaponUpgradeRef[];
  editable?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <PickerModal
      title={editable ? "Add Upgrade" : "View Upgrades"}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={compatibleUpgrades.length === 0}
      emptyMessage="No compatible upgrades available."
      hideSearch
      footer={
        <Button variant="secondary" fullWidth onClick={onClose}>
          Done
        </Button>
      }
    >
      <PickerList>
        {compatibleUpgrades.map((upgrade) => (
          <PickerRow key={upgrade.id} interactive={editable} onClick={() => onSelect(upgrade.id)}>
            <PickerRowName
              name={upgrade.name}
              infoTitle={upgrade.name}
              information={
                upgrade.description ? (
                  <InfoParagraph>{upgrade.description}</InfoParagraph>
                ) : undefined
              }
            />
            <PickerRowChips>
              <Chip colour="slate">
                <WeightIcon className={`${uiIconSize.inline} shrink-0`} />
                <span className="leading-none">{formatWeightModifier(upgrade.weightModifier)}</span>
              </Chip>
              <ItemMetaChips
                value={upgrade.value}
                availability={upgrade.availability}
                source={upgrade.source}
                bare
              />
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}

function formatWeightModifier(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "0") {
    return "0 kg";
  }
  if (/^[+-]?\d+(?:\.\d+)?\s*(?:kg)?$/i.test(trimmed)) {
    return formatWeightForDisplay(trimmed);
  }
  return trimmed;
}
