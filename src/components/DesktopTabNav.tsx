import type { TabId } from "../pages/characterSheet/types";
import { CATEGORIES } from "./SectionDrawer";

interface Props {
  activeTab: TabId;
  isDM: boolean;
  onCategoryClick: (label: string) => void;
}

export function DesktopTabNav({ activeTab, isDM, onCategoryClick }: Props) {
  const visible = CATEGORIES.filter((c) => !c.dmOnly || isDM);
  const activeCategory = visible.find((c) => c.tabs.some((t) => t.id === activeTab));

  return (
    <div className="hidden sm:block mb-4">
      <div className="flex flex-wrap justify-center gap-1.5" aria-label="Section categories">
        {visible.map((cat) => {
          const isCurrent = cat.label === activeCategory?.label;
          return (
            <button
              key={cat.label}
              onClick={() => onCategoryClick(cat.label)}
              className={`shrink-0 px-3 py-1 rounded text-sm border transition ${
                isCurrent
                  ? "bg-slate-700 text-slate-100 border-slate-500 font-semibold"
                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
