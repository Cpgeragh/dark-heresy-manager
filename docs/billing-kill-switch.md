# Billing Kill Switch

## Purpose

A dedicated, isolated mechanism that disables billing entirely on both `dark-heresy-manager` and `dark-heresy-manager-staging` when total spend on the shared billing account reaches its configured cap. This is a hard backstop, distinct from the alerts-only budget notification, which only sends email and does not stop any usage.

## Threshold

Fires when actual spend reaches the same €10 monthly amount already configured on the "Dark Heresy Manager Billing Alert" budget, on the shared billing account (`018888-6B5370-BF916B`) both monitored projects use.

## Architecture

A dedicated GCP project, `dark-heresy-billing-guard`, holds one Pub/Sub-triggered Cloud Function and nothing else. The existing budget publishes a notification to a Pub/Sub topic in this project on every threshold evaluation, in addition to its existing email alerts. The function reads each notification, and when the reported cost has reached the budget amount, calls the Cloud Billing API to detach billing from both monitored projects by name.

The function never modifies billing on its own host project. Its service account holds the Project Billing Manager role (`roles/billing.projectManager`), granted individually on each of the two monitored projects, not the broader Billing Account Administrator role.

## Effect when triggered

Both `dark-heresy-manager` and `dark-heresy-manager-staging` lose their billing account link. Every service requiring billing stops accepting new usage. In-flight requests at the moment of disablement complete normally. No data is deleted by this action.

## Dry-run testing

Setting the `BILLING_GUARD_DRY_RUN` environment variable to `true` on the deployed function causes it to log the action it would take without calling the Cloud Billing API. Publishing a synthetic message to the Pub/Sub topic in this mode confirms the function receives, parses, and evaluates a notification correctly, without any risk to either monitored project. Dry-run mode does not exercise the actual Cloud Billing API call.

## Live-fire drill

A dry run does not prove the Cloud Billing API call itself succeeds with the granted permissions. Confirming that requires an actual disable-and-relink cycle, run deliberately and separately from ordinary testing:

1. Confirm current spend on the billing account is near zero, so a live drill does not coincide with genuine usage being cut off unexpectedly hard.
2. Publish a synthetic message to the Pub/Sub topic with `BILLING_GUARD_DRY_RUN` unset or `false`.
3. Confirm both projects show no billing account linked (Console: each project's Billing page; or `gcloud billing projects describe <PROJECT_ID>`).
4. Relink billing to both projects (see Recovery, below).
5. Confirm both projects show the billing account relinked and services resume.

## Recovery

Relinking billing restores both projects. No other recovery step exists or is needed; this action does not disable APIs, delete resources, or alter Firestore data.

Console: for each project, open the project's Billing page and link the billing account (`018888-6B5370-BF916B`).

Precise navigation: Firebase Console → open the project → Settings in the menu → Usage and billing → Details & settings tab → Modify plan → Blaze → select the existing billing account.

Command line, per project:

    gcloud billing projects link <PROJECT_ID> --billing-account=018888-6B5370-BF916B

The exact time services take to resume accepting requests after relinking has not been measured for this project pair and should be confirmed during the live-fire drill above, not assumed.

## Removal

This mechanism is separate from the underlying app and the shared budget's email alerts. Removing it means deleting the Pub/Sub topic's connection to the budget and, if no longer wanted at all, deleting the `dark-heresy-billing-guard` project. Both monitored projects and the existing email alerts are unaffected by its removal.
