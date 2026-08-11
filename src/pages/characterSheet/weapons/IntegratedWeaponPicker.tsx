import { useState } from "react";
import type { RangedWeaponRef, MeleeWeaponRef } from "../../../data/reference/weaponReference";
import type { WeaponCraftsmanship } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatusBadge } from "../../../ui/StatusBadge";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { ArrowLeft } from "../../../ui/PickerArrows";
import { uiTextBody, uiTextLabel, uiTextMuted, uiItemName, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { colourViolet, colourSky, colourOrange } from "../../../ui/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { INTEGRATED_RANGED_REFS, INTEGRATED_MELEE_REFS } from "../../../utils/weaponUtils";
import { SpecialRulesContent } from "./weaponShared";
import {
  rangedCraftsmanshipDescription,
  meleeCraftsmanshipDescription,
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
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button type="button"
                  key={option}
                  onClick={() => setCraftsmanship(option)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === option
                      ? CRAFTSMANSHIP_STYLE[option]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
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
      isEmpty={isEmpty}
      footer={
        editable && (onCustomRanged || onCustomMelee) ? (
          <div className="grid grid-cols-2 gap-2">
            {onCustomRanged && (
              <PickerCustomAction onClick={onCustomRanged}>
                + Custom ranged
              </PickerCustomAction>
            )}
            {onCustomMelee && (
              <PickerCustomAction onClick={onCustomMelee}>
                + Custom melee
              </PickerCustomAction>
            )}
          </div>
        ) : undefined
      }
    >
      {[
        ...ranged.map((ref) => ({ name: ref.name, row: (
        <PickerRow
          key={ref.id}
          interactive={editable}
          onClick={() => setSelected({ kind: "ranged", ref })}
        >
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Chip size="sm" className={colourViolet}>
              Integrated
            </Chip>
            <Chip size="sm" className={colourSky}>
              Ranged
            </Chip>
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
          </div>
          <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted} mt-0.5 flex-wrap font-code`}>
            <span>{ref.class}</span>
            <span>{ref.range}</span>
            <span>{ref.rof}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
            <span>Clip {ref.clip}</span>
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
      ) })),
      ...melee.map((ref) => ({ name: ref.name, row: (
        <PickerRow
          key={ref.id}
          interactive={editable}
          onClick={() => setSelected({ kind: "melee", ref })}
        >
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Chip size="sm" className={colourViolet}>
              Integrated
            </Chip>
            <Chip size="sm" className={colourOrange}>
              Melee
            </Chip>
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
          </div>
          <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted} mt-0.5 flex-wrap font-code`}>
            <span>{ref.class}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
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
      ) })),
      ...custom.map((item) => {
        const data = item.data;
        if (data.weaponKind !== "ranged" && data.weaponKind !== "melee") {
          return { name: item.name, row: null };
        }
        const isRanged = data.weaponKind === "ranged";
        return { name: item.name, row: (
          <PickerRow
            key={`custom-${item.id}`}
            interactive={editable}
            onClick={() => onSelectCustomItem?.(item)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}>{item.name}</span>
              <StatusBadge status={item.status} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Chip size="sm" className={colourViolet}>Integrated</Chip>
              <Chip size="sm" className={isRanged ? colourSky : colourOrange}>
                {isRanged ? "Ranged" : "Melee"}
              </Chip>
              <ItemMetaChips
                weight={data.weight}
                value={data.value}
                availability={data.availability}
                source={data.source}
              />
            </div>
            <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted} mt-0.5 flex-wrap font-code`}>
              <span>{data.class}</span>
              {isRanged && <span>{data.range}</span>}
              {isRanged && <span>{data.rof}</span>}
              <span>{data.damage}</span>
              <span>Pen {data.pen}</span>
              {isRanged && <span>Clip {data.clip}</span>}
            </div>
            {data.specialRules && data.specialRules !== "—" && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={uiTextLabel}>Qualities</span>
                <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{data.specialRules}</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title={`${item.name} Qualities`} content={<SpecialRulesContent rules={data.specialRules} />} as="span" />
                </span>
              </div>
            )}
            {data.description && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={uiTextLabel}>Rules</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title={item.name} content={<SpecialRulesContent rules="" description={data.description} />} as="span" />
                </span>
              </div>
            )}
          </PickerRow>
        ) };
      }),
      ].sort((a, b) => a.name.localeCompare(b.name)).map((entry) => entry.row)}
    </PickerModal>
  );
}
