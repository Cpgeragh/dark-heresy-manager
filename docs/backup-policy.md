# Backup Policy

Status: production has Firestore's native Scheduled Backups running daily with 30-day retention. Staging has no backup mechanism configured.

## Scope

- **Firestore data** — the actual target. Every active collection, including `campaigns`, characters and their subcollections, threads and messages, custom items and versions, private sessions and member-safe session summaries, `recoveryIndex`, `identityRecoveryIndex`, `identitySecret`, `users`, `userProfiles`, `userLinks`, and operational records.
- **Cloud Functions source and Firestore security rules** — already covered by git, no separate backup mechanism needed.
- **Firebase Authentication** — deliberately out of scope. The app uses only anonymous auth; no data of independent value lives on the Auth record itself, everything meaningful lives in Firestore documents keyed by UID, already covered above.
- **The Recovery Code HMAC secret** (`recoveryCodeHmacSecret`, Secret Manager) — losing it would make every existing Recovery Code's index entry unverifiable, though affected codes could be rotated. It currently has no backup outside Secret Manager.

## Mechanism

Firestore's native Scheduled Backups feature (Console: Firestore → Databases → the database → Edit disaster-recovery settings). Configured directly on the database, no separate Cloud Storage bucket or export job to manage.

## Frequency and retention

Production: daily, 30-day retention. Staging: not configured — no scheduled backup exists for staging data. A backup is automatically deleted once it passes the retention window; storage cost stays flat rather than growing over the app's lifetime.

## Restore

A scheduled backup restores only into a new database (`gcloud alpha firestore databases restore --source-backup=... --destination-database=...`), never back into the source database in place — that isn't a safety choice to opt into, it's the only restore path the mechanism supports. The original database is untouched throughout, so the restored copy can be checked before anything is cut over to it.

## Point-in-time recovery (PITR)

A separate, complementary Firestore feature giving continuous recovery within a rolling window, distinct from scheduled backups. This document does not track its live status — verify directly in the Firebase Console before relying on it.
