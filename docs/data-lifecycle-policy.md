# Data Lifecycle Policy

## Account deletion

Account deletion is available only from a primary device. A linked secondary device must be unlinked instead. A user who owns campaigns must transfer or delete every owned campaign before deleting the account.

An approved deletion releases every character claimed by the account, removes the account from affected campaign memberships, revokes its identity-recovery code, removes direct and inbound device links, deletes the user and public-profile documents, and then deletes the anonymous Firebase Authentication user. Firestore cleanup is bounded and atomic; an operation that would exceed the safe transaction ceiling is refused before any account data changes.

Historical claim entries remain with their character until that character or campaign is deleted. New protected-operation audit entries retain only a stable SHA-256 actor identifier, not the raw Firebase UID; audit documents written before that change may still contain a raw UID. Neither claim history nor new audit records contain a Recovery Code or the user's profile name. Aggregate usage metrics contain no UID.

## Campaign ownership

Account deletion never silently deletes or abandons an owned campaign. The owner must explicitly transfer or delete it first. Campaign deletion removes its characters, claim logs, XP proposals, character summaries, private sessions, member-safe session summaries, threads and messages, custom items and their versions, Recovery Index entries, and finally the campaign document.

## Sessions

Full session documents, including private DM notes, are readable only by the campaign DM or a device linked to that DM. Campaign members read a separate session-summary document containing the date, shared recap, XP, attendees, creation time, and applied-XP state; it never contains DM notes. Session creation, shared-field editing, XP application, and deletion update the private record and its safe summary atomically. The protected DM-only repair operation rebuilds historical summaries from an entirely validated source page and stops before any write if the campaign exceeds 200 sessions or any source record is invalid.

## Character ownership and deletion

Releasing a claimed character clears its owner and editing permission. The user is removed from campaign membership when they own no remaining character there. Character deletion removes its claim log, XP proposals, message thread, Recovery Index entry, character summary, and character document.

## Messages

Messages are retained until a DM clears the thread or the related character or campaign is deleted. There is no automatic numeric-retention promise. Clearing occurs in bounded pages and resets the thread summary after all message documents are removed.

## Claim logs

Claim logs are ownership-history records. They are retained until their character or campaign is deleted. The 50-entry setting used by the interface is a page size, not a retention limit.

## Custom-item versions

Versions are retained until their custom item or campaign is deleted. There is no automatic numeric-retention promise.

## Recovery data

A character Recovery Code can be revoked independently. Claiming consumes the submitted code and rotates the character to a new code. An account-level identity-recovery code can be rotated or explicitly revoked. Account deletion also revokes it and removes linked-device access.

## Backups and exports

Manual staging exports remain in their selected Cloud Storage destination until deliberately deleted or covered by a separately configured bucket lifecycle rule. Primary deletion does not retroactively alter an existing export. There is no scheduled export or automatic retention policy.
