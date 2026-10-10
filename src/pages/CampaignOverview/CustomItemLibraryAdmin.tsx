// src/pages/CampaignOverview/CustomItemLibraryAdmin.tsx

import { useState } from "react";
import type { CustomItemCategory, CustomItemStatus } from "../../types/CustomItems";
import { useCampaignCustomItems } from "../../hooks/useCampaignCustomItems";
import { CustomItemAdminRow } from "./CustomItemAdminRow";
import { Chip } from "../../ui/chips/Chip";
import { ErrorState } from "../../ui/ErrorState";
import { useRouteLoading } from "../../context/useRouteReady";
import {
  CUSTOM_ITEM_CATEGORY_LABELS,
  CUSTOM_ITEM_CATEGORY_ORDER,
  CUSTOM_ITEM_STATUS_ORDER,
} from "../../constants/customItems";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { uiTextPlaceholder } from "../../ui/styles/editableStyles";

export function CustomItemLibraryAdmin({
  campaignId,
  userId,
}: {
  campaignId: string;
  userId: string;
}) {
  recordComponentRender("CustomItemLibraryAdmin");
  const { items, loading, error } = useCampaignCustomItems({
    campaignId,
    mode: "admin",
    includeArchived: true,
    userId,
  });
  useRouteLoading(loading);
  const [filterCategory, setFilterCategory] = useState<CustomItemCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<CustomItemStatus | "all">("all");

  if (error) {
    return <ErrorState>Unable to load custom items.</ErrorState>;
  }

  if (loading) return null;

  const filtered = items
    .filter((i) => filterCategory === "all" || i.category === filterCategory)
    .filter((i) => filterStatus === "all" || i.status === filterStatus);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Chip
          as="button"
          onClick={() => setFilterCategory("all")}
          colour={filterCategory === "all" ? "red" : "slate"}
        >
          All categories
        </Chip>
        {CUSTOM_ITEM_CATEGORY_ORDER.map((cat) => (
          <Chip
            as="button"
            key={cat}
            onClick={() => setFilterCategory(cat)}
            colour={filterCategory === cat ? "red" : "slate"}
          >
            {CUSTOM_ITEM_CATEGORY_LABELS[cat]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip
          as="button"
          onClick={() => setFilterStatus("all")}
          colour={filterStatus === "all" ? "red" : "slate"}
        >
          All statuses
        </Chip>
        {CUSTOM_ITEM_STATUS_ORDER.map((s) => (
          <Chip
            as="button"
            key={s}
            onClick={() => setFilterStatus(s)}
            colour={filterStatus === s ? "red" : "slate"}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Chip>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className={`text-sm ${uiTextPlaceholder}`}>No custom items match the current filter.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <CustomItemAdminRow key={item.id} item={item} campaignId={campaignId} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
