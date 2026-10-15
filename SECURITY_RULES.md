# Firestore security boundary

Repository paths in this document refer to the checked-out commit.

`firestore.rules` is authoritative for client access. Trusted Cloud Functions use the Admin SDK and enforce their own authorisation and validation.

## Identity and default policy

All unlisted paths are denied. Every permitted client operation requires Firebase Authentication.

The `playerOwnsOrLinked` and `dmOwnsOrLinked` helpers resolve a device through `userLinks` to its permanent account. A linked device therefore receives the same account-level ownership checks as the primary identity where those helpers are used.

## Top-level collections

| Path                                                  | Client read access                                                                                         | Client write access                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users/{uid}`                                         | Exact authenticated UID                                                                                    | Exact UID may create or update under the recognized field and type contract; deletion is denied                                                                                                                                                                            |
| `userProfiles/{accountId}`                            | Authenticated single-document reads; collection listing denied                                             | Denied; display-name changes use the protected backend                                                                                                                                                                                                                     |
| `accounts/{accountId}`                                | Denied                                                                                                     | Denied                                                                                                                                                                                                                                                                     |
| `userLinks/{uid}`                                     | A device may get its own link; an account may list its bounded device set with the required account filter | Denied; linking and disconnecting use protected backend operations                                                                                                                                                                                                         |
| `recoveryIndex/{hash}`                                | Denied                                                                                                     | Denied                                                                                                                                                                                                                                                                     |
| `identityRecoveryIndex/{hash}`                        | Denied                                                                                                     | Denied                                                                                                                                                                                                                                                                     |
| `identitySecret/{accountId}`                          | Denied                                                                                                     | Denied                                                                                                                                                                                                                                                                     |
| `users/{accountId}/exportReceipts/{exportId}`         | Denied                                                                                                     | Denied; `exportChat` writes the receipt through the Admin SDK                                                                                                                                                                                                              |
| `users/{accountId}/chats/{chatId}` and its `messages` | The owning account or a device linked to it; lists are limited to 200 chats and 100 messages               | Only the owner may set the unread count to zero, move their copy to the bin by setting `clearedAt` to the server time, restore it by removing `clearedAt`, or delete their copy; creation and message edits are denied, and `sendChatMessage` writes through the Admin SDK |

Recovery lookups, rotation, revocation, linking, and account lifecycle operations must use the callable functions under `functions/src/operations/`.

## Campaigns and characters

| Resource           | Read access                                                                   | Create, update, and delete boundaries                                                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign           | DM or current member; list queries must be limited to at most 100 documents   | Creation and deletion are server-only. The DM may update the approved metadata fields but cannot transfer `dmId`.                                                                                                                                                                                     |
| Character          | Campaign DM or effective owner; campaign lists are limited to 100             | The DM may create an unclaimed, non-player-editable character whose `recoveryCode` field is empty. Direct updates cannot change ownership, recovery data, or fields migrated to `patchCharacterField`. The DM may delete a character; the application uses the protected resumable deletion workflow. |
| Character summary  | Campaign DM or member, or a device linked to either; lists are limited to 100 | The DM or effective character owner may maintain a validated summary. Deletion is allowed only when the character is deleted in the same atomic write.                                                                                                                                                |
| Claim log          | DM only; lists are limited to 440                                             | Create and update are denied. Deletion is allowed only with deletion of the parent character.                                                                                                                                                                                                         |
| XP history         | Campaign DM or effective character owner; lists are limited to 100            | Direct create, update and delete are denied. `adjustCharacterXp`, `applySessionXp` and `deleteSession` write history through the Admin SDK.                                                                                                                                                           |
| Legacy XP proposal | DM or effective character owner; lists are limited to 440                     | Create and update are denied. DM cleanup is allowed only with deletion of the parent character.                                                                                                                                                                                                       |

The collection-group character query is restricted to the effective owner's characters and a maximum requested limit of 1,000 documents.

`patchCharacterField` in `functions/src/operations/patchCharacterField.ts` owns XP-bearing character changes. It uses `getSpentXp` from `shared-rules/src/xpSpent.ts` to store `experience.spent` with the accepted purchase and rejects the complete patch when calculated Spent XP would exceed Total XP. `assertPlayerExperienceLedgerUnchanged` prevents a player from adding, removing or changing legacy Rank advances or XP spending transactions; only the campaign DM may manage those records. Current Career purchases use their dedicated validated fields. `reconcileCharacterSpentXp` accepts no client-provided XP amount and repairs only `experience.spent` from the character's stored purchases. Direct changes to Total XP or Spent XP through the generic patch route are denied.

## Custom-item library

Published custom items and versions are readable by authenticated users. Draft or archived records are visible only to the campaign DM and the effective creator. Item queries are limited to 200 documents and version queries to 100 documents.

Creators may create validated drafts and edit only the permitted draft fields. The item's identity fields remain immutable. The campaign DM controls publication and may delete an archived item or delete items as part of campaign deletion. Version deletion is DM-only.

## Sessions and messaging

Full session documents, including private DM notes, are DM-only. Member-readable session summaries exclude DM notes. Both query types are limited to 200 documents. The DM may create sessions and edit ordinary session fields. Once `xpApplied` is true, the awarded XP and attendees are immutable. Direct changes to `xpApplied` and direct session deletion are denied. `applySessionXp` and `deleteSession` in `functions/src/operations/sessionXp.ts` own those changes through the Admin SDK.

The earlier per-character thread documents have no rules, so every client read and write on them is denied.

| Field                    |              Enforced maximum |
| ------------------------ | ----------------------------: |
| Chat preview             |                500 characters |
| Message body             |              2,000 characters |
| Session summary          |              4,000 characters |
| Private DM session notes |              4,000 characters |
| Session attendees        |             100 character IDs |
| Session XP award         | 100,000 whole XP per attendee |

Each person's copy of a chat lives under their own account at `users/{accountId}/chats/{chatId}`. A DM never reads a player's copy and a player never reads the DM's. Only `sendChatMessage` in `functions/src/operations/sendChatMessage.ts` creates chats and messages, through the Admin SDK, and the release operations mark chats closed through `findChatsToClose` and `closeChats` in `functions/src/shared/chatClosure.ts`. The character and campaign deletion jobs mark every copy closed through `closeChatCopiesPage` in the same file, and `deleteAccount` marks the other person's copy closed and puts the account's own copies in the bin, all through the Admin SDK. A copy with `clearedAt` is in its owner's bin.

Two server-only functions work on those copies. `exportChat` in `functions/src/operations/exportChat.ts` reads only the caller's own copy, so another account's chat id returns `not-found`, and it writes a receipt that holds the export ID, chat ID, fingerprint, message count, size, time zone and time, never the message text. `purgeBinnedChatsDaily` in `functions/src/index.ts` runs `purgeBinnedChats` in `functions/src/operations/purgeBinnedChats.ts` through the Admin SDK and permanently deletes messages from copies that have been in the bin for more than seven days. No rule lists `exportReceipts`, so browsers cannot read or write it.

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
