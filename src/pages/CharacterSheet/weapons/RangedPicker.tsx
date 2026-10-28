// src/pages/CharacterSheet/weapons/RangedPicker.tsx

import { useRef, useState } from "react";
import type { WeaponCraftsmanship } from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_TYPES } from "../../../data/reference/weaponClassification";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { uiOptionGrid, uiTextBody, uiDescriptionBox } from "../../../ui/styles/editableStyles";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
} from "../../../ui/pickers/PickerModal";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { FilterButton } from "../../../ui/pickers/FilterButton";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { RangedPickerCard } from "./WeaponPickerCards";
import { ammoFamilyChip, rangedCraftsmanshipDescription } from "./weaponHelpers";
import {
  buildRangedWeaponSnapshot,
  previewVersionId,
  rangedWeaponFromReference,
} from "./weaponSnapshotHelpers";

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
          <div className={uiDescriptionBox}>{rangedCraftsmanshipDescription(craftsmanship)}</div>
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
        <div className={`${uiOptionGrid} grid-cols-1 w-full sm:grid-cols-3`}>
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
          <PickerCustomAction onClick={onCustom}>Add Custom Ranged Weapon</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) => {
          if (entry.kind === "reference") {
            const weaponReference = entry.weaponReference;
            return (
              <RangedPickerCard
                key={weaponReference.id}
                weapon={rangedWeaponFromReference(weaponReference)}
                editable={editable}
                onSelect={() => setSelected(weaponReference)}
              />
            );
          }
          const item = entry.item;
          const data = item.data;
          if (data.weaponKind !== "ranged") return null;
          return (
            <RangedPickerCard
              key={item.id}
              weapon={buildRangedWeaponSnapshot(
                `picker-${item.id}`,
                {},
                data,
                item.id,
                previewVersionId(item)
              )}
              libraryItem={item}
              editable={editable}
              onSelect={() => onSelectCustomItem?.(item)}
            />
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
