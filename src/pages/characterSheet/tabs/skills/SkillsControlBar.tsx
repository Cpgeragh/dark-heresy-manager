// src/pages/characterSheet/tabs/skills/SkillsControlBar.tsx

type SortMode = "category" | "characteristic" | "name" | "total";

interface SkillsControlBarProps {
  search: string;
  setSearch: (s: string) => void;
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  showOnlyTrained: boolean;
  setShowOnlyTrained: (b: boolean) => void;
  compact: boolean;
  setCompact: (b: boolean) => void;
}

export function SkillsControlBar({
  search,
  setSearch,
  sortMode,
  setSortMode,
  showOnlyTrained,
  setShowOnlyTrained,
  compact,
  setCompact,
}: SkillsControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
      <input
        type="text"
        placeholder="Search skills…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
      />

      <select
        value={sortMode}
        onChange={(e) => setSortMode(e.target.value as SortMode)}
        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
      >
        {/* Characteristic moved to the top */}
        <option value="characteristic">Sort: By Characteristic</option>
        <option value="category">Sort: By Category</option>
        <option value="name">Sort: Alphabetical</option>
        <option value="total">Sort: By Total</option>
      </select>

      <label className="inline-flex items-center gap-1 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={showOnlyTrained}
          onChange={(e) => setShowOnlyTrained(e.target.checked)}
          className="mr-1"
        />
        Trained only
      </label>

      <button
        onClick={() => setCompact(!compact)}
        className="px-3 py-1 border border-slate-600 rounded bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
      >
        {compact ? "Detailed mode" : "Compact mode"}
      </button>
    </div>
  );
}