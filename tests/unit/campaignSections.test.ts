import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAMPAIGN_SECTION,
  getCampaignNavigation,
  getCampaignSectionLabel,
  isCampaignSectionAllowed,
} from "../../src/pages/CampaignOverview/sections";

describe("campaign sections", () => {
  it("opens on Party by default", () => {
    expect(DEFAULT_CAMPAIGN_SECTION).toBe("party");
  });

  it("lists Party, Custom Item Library and Session History for the DM, in that order", () => {
    expect(getCampaignNavigation(true)).toEqual({
      pages: [
        { id: "party", label: "Party" },
        { id: "custom-items", label: "Custom Item Library" },
        { id: "sessions", label: "Session History" },
      ],
    });
  });

  it("lists only Party and Session History for a player", () => {
    expect(getCampaignNavigation(false)).toEqual({
      pages: [
        { id: "party", label: "Party" },
        { id: "sessions", label: "Session History" },
      ],
    });
  });

  it("names each section for the toolbar title", () => {
    expect(getCampaignSectionLabel("party")).toBe("Party");
    expect(getCampaignSectionLabel("custom-items")).toBe("Custom Item Library");
    expect(getCampaignSectionLabel("sessions")).toBe("Session History");
  });

  it("allows the Custom Item Library only for the DM", () => {
    expect(isCampaignSectionAllowed("custom-items", true)).toBe(true);
    expect(isCampaignSectionAllowed("custom-items", false)).toBe(false);
  });

  it("rejects a missing or unknown section for either role", () => {
    for (const isDM of [true, false]) {
      expect(isCampaignSectionAllowed(null, isDM)).toBe(false);
      expect(isCampaignSectionAllowed("nonsense", isDM)).toBe(false);
    }
  });
});
