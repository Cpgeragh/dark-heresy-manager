// src/hooks/useCampaignCustomItems.ts

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where, type Query } from "firebase/firestore";
import { customItemsCollectionRef } from "../services/customItemService";
import type {
  CampaignCustomItem,
  CustomItemCategory,
  CustomItemStatus,
} from "../types/CustomItems";

export type CustomItemsSubscriptionMode = "admin" | "picker";

export interface UseCampaignCustomItemsArgs {
  campaignId?: string | null;
  category?: CustomItemCategory;
  mode: CustomItemsSubscriptionMode;
  userId?: string | null;
  characterId?: string | null;
  includeArchived?: boolean;
}

export interface UseCampaignCustomItemsResult {
  items: CampaignCustomItem[];
  loading: boolean;
  error: string | null;
}

export function useCampaignCustomItems({
  campaignId,
  category,
  mode,
  userId,
  characterId,
  includeArchived = mode === "admin",
}: UseCampaignCustomItemsArgs): UseCampaignCustomItemsResult {
  const [items, setItems] = useState<CampaignCustomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const baseRef = customItemsCollectionRef(campaignId);
    const queries: Query[] =
      mode === "admin"
        ? [category ? query(baseRef, where("category", "==", category)) : baseRef]
        : [
            query(baseRef, where("status", "==", "published")),
            ...(userId ? [query(baseRef, where("creator.userId", "==", userId))] : []),
            ...(characterId
              ? [query(baseRef, where("creator.characterId", "==", characterId))]
              : []),
          ];

    const snapshotsByQuery = new Map<number, CampaignCustomItem[]>();
    const unsubscribes = queries.map((itemsQuery, index) =>
      onSnapshot(
        itemsQuery,
        (snapshot) => {
          snapshotsByQuery.set(
            index,
            snapshot.docs.map((itemDoc) => ({
              id: itemDoc.id,
              ...itemDoc.data(),
            })) as CampaignCustomItem[]
          );

          const merged = new Map<string, CampaignCustomItem>();
          for (const queryItems of snapshotsByQuery.values()) {
            for (const item of queryItems) {
              if (!category || item.category === category) {
                merged.set(item.id, item);
              }
            }
          }

          setItems(sortCustomItems([...merged.values()]));
          setLoading(false);
        },
        (err) => {
          console.error("useCampaignCustomItems error:", err);
          setItems([]);
          setError("Failed to load campaign custom items.");
          setLoading(false);
        }
      )
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [campaignId, category, mode, userId, characterId]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        isVisibleCustomItem({
          item,
          mode,
          userId,
          characterId,
          includeArchived,
        })
      ),
    [items, mode, userId, characterId, includeArchived]
  );

  return { items: visibleItems, loading, error };
}

function isVisibleCustomItem({
  item,
  mode,
  userId,
  characterId,
  includeArchived,
}: {
  item: CampaignCustomItem;
  mode: CustomItemsSubscriptionMode;
  userId?: string | null;
  characterId?: string | null;
  includeArchived: boolean;
}) {
  if (!includeArchived && item.status === "archived") return false;
  if (mode === "admin") return true;
  if (item.status === "published") return true;
  if (item.status !== "draft") return false;

  const creator = item.creator;
  return (
    (!!userId && creator.userId === userId) ||
    (!!characterId && creator.characterId === characterId)
  );
}

function sortCustomItems(items: CampaignCustomItem[]) {
  const statusRank: Record<CustomItemStatus, number> = {
    draft: 0,
    published: 1,
    archived: 2,
  };

  return [...items].sort((a, b) => {
    const statusDiff = statusRank[a.status] - statusRank[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.name.localeCompare(b.name);
  });
}
