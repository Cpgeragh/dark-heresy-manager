// src/pages/CharacterSheet/weapons/RangedPicker.tsx

import { useRef, useState } from "react";
import type { RangedWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  uiTextBody,
  uiTextMuted,
  uiItemName,
} from "../../../ui/styles/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/styles/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { Button } from "../../../ui/buttons/Button";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { ArrowRight, ArrowLeft } from "../../../ui/icons/PickerArrows";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip } from "./weaponShared";
import { RangedCard } from "./RangedCard";
import { uiPickerPressFeedback } from "../../../ui/styles/buttonStyles";
import {
  weaponClassChip,
  ammoFamilyChip,
  rangedCraftsmanshipDescription,
} from "./weaponHelpers";

function RangedWeaponCardPickerRow({ weaponReference, editable, onSelect }: { weaponReference: RangedWeaponRef; editable: boolean; onSelect: () => void }) {
  const weapon: RangedWeapon = {
    id: `picker-${weaponReference.id}`,
    referenceId: weaponReference.id,
    name: weaponReference.name,
    class: weaponReference.class,
    range: weaponReference.range,
    rof: weaponReference.rof,
    damage: weaponReference.damage,
    pen: String(weaponReference.pen),
    clip: String(weaponReference.clip),
    rld: weaponReference.reload,
    specialRules: weaponReference.specialRules,
    weight: weaponReference.weight,
    value: weaponReference.value,
    availability: weaponReference.availability,
    source: weaponReference.source,
    ammoType: weaponReference.ammoType,
    ammoTracking: weaponReference.ammoTracking,
    craftsmanship: "Common",
    upgrades: [],
    ammoEntries: [],
  };
  return <RangedCard weapon={weapon} editable={false} pickerMode onSelect={editable ? onSelect : undefined} onRemove={() => {}} onAddUpgrade={() => {}} onRemoveUpgrade={() => {}} onUpdateAmmoEntries={() => {}} onUpdateQuantity={() => {}} allowUpgrades={false} />;
}

/*
function RangedReferenceRow({
  ref,
  editable,
  onSelect,
}: {
  ref: RangedWeaponRef;
  editable: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((value) => !value);
  const weaponClass = weaponClassChip(ref.class);
  const ammoFamily = ammoFamilyChip(ref.ammoType);

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
              {weaponClass && <Chip size="sm" className={weaponClass.active}>{weaponClass.label}</Chip>}
              {ammoFamily && <Chip size="sm" className={ammoFamily.className}>{ammoFamily.label}</Chip>}
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
            <StatChip size="sm" label="Range" value={ref.range} />
            <StatChip size="sm" label="ROF" value={ref.rof} />
            <StatChip size="sm" label="Dmg" value={ref.damage} />
            <DamageTypeChip size="sm" damage={ref.damage} />
            <StatChip size="sm" label="Pen" value={ref.pen} />
            <StatChip size="sm" label="Clip" value={ref.clip} />
            <StatChip size="sm" label="Reload" value={ref.reload} />
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

export function RangedPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
  references = RANGED_WEAPON_REFERENCE,
  title = "Add Ranged Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  customItems?: CampaignCustomItem<"weapon">[];
  onSelect: (weaponReference: RangedWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"weapon">) => void;
    onCustom: () => void;
    onClose: () => void;
    suspended?: boolean;
  references?: RangedWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RangedWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [showClassFilterPicker, setShowClassFilterPicker] = useState(false);
  const [showFamilyFilterPicker, setShowFamilyFilterPicker] = useState(false);
  const listScrollPositionRef = useRef(0);
  const normalisedQuery = query.toLowerCase();
  const families = Array.from(
    new Map(
      references
        .map((r) => ammoFamilyChip(r.ammoType))
        .filter((f): f is NonNullable<typeof f> => f !== undefined)
        .map((f) => [f.label, f])
    ).values()
  );
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(normalisedQuery))
    .filter((r) => !classFilter || r.class.includes(classFilter))
    .filter((r) => !familyFilter || ammoFamilyChip(r.ammoType)?.label === familyFilter)
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.data.weaponKind === "ranged" && !item.data.integrated)
    .filter((item) => item.name.toLowerCase().includes(normalisedQuery))
    .filter((item) => {
      if (item.data.weaponKind !== "ranged") return false;
      return !classFilter || item.data.class?.includes(classFilter);
    })
    .filter((item) => {
      if (item.data.weaponKind !== "ranged") return false;
      return !familyFilter || ammoFamilyChip(item.data.ammoType)?.label === familyFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((weaponReference) => ({ kind: "reference" as const, name: weaponReference.name, weaponReference })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const modalTitle = editable ? title : `${title.replace(/^Add /, "View ")}s`;

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (showClassFilterPicker) {
    return (
      <OptionPickerScreen
        title="Class"
        options={["All Classes", "Pistol", "Basic", "Heavy", "Thrown", "Exotic"]}
        selected={classFilter ?? "All Classes"}
        onSelect={(value) => {
          setClassFilter(value === "All Classes" ? null : value);
          setShowClassFilterPicker(false);
        }}
        onClose={() => setShowClassFilterPicker(false)}
      />
    );
  }
  if (showFamilyFilterPicker) {
    return (
      <OptionPickerScreen
        title="Ammo Type"
        options={["All Types", ...families.map((f) => f.label)]}
        selected={familyFilter ?? "All Types"}
        onSelect={(value) => {
          setFamilyFilter(value === "All Types" ? null : value);
          setShowFamilyFilterPicker(false);
        }}
        onClose={() => setShowFamilyFilterPicker(false)}
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
            {rangedCraftsmanshipDescription(craftsmanship)}
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
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => setShowClassFilterPicker(true)}
            className={`flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between ${uiPickerPressFeedback()}`}
          >
            <span>{classFilter ?? "All Classes"}</span>
            <ArrowRight />
          </button>
          <button
            type="button"
            onClick={() => setShowFamilyFilterPicker(true)}
            className={`flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between ${uiPickerPressFeedback()}`}
          >
            <span>{familyFilter ?? "All Types"}</span>
            <ArrowRight />
          </button>
        </div>
      }
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
          const weaponReference = entry.weaponReference;
          return (
            <RangedWeaponCardPickerRow
              key={weaponReference.id}
              weaponReference={weaponReference}
              editable={editable}
              onSelect={() => setSelected(weaponReference)}
            />
          );
        }
        const item = entry.item;
        const data = item.data;
        if (data.weaponKind !== "ranged") return null;
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
              {data.range && <StatChip size="sm" label="Range" value={data.range} />}
              {data.rof && <StatChip size="sm" label="ROF" value={data.rof} />}
              {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
              {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
              {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
              {data.clip && <StatChip size="sm" label="Clip" value={data.clip} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(() => { const c = weaponClassChip(data.class); return c ? (
                <Chip size="sm" className={c.active}>{c.label}</Chip>
              ) : null; })()}
              {(() => { const f = ammoFamilyChip(data.ammoType); return f ? (
                <Chip size="sm" className={f.className}>{f.label}</Chip>
              ) : null; })()}
              {item.status === "draft" && (
                <Chip size="sm" className={colourAmberFaint}>
                  Draft
                </Chip>
              )}
              <Chip size="sm" className={colourFuchsia}>
                Custom
              </Chip>
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
            </div>
          </PickerRow>
        );
      })}
      {/* Previous flat picker row retained below while the new expandable row is verified.
      {false && filtered.map((ref) => (
        <PickerRow key={ref.id}>
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <StatChip size="sm" label="Range" value={ref.range} />
            <StatChip size="sm" label="ROF" value={ref.rof} />
            <StatChip size="sm" label="Dmg" value={ref.damage} />
            <DamageTypeChip size="sm" damage={ref.damage} />
            <StatChip size="sm" label="Pen" value={ref.pen} />
            <StatChip size="sm" label="Clip" value={ref.clip} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(() => { const c = weaponClassChip(ref.class); return c ? (
              <Chip size="sm" className={c.active}>{c.label}</Chip>
            ) : null; })()}
            {(() => { const f = ammoFamilyChip(ref.ammoType); return f ? (
              <Chip size="sm" className={f.className}>{f.label}</Chip>
            ) : null; })()}
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
