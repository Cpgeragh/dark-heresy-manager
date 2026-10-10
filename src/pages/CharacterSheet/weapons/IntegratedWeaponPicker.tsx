import { useState } from "react";
import type { RangedWeaponRef, MeleeWeaponRef } from "../../../data/reference/weaponReference";
import { useRef } from "react";
import type { WeaponCraftsmanship } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { Chip } from "../../../ui/chips/Chip";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import {
  PickerRowChips,
  PickerRowInfoLine,
  PickerRowName,
} from "../../../ui/pickers/PickerRowParts";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { uiTextBody } from "../../../ui/styles/editableStyles";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { SpecialRulesContent } from "./weaponShared";
import {
  rangedCraftsmanshipDescription,
  meleeCraftsmanshipDescription,
  INTEGRATED_RANGED_REFS,
  INTEGRATED_MELEE_REFS,
} from "./weaponHelpers";

type SelectedIntegrated =
  | { kind: "ranged"; ref: RangedWeaponRef }
  | { kind: "melee"; ref: MeleeWeaponRef };

export function IntegratedWeaponPicker({
  editable = true,
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
          <div
            className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}
          >
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
          <div className="grid grid-cols-2 gap-2">
            {onCustomRanged && (
              <PickerCustomAction onClick={onCustomRanged}>+ Custom ranged</PickerCustomAction>
            )}
            {onCustomMelee && (
              <PickerCustomAction onClick={onCustomMelee}>+ Custom melee</PickerCustomAction>
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
              <PickerRow
                key={ref.id}
                interactive={editable}
                onClick={() => setSelected({ kind: "ranged", ref })}
              >
                <PickerRowName name={ref.name} />
                <PickerRowChips>
                  <Chip size="sm" colour="violet">
                    Integrated
                  </Chip>
                  <Chip size="sm" colour="sky">
                    Ranged
                  </Chip>
                  <ItemMetaChips
                    weight={ref.weight}
                    value={ref.value}
                    availability={ref.availability}
                    source={ref.source}
                  />
                </PickerRowChips>
                <PickerRowChips className={`text-xs lg:text-sm ${uiTextBody} font-code`}>
                  <span>{ref.class}</span>
                  <span>{ref.range}</span>
                  <span>{ref.rof}</span>
                  <span>{ref.damage}</span>
                  <span>Pen {ref.pen}</span>
                  <span>Clip {ref.clip}</span>
                </PickerRowChips>
                {ref.specialRules && ref.specialRules !== "—" && (
                  <PickerRowInfoLine
                    label="Qualities"
                    info={
                      <InfoModal
                        title={`${ref.name} Qualities`}
                        content={<SpecialRulesContent rules={ref.specialRules} />}
                        as="span"
                      />
                    }
                  >
                    <span className={`text-xs lg:text-sm ${uiTextBody}`}>{ref.specialRules}</span>
                  </PickerRowInfoLine>
                )}
                {ref.description && (
                  <PickerRowInfoLine
                    label="Rules"
                    info={
                      <InfoModal
                        title={ref.name}
                        content={<SpecialRulesContent rules="" description={ref.description} />}
                        as="span"
                      />
                    }
                  />
                )}
              </PickerRow>
            ),
          })),
          ...melee.map((ref) => ({
            name: ref.name,
            row: (
              <PickerRow
                key={ref.id}
                interactive={editable}
                onClick={() => setSelected({ kind: "melee", ref })}
              >
                <PickerRowName name={ref.name} />
                <PickerRowChips>
                  <Chip size="sm" colour="violet">
                    Integrated
                  </Chip>
                  <Chip size="sm" colour="orange">
                    Melee
                  </Chip>
                  <ItemMetaChips
                    weight={ref.weight}
                    value={ref.value}
                    availability={ref.availability}
                    source={ref.source}
                  />
                </PickerRowChips>
                <PickerRowChips className={`text-xs lg:text-sm ${uiTextBody} font-code`}>
                  <span>{ref.class}</span>
                  <span>{ref.damage}</span>
                  <span>Pen {ref.pen}</span>
                </PickerRowChips>
                {ref.specialRules && ref.specialRules !== "—" && (
                  <PickerRowInfoLine
                    label="Qualities"
                    info={
                      <InfoModal
                        title={`${ref.name} Qualities`}
                        content={<SpecialRulesContent rules={ref.specialRules} />}
                        as="span"
                      />
                    }
                  >
                    <span className={`text-xs lg:text-sm ${uiTextBody}`}>{ref.specialRules}</span>
                  </PickerRowInfoLine>
                )}
                {ref.description && (
                  <PickerRowInfoLine
                    label="Rules"
                    info={
                      <InfoModal
                        title={ref.name}
                        content={<SpecialRulesContent rules="" description={ref.description} />}
                        as="span"
                      />
                    }
                  />
                )}
              </PickerRow>
            ),
          })),
          ...custom.map((item) => {
            const data = item.data;
            if (data.weaponKind !== "ranged" && data.weaponKind !== "melee") {
              return { name: item.name, row: null };
            }
            const isRanged = data.weaponKind === "ranged";
            return {
              name: item.name,
              row: (
                <PickerRow
                  key={`custom-${item.id}`}
                  interactive={editable}
                  onClick={() => onSelectCustomItem?.(item)}
                >
                  <PickerRowName name={item.name} badges={<StatusBadge status={item.status} />} />
                  <PickerRowChips>
                    <Chip size="sm" colour="violet">
                      Integrated
                    </Chip>
                    <Chip size="sm" colour={isRanged ? "sky" : "orange"}>
                      {isRanged ? "Ranged" : "Melee"}
                    </Chip>
                    <ItemMetaChips
                      weight={data.weight}
                      value={data.value}
                      availability={data.availability}
                      source={data.source}
                    />
                  </PickerRowChips>
                  <PickerRowChips className={`text-xs lg:text-sm ${uiTextBody} font-code`}>
                    <span>{data.class}</span>
                    {isRanged && <span>{data.range}</span>}
                    {isRanged && <span>{data.rof}</span>}
                    <span>{data.damage}</span>
                    <span>Pen {data.pen}</span>
                    {isRanged && <span>Clip {data.clip}</span>}
                  </PickerRowChips>
                  {data.specialRules && data.specialRules !== "—" && (
                    <PickerRowInfoLine
                      label="Qualities"
                      info={
                        <InfoModal
                          title={`${item.name} Qualities`}
                          content={<SpecialRulesContent rules={data.specialRules} />}
                          as="span"
                        />
                      }
                    >
                      <span className={`text-xs lg:text-sm ${uiTextBody}`}>
                        {data.specialRules}
                      </span>
                    </PickerRowInfoLine>
                  )}
                  {data.description && (
                    <PickerRowInfoLine
                      label="Rules"
                      info={
                        <InfoModal
                          title={item.name}
                          content={<SpecialRulesContent rules="" description={data.description} />}
                          as="span"
                        />
                      }
                    />
                  )}
                </PickerRow>
              ),
            };
          }),
        ]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) => entry.row)}
      </PickerList>
    </PickerModal>
  );
}
