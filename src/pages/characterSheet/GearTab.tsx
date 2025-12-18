// src/pages/characterSheet/GearTab.tsx

import { useCallback } from "react";
import { sectionContainerClass } from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";

interface GearTabProps {
  gear: string[];
  editable: boolean;
  onUpdate: (next: string[]) => void;
}

export function GearTab({ gear, editable, onUpdate }: GearTabProps) {
  const addItem = useCallback(() => {
    if (!editable) return;
    onUpdate([...gear, ""]);
  }, [editable, gear, onUpdate]);

  const removeItem = useCallback((index: number) => {
    if (!editable) return;
    const next = [...gear];
    next.splice(index, 1);
    onUpdate(next);
  }, [editable, gear, onUpdate]);

  const updateItem = useCallback((index: number, value: string) => {
    if (!editable) return;
    const next = [...gear];
    next[index] = value;
    onUpdate(next);
  }, [editable, gear, onUpdate]);

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Gear & Equipment</h2>

      {/* ITEMS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Equipment List</h3>
          {editable && (
            <button
              onClick={addItem}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add Item
            </button>
          )}
        </div>

        <p className="text-sm text-slate-400">
          List all carried equipment, including weight, craftsmanship, and any special properties.
        </p>

        {gear.length === 0 ? (
          <p className="text-sm text-slate-400">No items recorded.</p>
        ) : (
          <div className="space-y-3">
            {gear.map((item, i) => (
              <GearItem
                key={i}
                index={i}
                item={item}
                editable={editable}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
        <p className="mb-2"><strong>Suggested format for each item:</strong></p>
        <p className="font-mono bg-slate-900 p-2 rounded">
          Laspistol (Basic, 1.5kg, Common) - Las weapon, 30m range, 1d10+2 E damage, Pen 0, Clip 30, Reload Full
        </p>
      </div>
    </div>
  );
}

function GearItem({
  index,
  item,
  editable,
  onUpdate,
  onRemove,
}: {
  index: number;
  item: string;
  editable: boolean;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const handleChange = useCallback((v: string) => {
    onUpdate(index, v);
  }, [index, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <div className={sectionContainerClass(editable) + " space-y-2"}>
      <div className="flex items-start justify-between gap-2">
        <FormField
          label={`Item ${index + 1}`}
          value={item}
          onChange={handleChange}
          editable={editable}
          type="textarea"
          rows={2}
          placeholder="Item name, weight, craftsmanship, and description..."
          className="flex-1"
        />

        {editable && (
          <button
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-300 mt-5"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}