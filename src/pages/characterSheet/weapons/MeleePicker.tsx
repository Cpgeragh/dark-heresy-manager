// src/pages/characterSheet/weapons/MeleePicker.tsx

import { useState } from "react";
import type { WeaponCraftsmanship } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiInfoModalWrapper,
  uiItemName,
} from "../../../ui/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { ArrowLeft } from "../../../ui/PickerArrows";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip, DamageTypeChip, SpecialRulesContent } from "./weaponShared";
import {
  meleeCraftsmanshipDescription,
} from "./weaponHelpers";

export function MeleePicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  references = MELEE_WEAPON_REFERENCE,
  title = "Add Melee Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  customItems?: CampaignCustomItem<"weapon">[];
  onSelect: (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: MeleeWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MeleeWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const normalisedQuery = query.toLowerCase();
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(normalisedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.data.weaponKind === "melee")
    .filter((item) => item.name.toLowerCase().includes(normalisedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const modalTitle = editable ? title : `${title.replace(/^Add /, "View ")}s`;

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        titleClassName="text-slate-200"
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        query=""
        onQueryChange={() => {}}
        onClose={resetPicker}
        isEmpty={false}
        hideSearch
        footer={
          <Button className="w-full" onClick={() => onSelect(selected, craftsmanship)}>
            Add Weapon
          </Button>
        }
      >
        <PickerBody>
          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === q
                      ? CRAFTSMANSHIP_STYLE[q]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {meleeCraftsmanshipDescription(craftsmanship)}
          </div>
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={modalTitle}
      placeholder={placeholder}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && showCustom ? (
          <PickerCustomAction
            onClick={onCustom}
          >
            + Add custom weapon
          </PickerCustomAction>
        ) : undefined
      }
    >
      {filteredCustom.map((item) => {
        const data = item.data;
        if (data.weaponKind !== "melee") return null;
        return (
          <PickerRow
            key={item.id}
            interactive={editable}
            onClick={() => onSelectCustomItem?.(item)}
          >
            <span
              className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
            >
              {item.name}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
              {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
              {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
              {item.status === "draft" && (
                <Chip size="sm" className={colourAmberFaint}>Draft</Chip>
              )}
              <Chip size="sm" className={colourFuchsia}>Custom</Chip>
            </div>
          </PickerRow>
        );
      })}
      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          interactive={editable}
          onClick={() => setSelected(ref)}
        >
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <StatChip size="sm" label="Dmg" value={ref.damage} />
            <DamageTypeChip size="sm" damage={ref.damage} />
            <StatChip size="sm" label="Pen" value={ref.pen} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
          </div>
          {ref.specialRules && ref.specialRules !== "—" && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{ref.specialRules}</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} as="span" />
              </span>
            </div>
          )}
          {ref.description && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={uiTextLabel}>Rules</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={ref.name} content={<SpecialRulesContent rules="" description={ref.description} />} as="span" />
              </span>
            </div>
          )}
        </PickerRow>
      ))}
    </PickerModal>
  );
}
