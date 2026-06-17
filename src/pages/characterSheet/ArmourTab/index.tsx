// src/pages/characterSheet/ArmourTab/index.tsx

import { useState, useCallback } from "react";
import type {
  WornArmourPiece,
  CyberneticItem,
  ArmourCraftsmanship,
} from "../../../types/Character";
import type { ArmourRef } from "../../../data/reference/armourReference";

import { wornApAt, bionicBonusAt, LOCATION_LABELS, LOCATION_ORDER } from "./armourHelpers";
import { ArmourPicker } from "./ArmourPicker";
import { ForceFieldPicker } from "./ForceFieldPicker";
import { PieceNotesModal } from "./PieceNotesModal";
import { CustomPieceForm } from "./CustomPieceForm";
import { ForceFieldRow } from "./ForceFieldRow";
import { PieceRow } from "./PieceRow";
import { uiSection } from "../../../ui/editableStyles";
import { SectionHeader } from "../../../ui/SectionHeader";

interface ArmourTabProps {
  armour: WornArmourPiece[];
  toughnessBonus: number;
  editable: boolean;
  onUpdate: (next: WornArmourPiece[]) => void;
  cybernetics?: CyberneticItem[];
}

function formatKg(value: number): string {
  return `${Number(value.toFixed(2))} kg`;
}

function halveWeight(weight: string): string {
  const match = weight.trim().match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (!match) return weight;
  return formatKg(Number(match[1]) / 2);
}

function applyCraftsmanshipToRef(ref: ArmourRef, craftsmanship: ArmourCraftsmanship) {
  if (craftsmanship !== "Best") {
    return {
      ap: ref.ap,
      apOverrides: ref.apOverrides,
      weight: ref.weight,
    };
  }

  const apOverrides = ref.apOverrides
    ? (Object.fromEntries(
        Object.entries(ref.apOverrides).map(([location, ap]) => [location, (ap ?? ref.ap) + 1])
      ) as typeof ref.apOverrides)
    : undefined;

  return {
    ap: ref.ap + 1,
    apOverrides,
    weight: halveWeight(ref.weight),
  };
}

function ArmourPieceGrid({
  pieces,
  editable,
  worn,
  onToggle,
  onRemove,
  onInfo,
}: {
  pieces: WornArmourPiece[];
  editable: boolean;
  worn: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (piece: WornArmourPiece) => void;
}) {
  const columns = [
    pieces.filter((_, index) => index % 2 === 0),
    pieces.filter((_, index) => index % 2 === 1),
  ];

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {pieces.map((piece) => (
          <PieceRow
            key={piece.id}
            piece={piece}
            editable={editable}
            worn={worn}
            onToggle={onToggle}
            onRemove={onRemove}
            onInfo={onInfo}
          />
        ))}
      </div>
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-2 sm:items-start">
        {columns.map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map((piece) => (
              <PieceRow
                key={piece.id}
                piece={piece}
                editable={editable}
                worn={worn}
                onToggle={onToggle}
                onRemove={onRemove}
                onInfo={onInfo}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function ForceFieldGrid({
  pieces,
  editable,
  onToggle,
  onRemove,
  onInfo,
}: {
  pieces: WornArmourPiece[];
  editable: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (piece: WornArmourPiece) => void;
}) {
  const columns = [
    pieces.filter((_, index) => index % 2 === 0),
    pieces.filter((_, index) => index % 2 === 1),
  ];

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {pieces.map((piece) => (
          <ForceFieldRow
            key={piece.id}
            piece={piece}
            editable={editable}
            onToggle={onToggle}
            onRemove={onRemove}
            onInfo={onInfo}
          />
        ))}
      </div>
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-2 sm:items-start">
        {columns.map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map((piece) => (
              <ForceFieldRow
                key={piece.id}
                piece={piece}
                editable={editable}
                onToggle={onToggle}
                onRemove={onRemove}
                onInfo={onInfo}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
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
      const nextPiece = piece.isForceField
        ? piece
        : { ...piece, craftsmanship: piece.craftsmanship ?? ("Common" as const) };
      onUpdate([...armour, { ...nextPiece, worn: pickerMode === "worn" }]);
      setShowPicker(false);
      setShowCustomForm(false);
    },
    [editable, armour, onUpdate, pickerMode]
  );

  const fromReference = useCallback(
    (ref: ArmourRef, craftsmanship: ArmourCraftsmanship = "Common") => {
      const crafted = applyCraftsmanshipToRef(ref, craftsmanship);
      addPiece({
        id: crypto.randomUUID(),
        referenceId: ref.id,
        name: ref.name,
        locations: ref.locations,
        ap: crafted.ap,
        ...(crafted.apOverrides ? { apOverrides: crafted.apOverrides } : {}),
        ...(ref.isForceField ? { isForceField: true } : {}),
        ...(ref.protectionRating !== undefined ? { protectionRating: ref.protectionRating } : {}),
        ...(!ref.isForceField ? { craftsmanship } : {}),
        worn: true,
        weight: crafted.weight,
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

  const toggleForceField = useCallback(
    (id: string) => {
      if (!editable) return;
      const field = armour.find((p) => p.id === id);
      if (!field) return;
      const activating = !field.worn;
      onUpdate(
        armour.map((p) => {
          if (!p.isForceField) return p;
          if (activating) return { ...p, worn: p.id === id };
          return p.id === id ? { ...p, worn: false } : p;
        })
      );
    },
    [editable, armour, onUpdate]
  );

  const regularArmour = armour.filter((p) => !p.isForceField);
  const forceFields = armour.filter((p) => p.isForceField);
  const worn = regularArmour.filter((p) => p.worn);
  const stowed = regularArmour.filter((p) => !p.worn);

  return (
    <div className="space-y-6">
      {/* LOCATION SUMMARY */}
      <section>
        <SectionHeader className="mb-2">Location Summary</SectionHeader>
        <div className={uiSection}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm lg:text-base border-collapse">
              <thead>
                <tr className="text-xs lg:text-sm text-slate-500 uppercase">
                  <th className="text-left py-1.5 pr-4 font-medium">Location</th>
                  <th className="text-center py-1.5 px-3 font-medium">AP</th>
                  <th className="text-center py-1.5 px-3 font-medium">TB</th>
                  <th className="text-center py-1.5 px-3 font-medium">Bionic</th>
                  <th className="text-center py-1.5 px-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {LOCATION_ORDER.map((loc) => {
                  const ap = wornApAt(regularArmour, loc);
                  const bionic = bionicBonusAt(loc, cybernetics);
                  const total = ap + toughnessBonus + bionic;
                  return (
                    <tr key={loc} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 pr-4 text-slate-100">{LOCATION_LABELS[loc]}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-200">{ap}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {toughnessBonus}
                      </td>
                      <td
                        className={`py-2 px-3 text-center font-mono ${bionic > 0 ? "text-cyan-400" : "text-slate-700"}`}
                      >
                        {bionic > 0 ? `+${bionic}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-semibold text-amber-300">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs lg:text-sm text-slate-600 mt-2">
            Total = Armour Points (worn only) + Toughness Bonus + Bionic (+2 per installed bionic
            limb)
          </p>
        </div>
      </section>

      {/* WORN PIECES */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Worn ({worn.length})</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => {
                setPickerMode("worn");
                setShowPicker(true);
              }}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
            >
              {editable ? "+ Equip" : "View"}
            </button>
          )}
        </div>
        {worn.length === 0 && <p className="text-sm lg:text-base text-slate-500 italic">No armour worn.</p>}
        {worn.length > 0 && (
          <ArmourPieceGrid
            pieces={worn}
            editable={editable}
            worn
            onToggle={toggleWorn}
            onRemove={removePiece}
            onInfo={setInfoTarget}
          />
        )}
      </section>

      {/* STOWED PIECES */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Stowed ({stowed.length})</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => {
                setPickerMode("stowed");
                setShowPicker(true);
              }}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
            >
              {editable ? "+ Stow" : "View"}
            </button>
          )}
        </div>
        {stowed.length === 0 && <p className="text-sm lg:text-base text-slate-500 italic">No armour stowed.</p>}
        {stowed.length > 0 && (
          <ArmourPieceGrid
            pieces={stowed}
            editable={editable}
            worn={false}
            onToggle={toggleWorn}
            onRemove={removePiece}
            onInfo={setInfoTarget}
          />
        )}
      </section>

      {/* FORCE FIELDS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Force Fields ({forceFields.length})</SectionHeader>
          <button
            onClick={() => setShowFieldPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>
        {forceFields.length === 0 && (
          <p className="text-sm lg:text-base text-slate-500 italic">No force field equipped.</p>
        )}
        {forceFields.length > 0 && (
          <ForceFieldGrid
            pieces={forceFields}
            editable={editable}
            onToggle={toggleForceField}
            onRemove={removePiece}
            onInfo={setInfoTarget}
          />
        )}
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
          editable={editable}
          onSelect={fromReference}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showFieldPicker && (
        <ForceFieldPicker
          editable={editable}
          onSelect={(ref) => {
            fromReference(ref);
            setShowFieldPicker(false);
          }}
          onClose={() => setShowFieldPicker(false)}
        />
      )}
      {infoTarget && <PieceNotesModal piece={infoTarget} onClose={() => setInfoTarget(null)} />}
    </div>
  );
}
