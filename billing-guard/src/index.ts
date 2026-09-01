// billing-guard/src/index.ts
//
// Pub/Sub-triggered Cloud Function. Disables billing on both monitored
// projects when the shared billing account's budget notification
// reports spend has reached the budget amount. Never touches its own
// host project's billing.

import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { logger } from "firebase-functions/v2";
import { GoogleAuth } from "google-auth-library";

export const MONITORED_PROJECT_IDS = ["dark-heresy-manager", "dark-heresy-manager-staging"] as const;

export interface BudgetNotification {
  budgetDisplayName?: string;
  costAmount: number;
  budgetAmount: number;
  currencyCode?: string;
}

export function parseBudgetNotification(base64Data: string): BudgetNotification {
  const decoded = Buffer.from(base64Data, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as Partial<BudgetNotification>;
  if (typeof parsed.costAmount !== "number" || typeof parsed.budgetAmount !== "number") {
    throw new Error(`Budget notification missing costAmount/budgetAmount: ${decoded}`);
  }
  return parsed as BudgetNotification;
}

export function hasReachedCap(notification: BudgetNotification): boolean {
  return notification.costAmount >= notification.budgetAmount;
}

async function getBillingAccessToken(): Promise<string> {
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-billing"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to obtain an access token for the Cloud Billing API.");
  }
  return token.token;
}

export async function disableBillingForProject(projectId: string, accessToken: string): Promise<void> {
  const response = await fetch(`https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ billingAccountName: "" }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to disable billing for ${projectId}: ${response.status} ${body}`);
  }
}

export const billingGuard = onMessagePublished("budget-alerts", async (event) => {
  const notification = parseBudgetNotification(event.data.message.data);
  logger.info("Received budget notification", { notification });

  if (!hasReachedCap(notification)) {
    logger.info("Spend below budget cap, no action taken.", {
      costAmount: notification.costAmount,
      budgetAmount: notification.budgetAmount,
    });
    return;
  }

  const dryRun = process.env.BILLING_GUARD_DRY_RUN === "true";
  logger.warn(
    dryRun
      ? `Budget cap reached (${notification.costAmount} >= ${notification.budgetAmount}). Dry run: billing not disabled.`
      : `Budget cap reached (${notification.costAmount} >= ${notification.budgetAmount}). Disabling billing for monitored projects.`,
    { monitoredProjectIds: MONITORED_PROJECT_IDS }
  );

  if (dryRun) {
    return;
  }

  const accessToken = await getBillingAccessToken();
  await Promise.all(
    MONITORED_PROJECT_IDS.map((projectId) => disableBillingForProject(projectId, accessToken))
  );
  logger.warn("Billing disabled for monitored projects.", { monitoredProjectIds: MONITORED_PROJECT_IDS });
});
