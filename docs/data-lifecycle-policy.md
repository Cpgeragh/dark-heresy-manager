# Data lifecycle policy

Repository paths in this document refer to the checked-out commit.

## Account deletion

An account that owns campaigns cannot be deleted. The user must transfer or delete every owned campaign first.

The protected account-deletion operation performs a bounded Firestore transaction that:

- releases characters owned by the account;
- removes the account from affected campaign memberships;
- deletes the identity recovery index and plaintext identity secret;
- deletes every `userLinks` document whose `primaryUid` points to the account;
- deletes the account record and public profile; and
- resets linked-device onboarding documents where applicable.

The operation rejects the request before writing if cleanup would exceed the 440-write transaction ceiling. It does not delete the primary `users/{accountId}` document as part of that transaction.

After Firestore cleanup, the function asks Firebase Authentication to delete the collected linked-device UIDs. Authentication identity coverage when linked-device records exist is `Pending verification`; do not promise deletion of every historical Authentication UID until an integration test proves the exact set.

Claim history remains with each character. Protected-operation audit records use a stable SHA-256 actor identifier for new entries; older records may contain the earlier identifier format. Backups and exports are unaffected by online account deletion.

## Campaign and character deletion

Campaign and character deletion use protected resumable jobs. The protected preflight authorizes the caller, counts affected documents, and stores a job without deleting descendants. The client displays that count; user confirmation starts bounded chunk processing. The server reauthorizes processing but does not compare a new count at confirmation time. Parent documents are deleted last.

| Deletion target | Descendant data removed before the parent                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Character       | Claim logs, legacy XP proposals, messages, thread summary, recovery index, and character summary                                                                    |
| Campaign        | Characters and their descendants, sessions and summaries, threads and messages, custom items and versions, and recovery indexes                                         |

Preflight fails with `failed-precondition` when a target character lacks a valid Recovery Code because its Recovery Index entry cannot be located safely. It fails with `resource-exhausted` above 100,000 affected documents. If processing stops, the job can resume. The UI must not claim completion until the backend reports the terminal completed state.

## Ownership and membership

Releasing a character clears its owner and player-edit permission. When the account owns no remaining character in that campaign, the ownership operation may remove the account from campaign membership according to the protected transition contract.

Account deletion never silently deletes an owned campaign or leaves it without a DM.

## Sessions

Full session documents may contain private DM notes. Member-safe summaries deliberately exclude those notes. Protected session operations keep the full record and summary consistent and apply XP under the same validated operation.

The DM-only summary repair operation validates its entire source page before writing. It refuses a campaign beyond its supported 200-session page and refuses invalid source data without partial repair.

## Messages and claim history

Messages remain until the DM clears a thread or its character or campaign is deleted. Clearing runs in bounded pages and resets the thread summary after message removal. No automatic age-based or count-based retention is promised.

Claim logs remain until their character or campaign is deleted. The 50-entry client value is a read-page limit, not a retention limit.

## Custom-item versions

Versions remain until their custom item or campaign is deleted. Firestore rules restrict each `versionNumber` and the parent item's `latestVersionNumber` to the range 1 through 50, which blocks version 51 in the normal incrementing client workflow. They do not count distinct version documents, require version numbers to be unique or sequential, or enforce a 50-document collection limit. No automatic retention process removes older versions.

## Recovery data

Character and identity recovery indexes are server-owned. A successful character claim consumes the submitted code and rotates recovery material. Identity recovery can be rotated or revoked. Account deletion removes its current identity recovery records and linked-device access.

## Backups and exports

Online deletion does not rewrite existing backups or exports. Firestore scheduled backups follow the retention configured on the live database. Manual exports follow the lifecycle policy of their destination Cloud Storage bucket. See `docs/backup-policy.md` for recovery coverage and current verification gaps.
