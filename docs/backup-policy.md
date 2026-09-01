# Backup Policy

Status: manual staging export and restore have been verified. Scheduled exports and automatic retention are not active.

## Scope

- **Firestore data** — the actual target. Every active collection, including `campaigns`, characters and their subcollections, threads and messages, custom items and versions, private sessions and member-safe session summaries, `recoveryIndex`, `identityRecoveryIndex`, `identitySecret`, `users`, `userProfiles`, `userLinks`, and operational records.
- **Cloud Functions source and Firestore security rules** — already covered by git, no separate backup mechanism needed.
- **Firebase Authentication** — deliberately out of scope. The app uses only anonymous auth; no data of independent value lives on the Auth record itself, everything meaningful lives in Firestore documents keyed by UID, already covered above.
- **The Recovery Code HMAC secret** (`recoveryCodeHmacSecret`, Secret Manager) — losing it would make every existing Recovery Code's index entry unverifiable, though affected codes could be rotated. It currently has no backup outside Secret Manager.

## Mechanism

Firestore's managed export/import to a dedicated Cloud Storage bucket. A manual staging export and non-production restore have succeeded. No scheduled trigger is currently configured.

## Frequency and retention

Manual exports remain until deliberately deleted or covered by a separately configured bucket lifecycle rule. There is no scheduled export or automatic retention policy.

## Restore

Firestore's import operation reverses export, into the same or a different database. Restoring into a separate database (not the live one) is the safe way to test a restore without risking live data.

## Point-in-time recovery (PITR)

A separate, complementary Firestore feature gives continuous recovery within a rolling window and is distinct from export-based backups. Its live status is not asserted by this repository document and must be verified in the intended Firebase project before relying on it.
