// src/pages/CharacterSheet/weapons/weaponShared.tsx
// Shared weapon display components.

import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { Button } from "../../../ui/buttons/Button";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import type { WeaponUpgradeRef } from "../../../data/reference/weaponUpgradeReference";
import { PickerList, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName, PickerRowText } from "../../../ui/pickers/PickerRowParts";
import { PickerField } from "../../../ui/pickers/PickerField";
import { formatWeightForDisplay } from "../../../ui/format/weightFormat";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { CloseIcon } from "../../../ui/icons/CloseIcon";
import { WeightIcon } from "../../../ui/icons/WeightIcon";
import {
  uiChipRow,
  uiSplitRow,
  editableInputColour,
  uiCell,
  uiTextLabel,
  uiTextPlaceholder,
  uiFormLabel,
  uiInfoModalWrapper,
  uiRuleName,
  uiTextDescription,
  uiTextBody,
} from "../../../ui/styles/editableStyles";
import { uiDismissButton } from "../../../ui/styles/buttonStyles";
import { sanitizePositiveIntegerInput } from "../../../utils/formInput";
import { parseDamageType, getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { uiLayerLocal } from "../../../ui/styles/layerStyles";

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
    <div className="col-span-2 space-y-2">
      <label className={uiFormLabel}>Qualities</label>
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
            className={`w-20 rounded border px-2 py-1 text-sm lg:text-base ${editableInputColour(true)}`}
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
            <Chip key={quality} colour="slate">
              {quality}
              <button
                type="button"
                onClick={() => onRemove(quality)}
                aria-label={`Remove ${quality}`}
                className={uiDismissButton}
              >
                <CloseIcon />
              </button>
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

// ─── Damage Type Helpers ──────────────────────────────────────────────────────

export function DamageTypeChip({ damage, size = "md" }: { damage: string; size?: "sm" | "md" }) {
  const damageType = parseDamageType(damage);
  if (!damageType) return null;
  return (
    <StatChip label="Type" value={damageType.label} size={size} valueColour={damageType.colour} />
  );
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
  if (!editable) {
    return equipped ? (
      <Chip size="sm" colour="emerald" className="uppercase tracking-wide shrink-0">
        Equipped
      </Chip>
    ) : null;
  }
  return (
    <Button
      size="xs"
      variant={equipped ? "successOutline" : "ghost"}
      disabled={disabled && !equipped}
      loadingLabel={equipped ? "Unequipping" : "Equipping"}
      title={equipped ? "Click to unequip" : disabled ? "Slots full" : "Click to equip"}
      className={`relative ${uiLayerLocal} pointer-events-auto shrink-0`}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled || equipped) return onChange();
      }}
    >
      {equipped ? "Unequip" : "Equip"}
    </Button>
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
    <div className="space-y-4">
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
  onRemove: (upgradeId: string) => void;
}) {
  const displayedWeightModifier = formatWeightModifier(upgrade.weightModifier);

  return (
    <div className={`${uiCell} px-2 lg:px-3 py-1.5 lg:py-2`}>
      <div className={`${uiSplitRow}`}>
        <span className={`text-xs lg:text-sm font-medium ${uiTextBody}`}>{upgrade.name}</span>
        {editable && (
          <RemoveButton onClick={() => onRemove(upgrade.id)} label={`Remove ${upgrade.name}`} />
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        <Chip size="sm" colour="slate">
          <WeightIcon className="h-[1em] w-[1em] shrink-0" />
          <span className="leading-none">{displayedWeightModifier}</span>
        </Chip>
        <ItemMetaChips
          value={upgrade.value}
          availability={upgrade.availability}
          source={upgrade.source}
          size="sm"
          bare
        />
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={uiTextLabel}>Rules</span>
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title={upgrade.name}
            content={
              <div className="space-y-2">
                <p className={uiTextDescription}>{upgrade.description}</p>
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>{upgrade.applicableTo}</p>
              </div>
            }
          />
        </span>
      </div>
    </div>
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
            <PickerRowName name={upgrade.name} />
            <PickerRowChips>
              <Chip colour="slate">
                <WeightIcon className="h-[1em] w-[1em] shrink-0" />
                <span className="leading-none">{formatWeightModifier(upgrade.weightModifier)}</span>
              </Chip>
              <ItemMetaChips
                value={upgrade.value}
                availability={upgrade.availability}
                source={upgrade.source}
                bare
              />
            </PickerRowChips>
            <PickerRowText className="leading-relaxed">{upgrade.description}</PickerRowText>
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
