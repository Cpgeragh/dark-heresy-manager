import { describe, expect, it, vi } from "vitest";
import {
  parseBudgetNotification,
  hasReachedCap,
  disableBillingForProject,
  MONITORED_PROJECT_IDS,
} from "../src/index.js";

describe("parseBudgetNotification", () => {
  it("decodes a base64 budget notification payload", () => {
    const payload = { costAmount: 5, budgetAmount: 10, currencyCode: "EUR" };
    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    expect(parseBudgetNotification(base64)).toEqual(payload);
  });

  it("throws when costAmount is missing", () => {
    const base64 = Buffer.from(JSON.stringify({ budgetAmount: 10 })).toString("base64");
    expect(() => parseBudgetNotification(base64)).toThrow();
  });

  it("throws when budgetAmount is missing", () => {
    const base64 = Buffer.from(JSON.stringify({ costAmount: 5 })).toString("base64");
    expect(() => parseBudgetNotification(base64)).toThrow();
  });
});

describe("hasReachedCap", () => {
  it("returns false when cost is below the budget amount", () => {
    expect(hasReachedCap({ costAmount: 5, budgetAmount: 10 })).toBe(false);
  });

  it("returns true when cost equals the budget amount", () => {
    expect(hasReachedCap({ costAmount: 10, budgetAmount: 10 })).toBe(true);
  });

  it("returns true when cost exceeds the budget amount", () => {
    expect(hasReachedCap({ costAmount: 15, budgetAmount: 10 })).toBe(true);
  });
});

describe("MONITORED_PROJECT_IDS", () => {
  it("names exactly the two real Firebase projects, and only those", () => {
    expect(MONITORED_PROJECT_IDS).toEqual(["dark-heresy-manager", "dark-heresy-manager-staging"]);
  });
});

describe("disableBillingForProject", () => {
  it("calls the Cloud Billing API with the correct method, URL, and body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await disableBillingForProject("dark-heresy-manager", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://cloudbilling.googleapis.com/v1/projects/dark-heresy-manager/billingInfo",
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billingAccountName: "" }),
      }
    );

    vi.unstubAllGlobals();
  });

  it("throws with the response body when the API call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("permission denied"),
      })
    );

    await expect(disableBillingForProject("dark-heresy-manager", "test-token")).rejects.toThrow(
      "Failed to disable billing for dark-heresy-manager: 403 permission denied"
    );

    vi.unstubAllGlobals();
  });
});
