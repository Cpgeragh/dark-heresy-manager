import { useState } from "react";
import type { RangedWeaponRef, MeleeWeaponRef } from "../../../data/reference/weaponReference";
import type { WeaponCraftsmanship } from "../../../types/Character";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
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
  onCustomRanged,
  onCustomMelee,
  onClose,
}: {
  editable?: boolean;
  onSelectRanged: (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectMelee: (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onCustomRanged?: () => void;
  onCustomMelee?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedIntegrated | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const lowerQuery = query.toLowerCase();
  const ranged = INTEGRATED_RANGED_REFS.filter((ref) =>
    ref.name.toLowerCase().includes(lowerQuery)
  );
  const melee = INTEGRATED_MELEE_REFS.filter((ref) => ref.name.toLowerCase().includes(lowerQuery));
  const isEmpty = ranged.length === 0 && melee.length === 0;

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
            onClick={() =>
              selected.kind === "ranged"
                ? onSelectRanged(selected.ref, craftsmanship)
                : onSelectMelee(selected.ref, craftsmanship)
            }
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
      {ranged.map((ref) => (
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
      ))}
      {melee.map((ref) => (
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
      ))}
    </PickerModal>
  );
}
