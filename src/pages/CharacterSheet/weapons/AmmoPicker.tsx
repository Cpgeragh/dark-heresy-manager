import { useState } from "react";
import { AMMO_REFERENCE, formatAmmoName } from "../../../data/reference/ammoReference";
import { Button } from "../../../ui/buttons/Button";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { uiItemName, uiTextMuted } from "../../../ui/styles/editableStyles";

// ─── Ammo Picker ──────────────────────────────────────────────────────────────

export function AmmoPicker({
  compatibleIds,
  existingNames,
  allowDuplicates = false,
  showCustom = true,
  title,
  editable = true,
  closeOnSelect = true,
  onSelect,
  onClose,
}: {
  compatibleIds?: readonly string[];
  existingNames: Set<string>;
  allowDuplicates?: boolean;
  showCustom?: boolean;
  title?: string;
  editable?: boolean;
  closeOnSelect?: boolean;
  onSelect: (name: string, referenceId?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");

  const pool = compatibleIds
    ? AMMO_REFERENCE.filter((a) => compatibleIds.includes(a.id))
    : AMMO_REFERENCE;

  const options = query.trim()
    ? pool.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : pool;

  return (
    <PickerModal
      title={title ?? (editable ? "Add Ammo Type" : "View Ammo Types")}
      placeholder="Search ammo…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={options.length === 0}
      footer={
        editable && showCustom ? (
          <div className="space-y-2">
            <p className={`text-xs lg:text-sm ${uiTextMuted}`}>Custom / unlisted ammo</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ammo name…"
                className="flex-1 text-sm lg:text-base bg-slate-800 border border-slate-600 rounded px-2 lg:px-3 py-1 lg:py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={() => {
                  if (customName.trim()) {
                    onSelect(customName.trim());
                    if (closeOnSelect) onClose();
                    else setCustomName("");
                  }
                }}
                disabled={
                  !customName.trim() || (!allowDuplicates && existingNames.has(customName.trim()))
                }
              >
                Add
              </Button>
            </div>
            {!closeOnSelect && (
              <Button variant="secondary" fullWidth onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {options.map((ammo) => (
        <PickerRow
          key={ammo.id}
          interactive={editable}
          onClick={() => {
            onSelect(formatAmmoName(ammo.name), ammo.id);
            if (closeOnSelect) onClose();
          }}
          disabled={editable && !allowDuplicates && existingNames.has(formatAmmoName(ammo.name))}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`${uiItemName} group-hover:text-white`}>
              {formatAmmoName(ammo.name)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <ItemMetaChips
                availability={ammo.availability}
                value={ammo.cost}
                purchaseAmount={ammo.purchaseAmount}
                bare
              />
            </div>
          </div>
          {ammo.description && (
            <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5 line-clamp-2`}>
              {ammo.description}
            </p>
          )}
        </PickerRow>
      ))}
    </PickerModal>
  );
}
