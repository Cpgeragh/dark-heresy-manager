// src/pages/CharacterSheet/weapons/RangedPicker.tsx

import { useEffect, useRef, useState } from "react";
import type { RangedWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_TYPES } from "../../../data/reference/weaponClassification";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  uiCardTitleHover,
  uiInfoModalWrapper,
  uiSectionShell,
  uiTextBody,
} from "../../../ui/styles/editableStyles";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { FilterButton } from "../../../ui/pickers/FilterButton";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip } from "./weaponShared";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { RangedCard } from "./RangedCard";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader, uiExpandButton } from "../../../ui/styles/buttonStyles";
import {
  weaponClassChip,
  weaponTypeChip,
  ammoFamilyChip,
  rangedCraftsmanshipDescription,
} from "./weaponHelpers";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";
import { InfoModal } from "../../../components/InfoModal";

function RangedWeaponCardPickerRow({
  weaponReference,
  editable,
  onSelect,
}: {
  weaponReference: RangedWeaponRef;
  editable: boolean;
  onSelect: () => void;
}) {
  recordComponentRender("RangedWeaponPickerRow");
  const [expanded, setExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const expectedLabel = `${expanded ? "Collapse" : "Expand"} ${weaponReference.name} details`;
    const nextControl = Array.from(
      rowRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
    ).find((button) => button.getAttribute("aria-label") === expectedLabel);
    nextControl?.focus();
  }, [expanded, weaponReference.name]);

  function showDetails() {
    restoreFocusRef.current = true;
    setExpanded(true);
  }

  function setDetailsExpanded(nextExpanded: boolean) {
    restoreFocusRef.current = true;
    setExpanded(nextExpanded);
  }

  if (!expanded) {
    const classChip = weaponClassChip(weaponReference.class);
    const typeChip = weaponTypeChip(weaponReference.type);
    return (
      <div ref={rowRef} className={`${uiSectionShell} overflow-hidden`}>
        <div
          className={`${uiCardTapHeader} relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4`}
        >
          <CardOverlayButton
            label={
              editable ? `Select ${weaponReference.name}` : `Expand ${weaponReference.name} details`
            }
            expanded={editable ? undefined : false}
            onClick={editable ? onSelect : showDetails}
          />
          <div className={`${uiExpandButton} relative pointer-events-none`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className={uiCardTitleHover}>{weaponReference.name}</p>
              {weaponReference.description && (
                <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                  <InfoModal
                    title={weaponReference.name}
                    content={
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                        {weaponReference.description}
                      </p>
                    }
                  />
                </span>
              )}
            </div>
            {(classChip || typeChip) && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {classChip && (
                  <Chip size="sm" colour={classChip.colour}>
                    {classChip.label}
                  </Chip>
                )}
                {typeChip && (
                  <Chip size="sm" colour={typeChip.colour}>
                    {typeChip.label}
                  </Chip>
                )}
              </div>
            )}
          </div>
          <div className="relative pointer-events-none flex items-center gap-2 shrink-0">
            {editable ? (
              <button
                type="button"
                onClick={showDetails}
                aria-expanded={false}
                aria-label={`Expand ${weaponReference.name} details`}
                className="relative z-10 pointer-events-auto p-1 -m-1"
              >
                <ExpandChevron expanded={false} />
              </button>
            ) : (
              <ExpandChevron expanded={false} />
            )}
          </div>
        </div>
      </div>
    );
  }

  const weapon: RangedWeapon = {
    id: `picker-${weaponReference.id}`,
    referenceId: weaponReference.id,
    name: weaponReference.name,
    class: weaponReference.class,
    type: weaponReference.type,
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
  return (
    <div ref={rowRef}>
      <RangedCard
        weapon={weapon}
        editable={false}
        expanded
        onExpandedChange={setDetailsExpanded}
        onSelect={editable ? onSelect : undefined}
        onRemove={() => {}}
        onAddUpgrade={() => {}}
        onRemoveUpgrade={() => {}}
        onUpdateAmmoEntries={() => {}}
        onUpdateQuantity={() => {}}
        allowUpgrades={false}
      />
    </div>
  );
}

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
  recordComponentRender("RangedPicker");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RangedWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [ammoFilter, setAmmoFilter] = useState<string | null>(null);
  const [showClassFilterPicker, setShowClassFilterPicker] = useState(false);
  const [showTypeFilterPicker, setShowTypeFilterPicker] = useState(false);
  const [showAmmoFilterPicker, setShowAmmoFilterPicker] = useState(false);
  const listScrollPositionRef = useRef(0);
  const normalisedQuery = query.toLowerCase();
  const ammoFamilies = Array.from(
    new Map(
      references
        .map((reference) => ammoFamilyChip(reference.ammoType))
        .filter((family): family is NonNullable<typeof family> => family !== undefined)
        .map((family) => [family.label, family])
    ).values()
  );
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(normalisedQuery))
    .filter((r) => !classFilter || r.class.includes(classFilter))
    .filter((r) => !typeFilter || r.type === typeFilter)
    .filter((r) => !ammoFilter || ammoFamilyChip(r.ammoType)?.label === ammoFilter)
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
      return !typeFilter || item.data.type === typeFilter;
    })
    .filter((item) => {
      if (item.data.weaponKind !== "ranged") return false;
      return !ammoFilter || ammoFamilyChip(item.data.ammoType)?.label === ammoFilter;
    })
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

  if (showClassFilterPicker) {
    return (
      <OptionPickerScreen
        title="Class"
        options={["All Classes", "Pistol", "Basic", "Heavy", "Thrown"]}
        selected={classFilter ?? "All Classes"}
        onSelect={(value) => {
          setClassFilter(value === "All Classes" ? null : value);
          setShowClassFilterPicker(false);
        }}
        onClose={() => setShowClassFilterPicker(false)}
      />
    );
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
  if (showAmmoFilterPicker) {
    return (
      <OptionPickerScreen
        title="Ammunition"
        options={["All Ammunition", ...ammoFamilies.map((family) => family.label)]}
        selected={ammoFilter ?? "All Ammunition"}
        onSelect={(value) => {
          setAmmoFilter(value === "All Ammunition" ? null : value);
          setShowAmmoFilterPicker(false);
        }}
        onClose={() => setShowAmmoFilterPicker(false)}
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
            <p className={`text-xs lg:text-sm ${uiTextBody} mb-2`}>Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {CRAFTSMANSHIP_OPTIONS.map((q) => (
                <ToggleButton
                  key={q}
                  selected={craftsmanship === q}
                  selectedClassName={CRAFTSMANSHIP_STYLE[q]}
                  className="flex-1 py-1.5 lg:py-2 text-sm lg:text-base font-medium"
                  onClick={() => setCraftsmanship(q)}
                >
                  {q}
                </ToggleButton>
              ))}
            </div>
          </div>
          <div
            className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}
          >
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
        <div className="grid grid-cols-1 gap-2 w-full sm:grid-cols-3">
          <FilterButton className="flex-1" onClick={() => setShowClassFilterPicker(true)}>
            {classFilter ?? "All Classes"}
          </FilterButton>
          <FilterButton className="flex-1" onClick={() => setShowTypeFilterPicker(true)}>
            {typeFilter ?? "All Types"}
          </FilterButton>
          <FilterButton onClick={() => setShowAmmoFilterPicker(true)}>
            {ammoFilter ?? "All Ammunition"}
          </FilterButton>
        </div>
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
              <PickerRowName name={item.name} />
              <PickerRowChips>
                {data.range && <StatChip size="sm" label="Range" value={data.range} />}
                {data.rof && <StatChip size="sm" label="ROF" value={data.rof} />}
                {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
                {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
                {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
                {data.clip && <StatChip size="sm" label="Clip" value={data.clip} />}
              </PickerRowChips>
              <PickerRowChips>
                {(() => {
                  const c = weaponClassChip(data.class);
                  return c ? (
                    <Chip size="sm" colour={c.colour}>
                      {c.label}
                    </Chip>
                  ) : null;
                })()}
                {(() => {
                  const t = weaponTypeChip(data.type);
                  return t ? (
                    <Chip size="sm" colour={t.colour}>
                      {t.label}
                    </Chip>
                  ) : null;
                })()}
                {(() => {
                  const f = ammoFamilyChip(data.ammoType);
                  return f ? (
                    <Chip size="sm" colour={f.colour}>
                      {f.label}
                    </Chip>
                  ) : null;
                })()}
                {item.status === "draft" && (
                  <Chip size="sm" colour="amber">
                    Draft
                  </Chip>
                )}
                <Chip size="sm" colour="fuchsia">
                  Custom
                </Chip>
                <ItemMetaChips
                  weight={data.weight}
                  value={data.value}
                  availability={data.availability}
                  source={data.source}
                />
              </PickerRowChips>
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
