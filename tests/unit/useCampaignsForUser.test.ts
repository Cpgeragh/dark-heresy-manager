// tests/unit/useCampaignsForUser.test.ts
//
// useCampaignsForUser is a thin wrapper around useCampaignsContext().
// The Firestore subscription logic it previously contained was moved into
// CampaignsProvider and is tested in campaignsContext.test.tsx.
//
// This file only verifies that the hook delegates to context correctly.

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { CampaignWithId } from "../../src/types/Firestore";

const mockCampaigns: CampaignWithId[] = [];
const mockContextValue = { campaigns: mockCampaigns, loading: false, error: null };

vi.mock("../../src/context/CampaignsContext", () => ({
  useCampaignsContext: () => mockContextValue,
}));

import { useCampaignsForUser } from "../../src/hooks/useCampaignsForUser";

describe("useCampaignsForUser", () => {
  it("returns the value from useCampaignsContext", () => {
    const { result } = renderHook(() => useCampaignsForUser("any-uid", "dm"));
    expect(result.current).toBe(mockContextValue);
  });

  it("ignores the uid and role arguments (delegated to context provider)", () => {
    const dm = renderHook(() => useCampaignsForUser("uid-1", "dm")).result.current;
    const player = renderHook(() => useCampaignsForUser("uid-2", "player")).result.current;
    // Both return the same context value regardless of arguments
    expect(dm).toBe(mockContextValue);
    expect(player).toBe(mockContextValue);
  });
});
