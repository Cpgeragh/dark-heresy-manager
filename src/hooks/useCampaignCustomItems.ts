// src/hooks/useCampaignCustomItems.ts

import { useMemo } from "react";
import { limit, query, where, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { customItemsCollectionRef } from "../services/customItemService";
import type { CampaignCustomItem, CustomItemCategory } from "../types/CustomItems";
import { useQuerySubscription } from "./useFirestoreSubscription";
import { CUSTOM_ITEM_STATUS_ORDER } from "../constants/customItems";

export type CustomItemsSubscriptionMode = "admin" | "picker";

export interface UseCampaignCustomItemsArgs {
  campaignId?: string | null;
  category?: CustomItemCategory;
  categories?: readonly CustomItemCategory[];
  mode: CustomItemsSubscriptionMode;
  userId?: string | null;
  characterId?: string | null;
  includeArchived?: boolean;
}

export interface UseCampaignCustomItemsResult {
  items: CampaignCustomItem[];
  loading: boolean;
  error: Error | null;
}

export function useCampaignCustomItems({
  campaignId,
  category,
  categories,
  mode,
  userId,
  includeArchived = mode === "admin",
}: UseCampaignCustomItemsArgs): UseCampaignCustomItemsResult {
  const baseRef = campaignId ? customItemsCollectionRef(campaignId) : null;
  const selectedCategories = useMemo(
    () => [...new Set(categories?.length ? categories : category ? [category] : [])].sort(),
    [categories, category]
  );
  const categoryKey = selectedCategories.join("+") || "all";
  const categoryConstraint =
    selectedCategories.length === 0
      ? null
      : selectedCategories.length === 1
        ? where("category", "==", selectedCategories[0])
        : where("category", "in", selectedCategories);
  const adminActive = mode === "admin" && baseRef !== null;
  const pickerActive = mode === "picker" && baseRef !== null;

  const adminSubscription = useQuerySubscription(
    adminActive
      ? query(
          baseRef,
          ...(categoryConstraint ? [categoryConstraint] : []),
          limit(FIRESTORE_QUERY_LIMITS.customItemsPerQuery)
        )
      : null,
    adminActive ? `custom-items:admin:${campaignId}:${categoryKey}` : null,
    mapCustomItemSnapshot
  );

  const publishedSubscription = useQuerySubscription(
    pickerActive
      ? query(
          baseRef,
          where("status", "==", "published"),
          ...(categoryConstraint ? [categoryConstraint] : []),
          limit(FIRESTORE_QUERY_LIMITS.customItemsPerQuery)
        )
      : null,
    pickerActive ? `custom-items:published:${campaignId}:${categoryKey}` : null,
    mapCustomItemSnapshot
  );

  const creatorSubscription = useQuerySubscription(
    pickerActive && userId
      ? query(
          baseRef,
          where("creator.userId", "==", userId),
          ...(categoryConstraint ? [categoryConstraint] : []),
          limit(FIRESTORE_QUERY_LIMITS.customItemsPerQuery)
        )
      : null,
    pickerActive && userId ? `custom-items:creator:${campaignId}:${userId}:${categoryKey}` : null,
    mapCustomItemSnapshot
  );

  const loading =
    mode === "admin"
      ? adminSubscription.loading
      : publishedSubscription.loading || creatorSubscription.loading;
  const error =
    mode === "admin"
      ? adminSubscription.error
      : (publishedSubscription.error ?? creatorSubscription.error);

  const items = useMemo(() => {
    if (error) return [];

    const sourceItems =
      mode === "admin"
        ? adminSubscription.data
        : mergeCustomItems(publishedSubscription.data, creatorSubscription.data);

    return sortCustomItems(
      sourceItems.filter(
        (item) => selectedCategories.length === 0 || selectedCategories.includes(item.category)
      )
    );
  }, [
    adminSubscription.data,
    creatorSubscription.data,
    error,
    mode,
    publishedSubscription.data,
    selectedCategories,
  ]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        isVisibleCustomItem({
          item,
          mode,
          userId,
          includeArchived,
        })
      ),
    [items, mode, userId, includeArchived]
  );

  return { items: visibleItems, loading, error };
}

function mapCustomItemSnapshot(snapshot: QuerySnapshot<DocumentData>): CampaignCustomItem[] {
  return snapshot.docs.map((itemDocument) => ({
    id: itemDocument.id,
    ...itemDocument.data(),
  })) as CampaignCustomItem[];
}

function mergeCustomItems(...itemGroups: CampaignCustomItem[][]): CampaignCustomItem[] {
  const mergedItems = new Map<string, CampaignCustomItem>();

  for (const items of itemGroups) {
    for (const item of items) mergedItems.set(item.id, item);
  }

  return [...mergedItems.values()];
}

function isVisibleCustomItem({
  item,
  mode,
  userId,
  includeArchived,
}: {
  item: CampaignCustomItem;
  mode: CustomItemsSubscriptionMode;
  userId?: string | null;
  includeArchived: boolean;
}) {
  if (!includeArchived && item.status === "archived") return false;
  if (mode === "admin") return true;
  if (item.status === "published") return true;
  if (item.status !== "draft") return false;

  return !!userId && item.creator.userId === userId;
}

function sortCustomItems(items: CampaignCustomItem[]) {
  return [...items].sort((a, b) => {
    const statusDiff =
      CUSTOM_ITEM_STATUS_ORDER.indexOf(a.status) - CUSTOM_ITEM_STATUS_ORDER.indexOf(b.status);
    if (statusDiff !== 0) return statusDiff;
    return a.name.localeCompare(b.name);
  });
}
