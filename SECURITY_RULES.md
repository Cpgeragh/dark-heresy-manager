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

`/recoveryIndex/{code}` currently allows an authenticated client to fetch one exact document. Listing and filtered queries are denied. Only the campaign DM may create or update the exact `{campaignId, characterId}` mapping, including ownership checks against an existing mapping. The campaign DM may delete it. This exact-get exception is transitional and recorded in [ADR 0008](./docs/adr/0008-keep-exact-recovery-lookup-temporarily.md); Stage 3 replaces it with HMAC-derived lookup identifiers.

`/identityRecovery/{code}` follows the same exact-get/no-list boundary. Its effective owner may create or delete a strictly shaped `{uid, role}` record. A successful reclaim may transfer only its UID.

`/identitySecret/{uid}` contains only a bounded recovery code and is readable/writable by that effective account so Settings and linked devices can reveal or rotate it. `/identityReclaims/{uid}` and `/linkProofs/{uid}` are temporary, owner-scoped proof documents whose creation is accepted only when the supplied code matches the target account's secret. Proof updates are denied.

`/userLinks/{uid}` is readable/deletable only by that secondary UID. Creating or changing a link requires a matching temporary proof, a different primary UID and a valid timestamp.

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
