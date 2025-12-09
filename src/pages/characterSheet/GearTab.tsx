// src/pages/characterSheet/GearTab.tsx

interface GearTabProps {
  gear: string[];
  editable: boolean;
  onUpdate: (newGear: string[]) => void;
}

export function GearTab({ gear, editable, onUpdate }: GearTabProps) {
  const updateItem = (index: number, value: string) => {
    if (!editable) return;
    const next = [...gear];
    next[index] = value;
    onUpdate(next);
  };

  const deleteItem = (index: number) => {
    if (!editable) return;
    const next = [...gear];
    next.splice(index, 1);
    onUpdate(next);
  };

  const addItem = () => {
    if (!editable) return;
    onUpdate([...gear, ""]);
  };

  return (
    <div className="space-y-4 text-slate-300">
      <h2 className="text-xl font-semibold mb-2">Gear</h2>

      {gear.length === 0 && !editable && (
        <p className="text-slate-400">No gear listed.</p>
      )}

      <ul className="space-y-2">
        {gear.map((item, idx) => (
          <li
            key={idx}
            className="flex items-center gap-2 border border-slate-700 rounded p-2 bg-slate-900/60"
          >
            {editable ? (
              <>
                <input
                  className="flex-1 bg-slate-800 border border-slate-600 rounded p-1 text-slate-100"
                  value={item}
                  onChange={(e) => updateItem(idx, e.target.value)}
                />
                <button
                  onClick={() => deleteItem(idx)}
                  className="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </>
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ul>

      {editable && (
        <button
          onClick={addItem}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          + Add Gear Item
        </button>
      )}
    </div>
  );
}