// src/pages/characterSheet/ArmourTab/index.tsx

import { useState, useCallback } from "react";
import type { WornArmourPiece, CyberneticItem } from "../../../types/Character";
import type { ArmourRef } from "../../../data/reference/armourReference";

import { wornApAt, bionicBonusAt, LOCATION_LABELS, LOCATION_ORDER } from "./armourHelpers";
import { ArmourPicker } from "./ArmourPicker";
import { ForceFieldPicker } from "./ForceFieldPicker";
import { PieceNotesModal } from "./PieceNotesModal";
import { CustomPieceForm } from "./CustomPieceForm";
import { ForceFieldRow } from "./ForceFieldRow";
import { PieceRow } from "./PieceRow";

interface ArmourTabProps {
  armour: WornArmourPiece[];
  toughnessBonus: number;
  editable: boolean;
  onUpdate: (next: WornArmourPiece[]) => void;
  cybernetics?: CyberneticItem[];
}

export function ArmourTab({
  armour,
  toughnessBonus,
  editable,
  onUpdate,
  cybernetics = [],
}: ArmourTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [infoTarget, setInfoTarget] = useState<WornArmourPiece | null>(null);
  const [pickerMode, setPickerMode] = useState<"worn" | "stowed">("worn");

  const addPiece = useCallback(
    (piece: WornArmourPiece) => {
      if (!editable) return;
      onUpdate([...armour, { ...piece, worn: pickerMode === "worn" }]);
      setShowPicker(false);
      setShowCustomForm(false);
    },
    [editable, armour, onUpdate, pickerMode]
  );

  const fromReference = useCallback(
    (ref: ArmourRef) => {
      addPiece({
        id: crypto.randomUUID(),
        referenceId: ref.id,
        name: ref.name,
        locations: ref.locations,
        ap: ref.ap,
        ...(ref.apOverrides ? { apOverrides: ref.apOverrides } : {}),
        ...(ref.isForceField ? { isForceField: true } : {}),
        ...(ref.protectionRating !== undefined ? { protectionRating: ref.protectionRating } : {}),
        worn: true,
        weight: ref.weight,
        value: ref.value,
        rarity: ref.rarity,
        source: ref.source,
      });
    },
    [addPiece]
  );

  const toggleWorn = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(armour.map((p) => (p.id === id ? { ...p, worn: !p.worn } : p)));
    },
    [editable, armour, onUpdate]
  );

  const removePiece = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(armour.filter((p) => p.id !== id));
    },
    [editable, armour, onUpdate]
  );

  const regularArmour = armour.filter((p) => !p.isForceField);
  const forceFields   = armour.filter((p) => p.isForceField);
  const worn          = regularArmour.filter((p) => p.worn);
  const stowed        = regularArmour.filter((p) => !p.worn);

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Armour</h2>

      {/* LOCATION SUMMARY */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Location Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-slate-500 uppercase">
                <th className="text-left py-1.5 pr-4 font-medium">Location</th>
                <th className="text-center py-1.5 px-3 font-medium">AP</th>
                <th className="text-center py-1.5 px-3 font-medium">TB</th>
                <th className="text-center py-1.5 px-3 font-medium">Bionic</th>
                <th className="text-center py-1.5 px-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {LOCATION_ORDER.map((loc) => {
                const ap     = wornApAt(regularArmour, loc);
                const bionic = bionicBonusAt(loc, cybernetics);
                const total  = ap + toughnessBonus + bionic;
                return (
                  <tr key={loc} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 pr-4 text-slate-300">{LOCATION_LABELS[loc]}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-200">{ap}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-400">{toughnessBonus}</td>
                    <td className={`py-2 px-3 text-center font-mono ${bionic > 0 ? "text-cyan-400" : "text-slate-700"}`}>
                      {bionic > 0 ? `+${bionic}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-amber-300">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Total = Armour Points (worn only) + Toughness Bonus + Bionic (+2 per installed bionic limb)
        </p>
      </section>

      {/* WORN PIECES */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Worn ({worn.length})
          </h3>
          {editable && !showCustomForm && (
            <button
              onClick={() => { setPickerMode("worn"); setShowPicker(true); }}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
            >
              + Equip
            </button>
          )}
        </div>
        {worn.length === 0 && <p className="text-sm text-slate-500 italic">No armour worn.</p>}
        {worn.map((piece) => (
          <PieceRow key={piece.id} piece={piece} editable={editable} worn onToggle={toggleWorn} onRemove={removePiece} onInfo={setInfoTarget} />
        ))}
      </section>

      {/* STOWED PIECES */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Stowed ({stowed.length})
          </h3>
          {editable && !showCustomForm && (
            <button
              onClick={() => { setPickerMode("stowed"); setShowPicker(true); }}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
            >
              + Stow
            </button>
          )}
        </div>
        {stowed.length === 0 && <p className="text-sm text-slate-500 italic">No armour stowed.</p>}
        {stowed.map((piece) => (
          <PieceRow key={piece.id} piece={piece} editable={editable} worn={false} onToggle={toggleWorn} onRemove={removePiece} onInfo={setInfoTarget} />
        ))}
      </section>

      {/* FORCE FIELDS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Force Fields ({forceFields.length})
          </h3>
          {editable && (
            <button
              onClick={() => setShowFieldPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
            >
              + Add
            </button>
          )}
        </div>
        {forceFields.length === 0 && <p className="text-sm text-slate-500 italic">No force field equipped.</p>}
        {forceFields.map((piece) => (
          <ForceFieldRow key={piece.id} piece={piece} editable={editable} onToggle={toggleWorn} onRemove={removePiece} onInfo={setInfoTarget} />
        ))}
      </section>

      {/* CUSTOM FORM */}
      {editable && showCustomForm && (
        <section>
          <CustomPieceForm onAdd={addPiece} onCancel={() => setShowCustomForm(false)} />
        </section>
      )}

      {/* MODALS */}
      {showPicker && (
        <ArmourPicker
          onSelect={fromReference}
          onCustom={() => { setShowPicker(false); setShowCustomForm(true); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showFieldPicker && (
        <ForceFieldPicker
          onSelect={(ref) => { fromReference(ref); setShowFieldPicker(false); }}
          onClose={() => setShowFieldPicker(false)}
        />
      )}
      {infoTarget && (
        <PieceNotesModal piece={infoTarget} onClose={() => setInfoTarget(null)} />
      )}
    </div>
  );
}
