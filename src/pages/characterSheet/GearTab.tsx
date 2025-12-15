import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

interface GearTabProps {
  gear: string[];
  editable: boolean;
  onUpdate: (newGear: string[]) => void;
}

export function GearTab({ gear, editable, onUpdate }: GearTabProps) {
  function updateItem(index: number, value: string) {
    if (!editable) return;
    const next = [...gear];
    next[index] = value;
    onUpdate(next);
  }

  function deleteItem(index: number) {
    if (!editable) return;
    const next = [...gear];
    next.splice(index, 1);
    onUpdate(next);
  }

  function addItem() {
    if (!editable) return;
    onUpdate([...gear, ""]);
  }

  return (
    <div className="space-y-5 text-slate-300">
      <h2 className="text-xl font-semibold">Gear</h2>

      {gear.length === 0 && (
        <p className="text-sm text-slate-500">
          No general equipment recorded.
        </p>
      )}

      <ul className="space-y-2">
        {gear.map((item, idx) => (
          <li
            key={idx}
            className={sectionContainerClass(editable) + " flex items-center gap-2"}
          >
            {editable ? (
              <>
                <input
                  value={item}
                  placeholder="Equipment item…"
                  onChange={(e) => updateItem(idx, e.target.value)}
                  className={editableInputClass(true) + " flex-1"}
                />

                <button
                  onClick={() => deleteItem(idx)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-200">
                {item || "—"}
              </span>
            )}
          </li>
        ))}
      </ul>

      {editable && (
        <button
          onClick={addItem}
          className="text-xs rounded border border-slate-600 bg-slate-800 px-3 py-1 hover:bg-slate-700"
        >
          + Add Gear
        </button>
      )}
    </div>
  );
}