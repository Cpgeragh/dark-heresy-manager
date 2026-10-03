# Firestore security boundary

Repository paths in this document refer to the checked-out commit.

`firestore.rules` is authoritative for client access. Trusted Cloud Functions use the Admin SDK and enforce their own authorisation and validation.

## Identity and default policy

All unlisted paths are denied. Every permitted client operation requires Firebase Authentication.

The `playerOwnsOrLinked` and `dmOwnsOrLinked` helpers resolve a device through `userLinks` to its permanent account. A linked device therefore receives the same account-level ownership checks as the primary identity where those helpers are used.

## Top-level collections

| Path                           | Client read access                                                                                         | Client write access                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `users/{uid}`                  | Exact authenticated UID                                                                                    | Exact UID may create or update under the recognized field and type contract; deletion is denied |
| `userProfiles/{accountId}`     | Authenticated single-document reads; collection listing denied                                             | Denied; display-name changes use the protected backend                                          |
| `accounts/{accountId}`         | Denied                                                                                                     | Denied                                                                                          |
| `userLinks/{uid}`              | A device may get its own link; an account may list its bounded device set with the required account filter | Denied; linking and disconnecting use protected backend operations                              |
| `recoveryIndex/{hash}`         | Denied                                                                                                     | Denied                                                                                          |
| `identityRecoveryIndex/{hash}` | Denied                                                                                                     | Denied                                                                                          |
| `identitySecret/{accountId}`   | Denied                                                                                                     | Denied                                                                                          |

Recovery lookups, rotation, revocation, linking, and account lifecycle operations must use the callable functions under `functions/src/operations/`.

## Campaigns and characters

| Resource           | Read access                                                                 | Create, update, and delete boundaries                                                                                                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign           | DM or current member; list queries must be limited to at most 100 documents | Creation and deletion are server-only. The DM may update the approved metadata fields but cannot transfer `dmId`.                                                                                                                                                                                     |
| Character          | Campaign DM or effective owner; campaign lists are limited to 100           | The DM may create an unclaimed, non-player-editable character whose `recoveryCode` field is empty. Direct updates cannot change ownership, recovery data, or fields migrated to `patchCharacterField`. The DM may delete a character; the application uses the protected resumable deletion workflow. |
| Character summary  | Campaign DM or member; lists are limited to 100                             | The DM or effective character owner may maintain a validated summary. Deletion is allowed only when the character is deleted in the same atomic write.                                                                                                                                                |
| Claim log          | DM only; lists are limited to 440                                           | Create and update are denied. Deletion is allowed only with deletion of the parent character.                                                                                                                                                                                                         |
| XP history         | Campaign DM or effective character owner; lists are limited to 100          | Direct create, update and delete are denied. `adjustCharacterXp`, `applySessionXp` and `deleteSession` write history through the Admin SDK.                                                                                                                                                           |
| Legacy XP proposal | DM or effective character owner; lists are limited to 440                   | Create and update are denied. DM cleanup is allowed only with deletion of the parent character.                                                                                                                                                                                                       |

The collection-group character query is restricted to the effective owner's characters and a maximum requested limit of 1,000 documents.

## Custom-item library

Published custom items and versions are readable by authenticated users. Draft or archived records are visible only to the campaign DM and the effective creator. Item queries are limited to 200 documents and version queries to 100 documents.

Creators may create validated drafts and edit only the permitted draft fields. The item's identity fields remain immutable. The campaign DM controls publication and may delete an archived item or delete items as part of campaign deletion. Version deletion is DM-only.

## Sessions and messaging

Full session documents, including private DM notes, are DM-only. Member-readable session summaries exclude DM notes. Both query types are limited to 200 documents. The DM may create sessions and edit ordinary session fields. Once `xpApplied` is true, the awarded XP and attendees are immutable. Direct changes to `xpApplied` and direct session deletion are denied. `applySessionXp` and `deleteSession` in `functions/src/operations/sessionXp.ts` own those changes through the Admin SDK.

Threads and messages are visible only to the campaign DM and the effective owner of the thread's character. Thread and message queries are limited to 100 documents.

| Field                    |              Enforced maximum |
| ------------------------ | ----------------------------: |
| Thread preview           |                500 characters |
| Message body             |              2,000 characters |
| Session summary          |              4,000 characters |
| Private DM session notes |              4,000 characters |
| Session attendees        |             100 character IDs |
| Session XP award         | 100,000 whole XP per attendee |

A player send must increment the DM unread count by exactly one. A message sender must resolve to the authenticated effective account. Messages cannot be edited; only the DM may clear thread messages or delete their summary.

## Enforcement and verification

`firebase.json` deploys `firestore.rules` together with `firestore.indexes.json`. The emulator tests under `tests/firestore/` cover these contracts:

- allowed and denied operations;
- query bounds and linked identities;
- immutable fields and ownership transitions; and
- deletion preconditions.

Run the rules suite from the repository root:

```bash
npm run test:rules
```

Rule changes must update the corresponding emulator tests in the same change.
