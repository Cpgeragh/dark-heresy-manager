// src/pages/CharacterSheet/weapons/MeleePicker.tsx

import { useRef, useState } from "react";
import type { MeleeWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_TYPES } from "../../../data/reference/weaponClassification";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { uiTextBody, uiTextMuted, uiItemNameHover } from "../../../ui/styles/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/styles/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { Button } from "../../../ui/buttons/Button";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import { ArrowLeft, ArrowRight } from "../../../ui/icons/PickerArrows";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip } from "./weaponShared";
import { MeleeCard } from "./MeleeCard";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { meleeCraftsmanshipDescription, weaponTypeChip } from "./weaponHelpers";
import { uiPickerPressFeedback } from "../../../ui/styles/buttonStyles";

function MeleeWeaponCardPickerRow({
  weaponReference,
  editable,
  strengthBonus,
  onSelect,
}: {
  weaponReference: MeleeWeaponRef;
  editable: boolean;
  strengthBonus: number;
  onSelect: () => void;
}) {
  const weapon: MeleeWeapon = {
    id: `picker-${weaponReference.id}`,
    referenceId: weaponReference.id,
    name: weaponReference.name,
    class: weaponReference.class,
    type: weaponReference.type,
    damage: weaponReference.damage,
    pen: String(weaponReference.pen),
    specialRules: weaponReference.specialRules,
    weight: weaponReference.weight,
    value: weaponReference.value,
    availability: weaponReference.availability,
    source: weaponReference.source,
    craftsmanship: "Common",
    upgrades: [],
  };
  return (
    <MeleeCard
      weapon={weapon}
      editable={false}
      pickerMode
      strengthBonus={strengthBonus}
      onSelect={editable ? onSelect : undefined}
      onRemove={() => {}}
      onAddUpgrade={() => {}}
      onRemoveUpgrade={() => {}}
      onUpdateQuantity={() => {}}
      allowUpgrades={false}
    />
  );
}

export function MeleePicker({
  editable = true,
  strengthBonus = 0,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
  references = MELEE_WEAPON_REFERENCE,
  title = "Add Melee Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  strengthBonus?: number;
  customItems?: CampaignCustomItem<"weapon">[];
  onSelect: (weaponReference: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom: () => void;
  onClose: () => void;
  suspended?: boolean;
  references?: MeleeWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  recordComponentRender("MeleePicker");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MeleeWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showTypeFilterPicker, setShowTypeFilterPicker] = useState(false);
  const listScrollPositionRef = useRef(0);
  const normalisedQuery = query.toLowerCase();
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(normalisedQuery))
    .filter((r) => !typeFilter || r.type === typeFilter)
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.data.weaponKind === "melee" && !item.data.integrated)
    .filter((item) => item.name.toLowerCase().includes(normalisedQuery))
    .filter(
      (item) => item.data.weaponKind === "melee" && (!typeFilter || item.data.type === typeFilter)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((weaponReference) => ({
      kind: "reference" as const,
      name: weaponReference.name,
      weaponReference,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const modalTitle = editable ? title : `${title.replace(/^Add /, "View ")}s`;

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (showTypeFilterPicker) {
    return (
      <OptionPickerScreen
        title="Weapon Type"
        options={["All Types", ...WEAPON_TYPES]}
        selected={typeFilter ?? "All Types"}
        onSelect={(value) => {
          setTypeFilter(value === "All Types" ? null : value);
          setShowTypeFilterPicker(false);
        }}
        onClose={() => setShowTypeFilterPicker(false)}
      />
    );
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
          <Button
            className="w-full"
            onClick={() => {
              onSelect(selected, craftsmanship);
              resetPicker();
            }}
          >
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
                  type="button"
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
          <div
            className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}
          >
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
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      filterRow={
        <button
          type="button"
          onClick={() => setShowTypeFilterPicker(true)}
          className={`w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between ${uiPickerPressFeedback()}`}
        >
          <span>{typeFilter ?? "All Types"}</span>
          <ArrowRight />
        </button>
      }
      footer={
        editable && showCustom ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom weapon</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) => {
          if (entry.kind === "reference") {
            const weaponReference = entry.weaponReference;
            return (
              <MeleeWeaponCardPickerRow
                key={weaponReference.id}
                weaponReference={weaponReference}
                editable={editable}
                strengthBonus={strengthBonus}
                onSelect={() => setSelected(weaponReference)}
              />
            );
          }
          const item = entry.item;
          const data = item.data;
          if (data.weaponKind !== "melee") return null;
          return (
            <PickerRow
              key={item.id}
              interactive={editable}
              onClick={() => onSelectCustomItem?.(item)}
            >
              <span className={uiItemNameHover}>{item.name}</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
                {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
                {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(() => {
                  const t = weaponTypeChip(data.type);
                  return t ? (
                    <Chip size="sm" className={t.className}>
                      {t.label}
                    </Chip>
                  ) : null;
                })()}
                <ItemMetaChips
                  weight={data.weight}
                  value={data.value}
                  availability={data.availability}
                  source={data.source}
                />
                {item.status === "draft" && (
                  <Chip size="sm" className={colourAmberFaint}>
                    Draft
                  </Chip>
                )}
                <Chip size="sm" className={colourFuchsia}>
                  Custom
                </Chip>
              </div>
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
