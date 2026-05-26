// src/pages/characterSheet/ArmourTab.tsx

import { useState, useCallback } from "react";
import type { WornArmourPiece, ArmourLocationKey } from "../../types/Character";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../data/reference/armourReference";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArmourTabProps {
  armour: WornArmourPiece[];
  toughnessBonus: number;
  editable: boolean;
  onUpdate: (next: WornArmourPiece[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<ArmourLocationKey, string> = {
  head: "Head",
  body: "Body",
  rightArm: "Right Arm",
  leftArm: "Left Arm",
  rightLeg: "Right Leg",
  leftLeg: "Left Leg",
};

const LOCATION_ORDER: ArmourLocationKey[] = [
  "head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** AP contributed by one piece to one location */
function pieceApAt(piece: WornArmourPiece, loc: ArmourLocationKey): number {
  if (!piece.locations.includes(loc)) return 0;
  return piece.apOverrides?.[loc] ?? piece.ap;
}

/** Total worn AP for a given location */
function wornApAt(pieces: WornArmourPiece[], loc: ArmourLocationKey): number {
  return pieces
    .filter((p) => p.worn)
    .reduce((sum, p) => sum + pieceApAt(p, loc), 0);
}

/** Human-readable list of locations a piece covers */
function locationLabel(locations: ArmourLocationKey[]): string {
  if (locations.length === 6) return "All";
  return locations.map((l) => LOCATION_LABELS[l]).join(", ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Inline reference picker modal */
function ArmourPicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: ArmourRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = ARMOUR_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Armour</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search armour…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  AP {ref.ap}{Object.keys(ref.apOverrides ?? {}).length > 0 ? "*" : ""} · {locationLabel(ref.locations)}
                </span>
              </div>
              {ref.notes && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.notes}</p>
              )}
            </button>
          ))}
        </div>

        {/* Custom */}
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom piece
          </button>
        </div>
      </div>
    </div>
  );
}

/** Notes/info modal for a piece */
function PieceNotesModal({
  piece,
  onClose,
}: {
  piece: WornArmourPiece;
  onClose: () => void;
}) {
  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const notes = piece.notes || ref?.notes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">{piece.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="flex gap-4 text-xs text-slate-400">
            <span>AP: <span className="text-slate-200 font-mono">{piece.ap}</span></span>
            <span>Covers: <span className="text-slate-200">{locationLabel(piece.locations)}</span></span>
          </div>
          {Object.keys(piece.apOverrides ?? {}).length > 0 && (
            <div className="text-xs text-slate-400">
              Overrides:{" "}
              {Object.entries(piece.apOverrides!).map(([loc, ap]) => (
                <span key={loc} className="mr-2">
                  {LOCATION_LABELS[loc as ArmourLocationKey]}: <span className="text-slate-200">{ap}</span>
                </span>
              ))}
            </div>
          )}
          {notes ? (
            <p className="text-sm text-slate-300 leading-relaxed">{notes}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">No special rules.</p>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline form for adding a fully custom piece */
function CustomPieceForm({
  onAdd,
  onCancel,
}: {
  onAdd: (piece: WornArmourPiece) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [ap, setAp] = useState(0);
  const [selectedLocs, setSelectedLocs] = useState<Set<ArmourLocationKey>>(new Set());

  function toggleLoc(loc: ArmourLocationKey) {
    setSelectedLocs((prev) => {
      const next = new Set(prev);
      next.has(loc) ? next.delete(loc) : next.add(loc);
      return next;
    });
  }

  function handleAdd() {
    if (!name.trim() || selectedLocs.size === 0) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      locations: [...selectedLocs],
      ap,
      worn: true,
      custom: true,
    });
  }

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Custom Piece</p>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Flak Jacket"
          className={editableInputClass(true)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Locations covered</label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_ORDER.map((loc) => (
            <button
              key={loc}
              onClick={() => toggleLoc(loc)}
              className={[
                "text-xs px-2 py-1 rounded border transition",
                selectedLocs.has(loc)
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
              ].join(" ")}
            >
              {LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 w-6 shrink-0">AP</label>
        <input
          type="number"
          min={0}
          max={20}
          value={ap}
          onChange={(e) => setAp(Number(e.target.value))}
          className={editableInputClass(true) + " w-20 font-mono"}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!name.trim() || selectedLocs.size === 0}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArmourTab({
  armour,
  toughnessBonus,
  editable,
  onUpdate,
}: ArmourTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [infoTarget, setInfoTarget] = useState<WornArmourPiece | null>(null);

  // ── Piece actions ──────────────────────────────────────────────────────────

  const addPiece = useCallback(
    (piece: WornArmourPiece) => {
      if (!editable) return;
      onUpdate([...armour, piece]);
      setShowPicker(false);
      setShowCustomForm(false);
    },
    [editable, armour, onUpdate]
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
        worn: true,
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

  // ── Data ───────────────────────────────────────────────────────────────────

  const worn = armour.filter((p) => p.worn);
  const stowed = armour.filter((p) => !p.worn);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Armour</h2>

      {/* LOCATION SUMMARY ─────────────────────────────────────────────────── */}
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
                <th className="text-center py-1.5 px-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {LOCATION_ORDER.map((loc) => {
                const ap = wornApAt(armour, loc);
                const total = ap + toughnessBonus;
                return (
                  <tr key={loc} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 pr-4 text-slate-300">{LOCATION_LABELS[loc]}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-200">{ap}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-400">{toughnessBonus}</td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-amber-300">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Total = Armour Points (worn only) + Toughness Bonus
        </p>
      </section>

      {/* WORN PIECES ──────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Worn ({worn.length})
        </h3>
        {worn.length === 0 && (
          <p className="text-sm text-slate-500 italic">No armour worn.</p>
        )}
        {worn.map((piece) => (
          <PieceRow
            key={piece.id}
            piece={piece}
            editable={editable}
            worn
            onToggle={toggleWorn}
            onRemove={removePiece}
            onInfo={setInfoTarget}
          />
        ))}
      </section>

      {/* STOWED PIECES ────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Stowed ({stowed.length})
        </h3>
        {stowed.length === 0 && (
          <p className="text-sm text-slate-500 italic">No armour stowed.</p>
        )}
        {stowed.map((piece) => (
          <PieceRow
            key={piece.id}
            piece={piece}
            editable={editable}
            worn={false}
            onToggle={toggleWorn}
            onRemove={removePiece}
            onInfo={setInfoTarget}
          />
        ))}
      </section>

      {/* ADD BUTTON + CUSTOM FORM ─────────────────────────────────────────── */}
      {editable && (
        <section className="space-y-3">
          {!showCustomForm && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
            >
              <span className="text-amber-400 font-bold">+</span>
              Add Armour
            </button>
          )}

          {showCustomForm && (
            <CustomPieceForm
              onAdd={addPiece}
              onCancel={() => setShowCustomForm(false)}
            />
          )}
        </section>
      )}

      {/* MODALS ───────────────────────────────────────────────────────────── */}
      {showPicker && (
        <ArmourPicker
          onSelect={fromReference}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {infoTarget && (
        <PieceNotesModal
          piece={infoTarget}
          onClose={() => setInfoTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Piece Row ────────────────────────────────────────────────────────────────

function PieceRow({
  piece,
  editable,
  worn,
  onToggle,
  onRemove,
  onInfo,
}: {
  piece: WornArmourPiece;
  editable: boolean;
  worn: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (piece: WornArmourPiece) => void;
}) {
  const apDesc =
    Object.keys(piece.apOverrides ?? {}).length > 0
      ? `AP ${piece.ap}*`
      : `AP ${piece.ap}`;

  return (
    <div
      className={[
        sectionContainerClass(editable),
        "flex items-center gap-3",
        !worn ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-200 truncate block">
          {piece.name}
        </span>
        <span className="text-xs text-slate-500">
          {locationLabel(piece.locations)} · {apDesc}
        </span>
      </div>

      {/* Info */}
      <button
        onClick={() => onInfo(piece)}
        title="View rules"
        className="text-slate-500 hover:text-slate-300 text-sm px-1 transition"
      >
        ⓘ
      </button>

      {/* Stow / Wear */}
      {editable && (
        <button
          onClick={() => onToggle(piece.id)}
          className="text-xs px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {worn ? "Stow" : "Wear"}
        </button>
      )}

      {/* Remove */}
      {editable && (
        <button
          onClick={() => onRemove(piece.id)}
          className="text-xs text-red-400 hover:text-red-300 transition"
        >
          Remove
        </button>
      )}
    </div>
  );
}
