// src/hooks/useCampaignCustomItems.ts

import { useMemo } from "react";
import { query, where, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { customItemsCollectionRef } from "../services/customItemService";
import type { CampaignCustomItem, CustomItemCategory } from "../types/CustomItems";
import { useQuerySubscription } from "./useFirestoreSubscription";
import { CUSTOM_ITEM_STATUS_ORDER } from "../constants/customItems";

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
  error: Error | null;
}

export function useCampaignCustomItems({
  campaignId,
  category,
  mode,
  userId,
  includeArchived = mode === "admin",
}: UseCampaignCustomItemsArgs): UseCampaignCustomItemsResult {
  const baseRef = campaignId ? customItemsCollectionRef(campaignId) : null;
  const adminActive = mode === "admin" && baseRef !== null;
  const pickerActive = mode === "picker" && baseRef !== null;

  const adminSubscription = useQuerySubscription(
    adminActive ? (category ? query(baseRef, where("category", "==", category)) : baseRef) : null,
    adminActive ? `custom-items:admin:${campaignId}:${category ?? "all"}` : null,
    mapCustomItemSnapshot
  );

  const publishedSubscription = useQuerySubscription(
    pickerActive ? query(baseRef, where("status", "==", "published")) : null,
    pickerActive ? `custom-items:published:${campaignId}` : null,
    mapCustomItemSnapshot
  );

  const creatorSubscription = useQuerySubscription(
    pickerActive && userId ? query(baseRef, where("creator.userId", "==", userId)) : null,
    pickerActive && userId ? `custom-items:creator:${campaignId}:${userId}` : null,
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

    return sortCustomItems(sourceItems.filter((item) => !category || item.category === category));
  }, [
    adminSubscription.data,
    category,
    creatorSubscription.data,
    error,
    mode,
    publishedSubscription.data,
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
