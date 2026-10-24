// src/pages/CharacterSheet/weapons/MeleePicker.tsx

import { useRef, useState } from "react";
import type { WeaponCraftsmanship } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_TYPES } from "../../../data/reference/weaponClassification";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { uiTextBody, uiDescriptionBox } from "../../../ui/styles/editableStyles";
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
import { MeleePickerCard } from "./WeaponPickerCards";
import { meleeCraftsmanshipDescription } from "./weaponHelpers";
import {
  buildMeleeWeaponSnapshot,
  meleeWeaponFromReference,
  previewVersionId,
} from "./weaponSnapshotHelpers";

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
          <div className={uiDescriptionBox}>{meleeCraftsmanshipDescription(craftsmanship)}</div>
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
        <FilterButton className="w-full" onClick={() => setShowTypeFilterPicker(true)}>
          {typeFilter ?? "All Types"}
        </FilterButton>
      }
      footer={
        editable && showCustom ? (
          <PickerCustomAction onClick={onCustom}>Add Custom Melee Weapon</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) => {
          if (entry.kind === "reference") {
            const weaponReference = entry.weaponReference;
            return (
              <MeleePickerCard
                key={weaponReference.id}
                weapon={meleeWeaponFromReference(weaponReference)}
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
            <MeleePickerCard
              key={item.id}
              weapon={buildMeleeWeaponSnapshot(
                `picker-${item.id}`,
                {},
                data,
                item.id,
                previewVersionId(item)
              )}
              libraryItem={item}
              strengthBonus={strengthBonus}
              editable={editable}
              onSelect={() => onSelectCustomItem?.(item)}
            />
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
