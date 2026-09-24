// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const subscription = vi.hoisted(() => vi.fn(() => ({ data: [], loading: false, error: null })));
vi.mock("../../src/hooks/useFirestoreSubscription", () => ({ useQuerySubscription: subscription }));
vi.mock("../../src/services/customItemService", () => ({ customItemsCollectionRef: () => ({}) }));
vi.mock("firebase/firestore", () => ({
  query: (...args: unknown[]) => args,
  where: (...args: unknown[]) => args,
  limit: (value: number) => value,
}));

import {
  CampaignCustomItemsScope,
  useCampaignCustomItems,
} from "../../src/hooks/useCampaignCustomItems";

function Consumer() {
  const { items } = useCampaignCustomItems({
    campaignId: "campaign-1",
    category: "armour",
    mode: "picker",
    userId: "player-1",
    enabled: true,
  });
  return (
    <div>
      {items.map((item) => (
        <span key={item.id}>{item.name}</span>
      ))}
    </div>
  );
}

it("reuses the campaign library without starting a picker query", () => {
  subscription.mockClear();
  const items = [
    {
      id: "published",
      name: "Published",
      category: "armour",
      status: "published",
      creator: { userId: "dm-1" },
    },
    {
      id: "own",
      name: "Own draft",
      category: "armour",
      status: "draft",
      creator: { userId: "player-1" },
    },
    {
      id: "other",
      name: "Other draft",
      category: "armour",
      status: "draft",
      creator: { userId: "other" },
    },
    {
      id: "weapon",
      name: "Weapon",
      category: "weapon",
      status: "published",
      creator: { userId: "dm-1" },
    },
  ] as CampaignCustomItem[];
  render(
    <CampaignCustomItemsScope
      campaignId="campaign-1"
      userId="player-1"
      mode="admin"
      result={{ items, loading: false, error: null }}
    >
      <Consumer />
    </CampaignCustomItemsScope>
  );
  expect(screen.getByText("Published")).toBeInTheDocument();
  expect(screen.getByText("Own draft")).toBeInTheDocument();
  expect(screen.queryByText("Other draft")).not.toBeInTheDocument();
  expect(screen.queryByText("Weapon")).not.toBeInTheDocument();
  expect(subscription).toHaveBeenCalledTimes(3);
  expect(subscription.mock.calls.every((call) => call[0] === null)).toBe(true);
});
