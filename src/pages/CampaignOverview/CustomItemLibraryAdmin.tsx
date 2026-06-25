// src/pages/CampaignOverview/CustomItemLibraryAdmin.tsx

import { useState } from "react";
import type { CustomItemCategory, CustomItemStatus } from "../../types/CustomItems";
import { useCampaignCustomItems } from "../../hooks/useCampaignCustomItems";
import { CustomItemAdminRow } from "./CustomItemAdminRow";
import { Chip } from "../../ui/Chip";

const CATEGORIES: CustomItemCategory[] = [
  "gear",
  "consumable",
  "drug",
  "cybernetic",
  "weapon",
  "armour",
  "archeotech",
];

const CATEGORY_LABELS: Record<CustomItemCategory, string> = {
  gear: "Gear",
  consumable: "Consumable",
  drug: "Drug",
  cybernetic: "Cybernetic",
  weapon: "Weapon",
  armour: "Armour",
  archeotech: "Archeotech",
};

const STATUSES: CustomItemStatus[] = ["draft", "published", "archived"];

export function CustomItemLibraryAdmin({
  campaignId,
  userId,
}: {
  campaignId: string;
  userId: string;
}) {
  const { items, loading } = useCampaignCustomItems({
    campaignId,
    mode: "admin",
    includeArchived: true,
    userId,
  });
  const [filterCategory, setFilterCategory] = useState<CustomItemCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<CustomItemStatus | "all">("all");

  if (loading) return null;

  const filtered = items
    .filter((i) => filterCategory === "all" || i.category === filterCategory)
    .filter((i) => filterStatus === "all" || i.status === filterStatus);

  const activeChip = "border-red-500/50 bg-red-500/10 text-red-300";
  const inactiveChip = "border-slate-600 bg-slate-800/60 text-slate-400 hover:text-slate-200";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Chip
          as="button"
          onClick={() => setFilterCategory("all")}
          className={filterCategory === "all" ? activeChip : inactiveChip}
        >
          All categories
        </Chip>
        {CATEGORIES.map((cat) => (
          <Chip
            as="button"
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={filterCategory === cat ? activeChip : inactiveChip}
          >
            {CATEGORY_LABELS[cat]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip
          as="button"
          onClick={() => setFilterStatus("all")}
          className={filterStatus === "all" ? activeChip : inactiveChip}
        >
          All statuses
        </Chip>
        {STATUSES.map((s) => (
          <Chip
            as="button"
            key={s}
            onClick={() => setFilterStatus(s)}
            className={filterStatus === s ? activeChip : inactiveChip}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Chip>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm">No custom items match the current filter.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <CustomItemAdminRow
              key={item.id}
              item={item}
              campaignId={campaignId}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
