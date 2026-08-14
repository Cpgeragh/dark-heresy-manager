// src/pages/characterSheet/weapons/MeleePicker.tsx

import { useRef, useState } from "react";
import type { MeleeWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  uiTextBody,
  uiTextMuted,
  uiItemName,
} from "../../../ui/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { ArrowLeft } from "../../../ui/PickerArrows";
import { StatChip } from "../../../ui/StatChip";
import { DamageTypeChip } from "./weaponShared";
import { MeleeCard } from "./MeleeCard";
import {
  meleeCraftsmanshipDescription,
} from "./weaponHelpers";

function MeleeWeaponCardPickerRow({ ref, editable, strengthBonus, onSelect }: { ref: MeleeWeaponRef; editable: boolean; strengthBonus: number; onSelect: () => void }) {
  const weapon: MeleeWeapon = {
    id: `picker-${ref.id}`,
    referenceId: ref.id,
    name: ref.name,
    class: ref.class,
    damage: ref.damage,
    pen: String(ref.pen),
    specialRules: ref.specialRules,
    weight: ref.weight,
    value: ref.value,
    availability: ref.availability,
    source: ref.source,
    craftsmanship: "Common",
    upgrades: [],
  };
  return <MeleeCard weapon={weapon} editable={false} pickerMode strengthBonus={strengthBonus} onSelect={editable ? onSelect : undefined} onRemove={() => {}} onAddUpgrade={() => {}} onRemoveUpgrade={() => {}} onUpdateQuantity={() => {}} allowUpgrades={false} />;
}

/*
function MeleeReferenceRow({
  ref,
  editable,
  onSelect,
}: {
  ref: MeleeWeaponRef;
  editable: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((value) => !value);

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      <div className="relative w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition group">
        <button
          type="button"
          onClick={editable ? onSelect : toggle}
          aria-label={editable ? `Select ${ref.name}` : `${expanded ? "Collapse" : "Expand"} ${ref.name}`}
          className="absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        />
        <div className="relative pointer-events-none flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>{ref.name}</span>
              {ref.description && (
                <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                  <InfoModal title={ref.name} content={ref.description} as="span" />
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
            </div>
          </div>
          {editable ? (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${ref.name} details`}
              className="relative z-10 pointer-events-auto p-1 -m-1"
            >
              <ExpandChevron expanded={expanded} />
            </button>
          ) : (
            <ExpandChevron expanded={expanded} />
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-600 px-3 lg:px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <StatChip size="sm" label="Dmg" value={ref.damage} />
            <DamageTypeChip size="sm" damage={ref.damage} />
            <StatChip size="sm" label="Pen" value={ref.pen} />
          </div>
          {ref.specialRules && ref.specialRules !== "—" && (
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{ref.specialRules}</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} as="span" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/

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
  onSelect: (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"weapon">) => void;
    onCustom: () => void;
    onClose: () => void;
    suspended?: boolean;
  references?: MeleeWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MeleeWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const listScrollPositionRef = useRef(0);
  const normalisedQuery = query.toLowerCase();
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(normalisedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.data.weaponKind === "melee" && !item.data.integrated)
    .filter((item) => item.name.toLowerCase().includes(normalisedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));
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
          <Button className="w-full" onClick={() => {
            onSelect(selected, craftsmanship);
            resetPicker();
          }}>
            Add Weapon
          </Button>
        }
      >
        <PickerBody>
          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button type="button"
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
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
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
      {pickerEntries.map((entry) => {
        if (entry.kind === "reference") {
          const ref = entry.ref;
          return (
            <MeleeWeaponCardPickerRow
              key={ref.id}
              ref={ref}
              editable={editable}
              strengthBonus={strengthBonus}
              onSelect={() => setSelected(ref)}
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
      {/* Previous flat picker row retained below while the new expandable row is verified.
      {false && filtered.map((ref) => (
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
      */}
    </PickerModal>
  );
}
