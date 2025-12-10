# Dark Heresy Manager – Firestore Security Rules Overview

This document describes all Firestore security rules used in the Dark Heresy Manager system.
It explains the intent, permissions model, and invariants that the unit tests enforce.

## Table of Contents

1. [Users Collection](#1-users-collection)
2. [Recovery Index](#2-recovery-index)
3. [Campaigns](#3-campaigns)
4. [Characters](#4-characters)
5. [Claim Logs](#5-claim-logs)
6. [DM Privileges & Ownership Model](#6-dm-privileges--ownership-model)
7. [Invariants Required for Correctness](#7-invariants-required-for-correctness)
8. [Testing Strategy Summary](#8-testing-strategy-summary)

---

## 1. Users Collection (`/users/{userId}`)

### Intent

Each Firebase user may store profile and settings data.
This collection must never allow:

- Reading another user's document
- Writing another user's document
- Listing all users

### Rule Summary

- A user may read/write their own document only
- No user may affect another user's document
- Unauthenticated users have no access

### Rationale

User documents may contain email addresses, preferences, or sensitive metadata.
We treat these as strictly private.

---

## 2. Recovery Index (`/recoveryIndex/{code}`)

### Intent

This maps a short recovery code → a character within a campaign, allowing a player to reclaim access to their character.

### Rule Summary

- Anyone authenticated can read recoveryIndex (needed to claim characters)
- Only the DM of the referenced campaign may create or update an entry
- DM must own **both** the campaign being written AND any existing campaign (prevents overwriting another DM's entries)
- No delete permissions exist (recovery codes are permanent)

### Security Fix (Critical)

**Previous vulnerability:** A DM could overwrite another DM's recovery index entry by using the same code.

**Current protection:** Update operations verify that both:
- The new `campaignId` belongs to the requesting DM
- The existing `campaignId` (if any) belongs to the requesting DM

This prevents recovery code hijacking between campaigns.

### Rationale

The recovery index connects public recovery codes to internal game data.
It must be readable by players to reclaim characters, but writable only by the DM to avoid:

- Hijacking characters
- Linking codes to incorrect campaigns
- Unauthorized claim operations
- Cross-campaign recovery code conflicts

---

## 3. Campaigns Collection (`/campaigns/{campaignId}`)

### Intent

Campaigns define a game instance and the DM who controls it.

### Rule Summary

- Authenticated users can read and list campaigns
- Only the DM listed in `dmId` may create or update the campaign metadata
- `dmId` must always match the UID of the caller
- No delete permissions exist for campaigns

### Rationale

Campaign metadata changes must remain under DM control.
Listing is allowed because campaigns are inherently visible to all players involved.

---

## 4. Characters (`/campaigns/{campaignId}/characters/{characterId}`)

### Intent

A character belongs to a player but is ultimately under DM authority.
Players can edit their characters only when allowed.

### Concepts

- **Owner** = user whose UID matches the character's `userId`
- **DM** = user whose UID matches the campaign's `dmId`
- **Editable flag** (`isEditableByPlayer`) controls whether the owner can make updates

### Rule Summary

#### Read
- Any authenticated user may read or list characters

#### Player Update (Safe Mode)
A character's owner may update only when:
- `isEditableByPlayer == true`
- They do not modify:
  - `userId`
  - `isEditableByPlayer`
  - `recoveryCode`

#### Defensive Null Handling
**Critical for subcollection operations:** When subcollections (like claimLog) are created, Firestore evaluates parent character update rules with potentially null contexts. The rules include defensive checks:
```javascript
resource != null &&
resource.data != null &&
(
  request.resource.data == null ||
  !("userId" in request.resource.data) ||
  request.resource.data.userId == resource.data.userId
)
```

This prevents:
- Rule evaluation errors during subcollection creation
- False permission denials
- Test failures with "Service call error"

#### DM Permissions
The DM may:
- Create
- Update  
- Delete

ANY character in their campaign.

#### Players Cannot Create or Delete Characters
Creation & deletion are DM-only operations.

### Rationale

This supports a balance:
- Players can modify their character sheet during "editing mode"
- DM retains total authority and can lock character editing at any time
- Protected fields prevent ownership theft or bypassing recovery mechanisms
- Defensive null checks prevent rule evaluation errors in edge cases

---

## 5. Claim Logs

(`/campaigns/{campaignId}/characters/{characterId}/claimLog/{logId}`)

### Intent

Record a permanent, auditable history of:
- Players claiming characters
- Releasing characters
- DM overrides (force-assign / force-release)

### Rule Summary

#### Read
- Only DM can read claim logs (players must not see audit history)

#### Allowed Actions
Valid actions:
- `claim`
- `release`
- `force-assign`
- `force-release`

#### Create
- DM may create ANY valid log
- Players may create logs only for themselves and only with `claim`/`release`
- Action must be valid
- `actorUid` must match caller's UID for players

#### Update/Delete
- No one may update or delete logs
- Claim logs are **immutable**

### Rationale

Logs are intended to be a permanent audit trail.
Immutability and restricted visibility protect game integrity.

---

## 6. DM Privileges & Ownership Model

Across all collections:

- The **DM is the ultimate authority** for everything within a campaign
- Players have **restricted, self-only** access
- Unauthenticated users have **no rights** anywhere

This model ensures:
- Campaign-level consistency
- Secure delegation of character control
- No cross-player editing or impersonation

---

## 7. Invariants Required for Correctness

These conditions must always hold true; the test suite enforces them.

### Campaign Invariants
- `dmId` is always the UID of the DM performing writes
- No user may alter `dmId` to another UID

### Character Invariants
- Players cannot change ownership (`userId`)
- Editing is allowed only when explicitly unlocked (`isEditableByPlayer`)
- Recovery codes cannot be altered by players
- Rules handle null contexts gracefully during subcollection operations

### RecoveryIndex Invariants
- `campaignId` must refer to a real, DM-owned campaign
- Only the DM may write entries
- Updates verify ownership of both old and new campaigns (prevents hijacking)
- No deletes allowed (recovery codes are permanent)

### ClaimLog Invariants
- Logs are immutable
- Only valid actions are accepted
- Players may only log actions for themselves

### General Invariants
- Unauthenticated users have zero read/write permissions

---

## 8. Testing Strategy Summary

### Test Suite Statistics
- **128 total tests** - all passing
- **18 test files** covering all security boundaries
- **Sequential execution** prevents test interference
- **Selective cleanup** only where proven necessary

### Core Test Files (79 tests)
- `campaignRules.test.ts` - Campaign CRUD permissions
- `characterRules.test.ts` - Character access control
- `characterOwnershipProtection.test.ts` - Protected field validation
- `claimLogRules.test.ts` - Immutable audit log (with cleanup)
- `recoveryIndexRules.test.ts` - Recovery code management
- `usersRules.test.ts` - User document isolation
- `unauthenticatedRules.test.ts` - Anonymous access denial
- `dmPrivilegeRules.test.ts` - DM-specific permissions
- `playerEdit.test.ts` - Player editing boundaries

### Advanced Test Files (49 tests)
**High Priority:**
- `advancedQueryTests.test.ts` - Query operations (where, orderBy, limit)
- `batchOperations.test.ts` - Batch write validation
- `recoveryIndexAdvanced.test.ts` - Edge cases and security validation

**Medium Priority:**
- `characterQueryTests.test.ts` - Character query operations
- `protectedFieldsSameValues.test.ts` - Field protection with unchanged values

**Low Priority:**
- `edgeCases.test.ts` - Special characters, long strings, nested objects
- `fieldValidation.test.ts` - Data type validation

### Test Infrastructure

#### Helpers (`tests/firestore/helpers.ts`)
- `dbAs(env, uid)` - Get authenticated Firestore client
- `dbAnon(env)` - Get unauthenticated client
- `createCampaign()` - Create campaign with verification read (prevents race conditions)
- `createCharacter()` - Create character with complete schema
- `createClaimLog()` - Create claim log entry
- `createRecoveryIndexEntry()` - Create recovery index entry

#### Setup (`tests/firestore/setup.ts`)
- Singleton test environment
- Sequential file execution (`fileParallelism: false`)
- Minimal cleanup strategy (only claimLogRules needs it)

### Coverage Validation

Our test suite achieves near-complete behavioral coverage by validating:

- All allowed actions succeed
- All forbidden actions fail
- All invariants remain true
- All authenticated/unauthenticated distinctions work
- All DM/player differences are enforced
- All read/list/write/delete permissions behave as intended
- Defensive null handling prevents edge case failures
- Recovery index security prevents cross-campaign hijacking
- Query operations respect security boundaries
- Batch operations validate atomically

### Running Tests
```bash
# Start emulator
firebase emulators:start --only firestore

# Run all tests (33 seconds, sequential)
npm run test

# Run specific test file
npm run test -- characterRules.test.ts

# Run in UI mode
npm run test:ui
```

### Test Reliability

**Strategy:** Sequential file execution prevents test interference without complex cleanup code.

**Trade-offs:**
- Slower execution (33s vs 9s parallel)
- 100% reliable (no flaky tests)
- Simple infrastructure
- Easy to maintain

**When to Optimize:**
If the test suite grows significantly (200+ tests) or execution time becomes a bottleneck, consider implementing per-test isolation with unique Firestore roots and parallel execution.

---

This ensures your Firestore rules enforce the exact security model required for Dark Heresy Manager.