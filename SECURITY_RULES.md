# Dark Heresy Manager — Firestore security boundary

This document describes the current `firestore.rules` contract. The rules file is authoritative; this overview explains its intent and the behaviours covered by the emulator suite.

## Shared identity model

Every request must be authenticated unless a rule explicitly says otherwise. No current application path permits unauthenticated Firestore access.

`playerOwnsOrLinked(ownerId)` and `dmOwnsOrLinked(dmId)` treat a signed-in primary identity and a secondary device with a matching `userLinks` document as the same effective account. This is used consistently for character ownership, DM authority, profiles, messaging and recovery-code management.

## Users and profiles

`/users/{uid}` is readable and writable only by that exact authenticated UID. Writes allow only the recognised account-state fields and validate their types.

`/userProfiles/{uid}` is an authenticated first-name directory. Any authenticated user may read a profile so names can be shown in campaign UI. Only that profile's effective owner may create or update it, the document may contain only one non-empty `firstName` of at most 50 characters, and client deletion is denied.

## Campaigns

Any authenticated user may read campaign metadata. Any user may create a campaign when its `dmId` is their own UID and the document has the approved shape. Campaign names are limited to 100 characters, member lists to 100 entries, and optional GM/Inquisitor names to 100 characters.

The DM or a linked DM device may edit campaign metadata without transferring `dmId`, and may delete the campaign. A claimant may only add their effective identity to `memberIds`; they cannot remove existing members or change another field. Identity-reclaim updates may replace the old DM/member UID only while a valid temporary reclaim proof exists.

## Characters and audit history

Any authenticated user may read campaign character documents. Only the DM may create a character, and a new character must be unclaimed, player editing must be disabled, and a recovery code must exist.

The DM may update or delete a character. An owning player or linked device may edit only while `isEditableByPlayer` is true and cannot change `userId`, `isEditableByPlayer` or `recoveryCode`. A claim may only move `userId` from null to the claimant's effective identity. Identity reclaim may replace only the proven old owner UID.

Claim-log entries are DM-readable only and immutable after creation. Players may add their own valid claim/release events; DMs may add their own force-assign/force-release events. A log may be deleted only by the DM in the same atomic operation that deletes its parent character.

XP proposals are readable by the DM and effective character owner. The owner may create only their own pending proposal; only the DM may update or delete it.

The collection-group character rule permits a user to query only characters owned by their effective identity.

## Custom-item library

Published custom items and versions are authenticated-readable. A draft or archived item is additionally visible to its creator and the campaign DM. New items must be drafts in a recognised category and must be tied to their effective creator.

Creators may edit only the approved draft/version fields and cannot change immutable ownership, campaign, category or published-version identity. The DM has full campaign-library control. A custom item may be deleted only by the DM after it is archived, or as part of removing the campaign; version documents are DM-deletable.

## Character recovery and account/device recovery

`/recoveryIndex/{code}` and `/identityRecoveryIndex/{hash}` are managed exclusively by trusted Cloud Functions through the Admin SDK; clients have no read or write access to either. Character claiming, Recovery Code lookup/registration/revocation, and identity-code registration/reclaim all go through the corresponding protected callables (see `functions/src/operations/`) rather than direct Firestore access.

`/identitySecret/{uid}` contains only a bounded recovery code and is readable/writable by that effective account (owner or a linked device) so Settings can reveal or rotate it; a write must contain exactly one `code` field passing `validRecoveryCode`.

`/userLinks/{uid}` is readable and deletable only by that secondary UID; creating or updating a link happens through the `linkDevice` callable rather than a direct client write.

## Sessions and messaging

Sessions are authenticated-readable and DM-writable. The rules enforce exact recognised fields, timestamps, 4,000-character summary/private-note ceilings, whole XP from 0 to 100,000 and at most 100 attendees.

Thread summaries and messages are visible only to the campaign DM or effective character owner. Thread data has an exact shape; message previews and bodies are limited to 2,000 characters and unread counts are bounded. A player's send transition may change only the preview/timestamp/unread fields and must increment the DM unread count by exactly one. A message's `fromUid` must be the sender's effective identity. Messages cannot be edited; only the DM may clear messages or their thread summary.

## Deployment and verification

`firebase.json` references both `firestore.rules` and `firestore.indexes.json`, preventing a normal reviewed deployment from silently omitting the index configuration. Nothing in this repository configuration deploys automatically.

The emulator suite under `tests/firestore` verifies allowed and denied operations, field/type/size validation, query boundaries, linked identities, ownership transitions, immutable audit records and batch behaviour. Run it with:

```text
npm run test:rules
```

All paths not granted by an explicit rule are denied by default.
