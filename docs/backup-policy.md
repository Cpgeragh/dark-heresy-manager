# Backup Policy

Status: policy only, not yet active. Firestore's managed export/import requires the Blaze plan, a Cloud Storage bucket, and a billing account — none of which exist yet. This document defines what switches on once Blaze is linked (its own separate, later decision), so the mechanism is designed ahead of time rather than improvised at deployment.

## Scope

- **Firestore data** — the actual target. Every collection: `campaigns`, `characters` and their subcollections (`claimLog`, `xpProposals`), `threads`/`messages`, `customItems` and version history, `sessions`, `recoveryIndex`, `identityRecovery`/`identitySecret`, `users`, `userLinks`, `bulkJobs`.
- **Cloud Functions source and Firestore security rules** — already covered by git, no separate backup mechanism needed.
- **Firebase Authentication** — deliberately out of scope. The app uses only anonymous auth; no data of independent value lives on the Auth record itself, everything meaningful lives in Firestore documents keyed by UID, already covered above.
- **The Recovery Code HMAC secret** (`recoveryCodeHmacSecret`, Secret Manager) — losing it would make every existing Recovery Code's index entry unverifiable, though affected codes could be rotated. Whether this needs its own secure backup (e.g. a copy kept in a password manager, outside Secret Manager) is a decision still open, not resolved by this document.

## Mechanism

Firestore's managed export/import to a dedicated Cloud Storage bucket, triggered on a schedule (Cloud Scheduler + a small Function, or a manual periodic `gcloud firestore export` if scheduling infrastructure isn't worth building yet at this app's scale).

## Frequency and retention

Proposed: daily exports, 30-day rolling retention. Given the app's real usage pattern (sporadic edits, not high-frequency writes) and tiny data volume, storage cost is trivial regardless of the exact numbers chosen, these are a starting point, not fixed.

## Restore

Firestore's import operation reverses export, into the same or a different database. Restoring into a separate database (not the live one) is the safe way to test a restore without risking live data.

## Point-in-time recovery (PITR)

A separate, complementary Firestore feature, also Blaze-only, giving continuous recovery within a rolling 7-day window, distinct from long-term export-based backups. Currently disabled on production (confirmed directly via `firebase firestore:databases:get`). Cheap to enable once on Blaze, worth reconsidering as a complement to scheduled exports at that time.
