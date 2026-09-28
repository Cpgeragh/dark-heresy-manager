# Backup and restore policy

Repository paths in this document refer to the checked-out commit.

## Protected data and ownership

| Asset                                     | Protection mechanism                                   | Operational owner      |
| ----------------------------------------- | ------------------------------------------------------ | ---------------------- |
| Production Firestore database             | Native Firestore scheduled backups                     | Project operator       |
| Staging Firestore database                | No repository-defined backup                           | Project operator       |
| Source, rules, indexes, and configuration | Git history                                            | Repository maintainers |
| Firebase Authentication identities        | Not covered by Firestore backup                        | Project operator       |
| Function secrets                          | Google Secret Manager                                  | Project operator       |
| Manual exports                            | Selected Cloud Storage bucket and its lifecycle policy | Export operator        |

The Firestore backup includes all documents in the selected database. It does not include Firebase Authentication users or Secret Manager values.

The protected Functions depend on `RECOVERY_CODE_HMAC_SECRET` and `IDENTITY_CODE_HMAC_SECRET`, declared in `functions/src/shared/secrets.ts`. Losing either secret can make existing hashed recovery-index entries unusable. Secret access, versioning, and recovery must be managed in Secret Manager independently of Firestore backups.

## Current operational status

| Environment | Schedule        | Retention         | Last live verification |
| ----------- | --------------- | ----------------- | ---------------------- |
| Production  | Intended: daily | Intended: 30 days | Pending verification   |
| Staging     | None defined    | None defined      | Pending verification   |

The repository cannot prove the live scheduled-backup configuration. Before a release that depends on disaster recovery, verify the database's disaster-recovery settings in the Google Cloud console and record the result in the release evidence.

## Restore procedure

A Firestore backup restores into a new database; it does not overwrite the source database in place.

1. Select a backup whose completion time predates the incident.
2. Restore it into a new database with a unique destination ID.
3. Validate document counts, representative reads, rules, indexes, and protected-operation prerequisites against the restored database.
4. Choose a cutover or data-copy plan appropriate to the incident. Do not point production clients at the restored database until validation is complete.
5. Retain the original database until recovery has been accepted and rollback is no longer required.

Use the current Google Cloud CLI form:

```bash
gcloud firestore databases restore \
  --source-backup=BACKUP_NAME \
  --destination-database=DESTINATION_DATABASE_ID
```

The operator must confirm the current CLI flags and required permissions before a live restore. A restore is not considered proven until a non-production drill has completed successfully.

## Recovery gaps

- Account deletion does not remove data already captured in a backup or manual export.
- A Firestore restore does not recreate missing Authentication users or Secret Manager values.
- Point-in-time recovery is independent of scheduled backups and has no repository-defined enabled state; treat it as unavailable until the live project configuration is verified.
- Any Cloud Storage export follows the destination bucket's lifecycle policy, not this Firestore retention policy.
