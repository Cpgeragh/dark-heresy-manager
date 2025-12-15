// src/pages/characterSheet/PsychicTab.tsx

import type { PsychicBlock, PsychicPower } from "../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

interface PsychicTabProps {
  psychic: PsychicBlock;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

export function PsychicTab({
  psychic,
  editable,
  onUpdate,
}: PsychicTabProps) {
  function updatePower(
    list: "minorPowers" | "majorPowers",
    id: string,
    next: Partial<PsychicPower>
  ) {
    if (!editable) return;

    onUpdate({
      ...psychic,
      [list]: psychic[list].map((p) =>
        p.id === id ? { ...p, ...next } : p
      ),
    });
  }

  function addPower(list: "minorPowers" | "majorPowers") {
    if (!editable) return;

    onUpdate({
      ...psychic,
      [list]: [
        ...psychic[list],
        {
          id: crypto.randomUUID(),
          name: "",
          known: false,
          isMinor: list === "minorPowers",
        },
      ],
    });
  }

  function deletePower(list: "minorPowers" | "majorPowers", id: string) {
    if (!editable) return;

    onUpdate({
      ...psychic,
      [list]: psychic[list].filter((p) => p.id !== id),
    });
  }

  function PowerCard({
    power,
    list,
    subtle,
  }: {
    power: PsychicPower;
    list: "minorPowers" | "majorPowers";
    subtle?: boolean;
  }) {
    return (
      <div
        className={`rounded border p-3 space-y-2 ${
          subtle
            ? "border-slate-700 bg-slate-900/30"
            : "border-indigo-600/40 bg-indigo-900/25"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={!editable}
            checked={power.known}
            onChange={(e) =>
              updatePower(list, power.id, { known: e.target.checked })
            }
            className={!editable ? "cursor-not-allowed opacity-60" : ""}
          />

          <input
            disabled={!editable}
            value={power.name}
            placeholder="Power name"
            onChange={(e) =>
              updatePower(list, power.id, { name: e.target.value })
            }
            className={editableInputClass(editable)}
          />

          {editable && (
            <button
              onClick={() => deletePower(list, power.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          )}
        </div>

        {/* MAJOR METADATA */}
        {!subtle && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              disabled={!editable}
              value={power.threshold ?? ""}
              placeholder="Threshold"
              onChange={(e) =>
                updatePower(list, power.id, {
                  threshold: e.target.value,
                })
              }
              className={editableInputClass(editable)}
            />

            <input
              disabled={!editable}
              value={power.focusTime ?? ""}
              placeholder="Focus Time"
              onChange={(e) =>
                updatePower(list, power.id, {
                  focusTime: e.target.value,
                })
              }
              className={editableInputClass(editable)}
            />

            <input
              disabled={!editable}
              value={power.range ?? ""}
              placeholder="Range"
              onChange={(e) =>
                updatePower(list, power.id, { range: e.target.value })
              }
              className={editableInputClass(editable)}
            />

            <input
              disabled={!editable}
              value={power.sustained ?? ""}
              placeholder="Sustained"
              onChange={(e) =>
                updatePower(list, power.id, {
                  sustained: e.target.value,
                })
              }
              className={editableInputClass(editable)}
            />
          </div>
        )}

        {/* DESCRIPTION */}
        <textarea
          disabled={!editable}
          value={power.description ?? ""}
          placeholder="Description / effects"
          onChange={(e) =>
            updatePower(list, power.id, {
              description: e.target.value,
            })
          }
          className={editableTextareaClass(editable) + " text-xs min-h-[56px]"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Psychic Powers</h2>

      {/* HEADER */}
      <section className={sectionContainerClass(editable)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Psy Rating
            <input
              type="number"
              disabled={!editable}
              value={psychic.psyRating}
              onChange={(e) =>
                onUpdate({
                  ...psychic,
                  psyRating: Number(e.target.value),
                })
              }
              className={editableInputClass(editable)}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Discipline
            <input
              disabled={!editable}
              value={psychic.discipline ?? ""}
              onChange={(e) =>
                onUpdate({
                  ...psychic,
                  discipline: e.target.value,
                })
              }
              className={editableInputClass(editable)}
            />
          </label>
        </div>
      </section>

      {/* POWERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MINOR */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-300">
              Minor Powers
            </h3>

            {editable && (
              <button
                onClick={() => addPower("minorPowers")}
                className="text-xs rounded border border-slate-600 bg-slate-800 px-3 py-1 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {psychic.minorPowers.length === 0 && (
            <p className="text-xs text-slate-500">
              No minor powers recorded.
            </p>
          )}

          <div className="space-y-3">
            {psychic.minorPowers.map((p) => (
              <PowerCard
                key={p.id}
                power={p}
                list="minorPowers"
                subtle
              />
            ))}
          </div>
        </section>

        {/* MAJOR */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-indigo-300">
              Major Powers
            </h3>

            {editable && (
              <button
                onClick={() => addPower("majorPowers")}
                className="text-xs rounded border border-indigo-500 bg-indigo-700 px-3 py-1 text-white hover:bg-indigo-600"
              >
                + Add
              </button>
            )}
          </div>

          {psychic.majorPowers.length === 0 && (
            <p className="text-xs text-slate-500">
              No major powers recorded.
            </p>
          )}

          <div className="space-y-3">
            {psychic.majorPowers.map((p) => (
              <PowerCard
                key={p.id}
                power={p}
                list="majorPowers"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}