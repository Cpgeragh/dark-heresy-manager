import type { PsychicBlock, PsychicPower } from "../../types/Character";

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
    const updated = psychic[list].map((p) =>
      p.id === id ? { ...p, ...next } : p
    );

    onUpdate({
      ...psychic,
      [list]: updated,
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
            : "border-indigo-600/40 bg-indigo-900/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={!editable}
            checked={power.known}
            onChange={(e) =>
              updatePower(list, power.id, { known: e.target.checked })
            }
          />

          <input
            disabled={!editable}
            value={power.name}
            placeholder="Power name"
            onChange={(e) =>
              updatePower(list, power.id, { name: e.target.value })
            }
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-sm"
          />

          {editable && (
            <button
              onClick={() => deletePower(list, power.id)}
              className="text-xs px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600"
            >
              Delete
            </button>
          )}
        </div>

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
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
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
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
            />

            <input
              disabled={!editable}
              value={power.range ?? ""}
              placeholder="Range"
              onChange={(e) =>
                updatePower(list, power.id, { range: e.target.value })
              }
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
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
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
            />
          </div>
        )}

        <textarea
          disabled={!editable}
          value={power.description ?? ""}
          placeholder="Description / effects"
          onChange={(e) =>
            updatePower(list, power.id, {
              description: e.target.value,
            })
          }
          className="w-full min-h-[60px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs resize-y"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Psychic Powers</h2>

      {/* HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Psy Rating
          </label>
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
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Discipline
          </label>
          <input
            disabled={!editable}
            value={psychic.discipline ?? ""}
            onChange={(e) =>
              onUpdate({
                ...psychic,
                discipline: e.target.value,
              })
            }
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
          />
        </div>
      </div>

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
                className="text-xs px-3 py-1 rounded bg-slate-700 text-slate-100 hover:bg-slate-600"
              >
                + Add Minor
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
                className="text-xs px-3 py-1 rounded bg-indigo-700 text-white hover:bg-indigo-600"
              >
                + Add Major
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