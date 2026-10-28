import { useState } from "react";
import type { RangedWeaponRef, MeleeWeaponRef } from "../../../data/reference/weaponReference";
import { useRef } from "react";
import type { WeaponCraftsmanship } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
} from "../../../ui/pickers/PickerModal";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { uiTwoColumnGrid, uiTextBody, uiDescriptionBox } from "../../../ui/styles/editableStyles";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { MeleePickerCard, RangedPickerCard } from "./WeaponPickerCards";
import {
  rangedCraftsmanshipDescription,
  meleeCraftsmanshipDescription,
  INTEGRATED_RANGED_REFS,
  INTEGRATED_MELEE_REFS,
} from "./weaponHelpers";
import {
  buildMeleeWeaponSnapshot,
  buildRangedWeaponSnapshot,
  meleeWeaponFromReference,
  previewVersionId,
  rangedWeaponFromReference,
} from "./weaponSnapshotHelpers";

type SelectedIntegrated =
  | { kind: "ranged"; ref: RangedWeaponRef }
  | { kind: "melee"; ref: MeleeWeaponRef };

export function IntegratedWeaponPicker({
  editable = true,
  strengthBonus = 0,
  onSelectRanged,
  onSelectMelee,
  customItems = [],
  onSelectCustomItem,
  onCustomRanged,
  onCustomMelee,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  strengthBonus?: number;
  onSelectRanged: (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectMelee: (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  customItems?: CampaignCustomItem<"weapon">[];
  onSelectCustomItem?: (item: CampaignCustomItem<"weapon">) => void;
  onCustomRanged?: () => void;
  onCustomMelee?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedIntegrated | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const listScrollPositionRef = useRef(0);
  const lowerQuery = query.toLowerCase();
  const ranged = INTEGRATED_RANGED_REFS.filter((ref) =>
    ref.name.toLowerCase().includes(lowerQuery)
  );
  const melee = INTEGRATED_MELEE_REFS.filter((ref) => ref.name.toLowerCase().includes(lowerQuery));
  const custom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => {
      const data = item.data;
      return (
        (data.weaponKind === "ranged" || data.weaponKind === "melee") &&
        !!data.integrated &&
        item.name.toLowerCase().includes(lowerQuery)
      );
    });
  const isEmpty = ranged.length === 0 && melee.length === 0 && custom.length === 0;

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.ref.name}
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
              if (selected.kind === "ranged") {
                onSelectRanged(selected.ref, craftsmanship);
              } else {
                onSelectMelee(selected.ref, craftsmanship);
              }
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
              {CRAFTSMANSHIP_OPTIONS.map((option) => (
                <ToggleButton
                  key={option}
                  selected={craftsmanship === option}
                  selectedClassName={CRAFTSMANSHIP_STYLE[option]}
                  className="flex-1 py-1.5 lg:py-2 text-sm lg:text-base font-medium"
                  onClick={() => setCraftsmanship(option)}
                >
                  {option}
                </ToggleButton>
              ))}
            </div>
          </div>
          <div className={uiDescriptionBox}>
            {selected.kind === "ranged"
              ? rangedCraftsmanshipDescription(craftsmanship)
              : meleeCraftsmanshipDescription(craftsmanship)}
          </div>
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Integrated Weapon" : "View Integrated Weapons"}
      placeholder="Search integrated weapons…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={isEmpty}
      footer={
        editable && (onCustomRanged || onCustomMelee) ? (
          <div className={uiTwoColumnGrid}>
            {onCustomRanged && (
              <PickerCustomAction onClick={onCustomRanged}>
                Add Custom Ranged Weapon
              </PickerCustomAction>
            )}
            {onCustomMelee && (
              <PickerCustomAction onClick={onCustomMelee}>
                Add Custom Melee Weapon
              </PickerCustomAction>
            )}
          </div>
        ) : undefined
      }
    >
      <PickerList>
        {[
          ...ranged.map((ref) => ({
            name: ref.name,
            row: (
              <RangedPickerCard
                key={ref.id}
                weapon={rangedWeaponFromReference(ref, true)}
                integrated
                editable={editable}
                onSelect={() => setSelected({ kind: "ranged", ref })}
              />
            ),
          })),
          ...melee.map((ref) => ({
            name: ref.name,
            row: (
              <MeleePickerCard
                key={ref.id}
                weapon={meleeWeaponFromReference(ref, true)}
                integrated
                strengthBonus={strengthBonus}
                editable={editable}
                onSelect={() => setSelected({ kind: "melee", ref })}
              />
            ),
          })),
          ...custom.map((item) => {
            const data = item.data;
            if (data.weaponKind === "ranged") {
              return {
                name: item.name,
                row: (
                  <RangedPickerCard
                    key={`custom-${item.id}`}
                    weapon={buildRangedWeaponSnapshot(
                      `picker-${item.id}`,
                      {},
                      data,
                      item.id,
                      previewVersionId(item)
                    )}
                    libraryItem={item}
                    integrated
                    editable={editable}
                    onSelect={() => onSelectCustomItem?.(item)}
                  />
                ),
              };
            }
            if (data.weaponKind === "melee") {
              return {
                name: item.name,
                row: (
                  <MeleePickerCard
                    key={`custom-${item.id}`}
                    weapon={buildMeleeWeaponSnapshot(
                      `picker-${item.id}`,
                      {},
                      data,
                      item.id,
                      previewVersionId(item)
                    )}
                    libraryItem={item}
                    integrated
                    strengthBonus={strengthBonus}
                    editable={editable}
                    onSelect={() => onSelectCustomItem?.(item)}
                  />
                ),
              };
            }
            return { name: item.name, row: null };
          }),
        ]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) => entry.row)}
      </PickerList>
    </PickerModal>
  );
}
