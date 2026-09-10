---
title: Firestore reads, listeners, and subscription lifetime
date: 2026-09-08
status: Corrections applied and verified
---

# Firestore reads, listeners, and subscription lifetime

## Purpose

This report maps the application's live Firestore subscriptions, distinguishes listener lifetime
from delivered snapshot size, and records the corrections made to reduce unnecessary work. It also
documents the limits of emulator measurements: emulator request activity and snapshot document
counts are useful evidence, but they are not production billing records.

Accessibility is outside this investigation.

## Method and safety boundary

The investigation used the repository's guarded performance mode, deterministic fixtures, Firebase
Auth, Firestore, and Functions emulators, and production-shaped PWA builds. The browser and fixture
tools were pinned to the local `dh-test` project and fixed `127.0.0.1` emulator ports. No live
Firestore project was contacted.

The application recorder supplied listener start, snapshot, error, stop, and active-count events.
It now also records `fromCache` and `hasPendingWrites` from each Firestore snapshot. The Firestore
emulator request screen was checked separately for backend operations.

These signals must not be conflated:

- A listener is an application subscription and remains active until its cleanup runs.
- A snapshot count is the number of documents delivered to the application callback.
- `fromCache: true` identifies a cache-delivered snapshot; `false` identifies a snapshot whose data
  is current with the server.
- A metadata-only server confirmation is not delivered by the application's normal listeners, so
  the absence of a later `fromCache: false` event is not proof that no server check occurred.
- The emulator does not reproduce production listener billing, minimum query charges, or all
  reconnect charging behaviour. It therefore cannot produce an exact billed-read total.

The billing limitation follows Firestore's documented listener charging and reconnect rules:
<https://firebase.google.com/docs/firestore/pricing>. Snapshot-source interpretation follows the
listener metadata documentation: <https://firebase.google.com/docs/firestore/query-data/listen>.

## Subscription inventory after correction

Two subscriptions are global after authentication:

1. `userLinks/{authenticatedUid}` resolves device linking.
2. `userProfiles/{effectiveUid}` keeps the effective account name current.

Route and optional-interface subscriptions are as follows.

| Screen or interface | Additional live subscriptions | Lifetime |
| --- | --- | --- |
| Dashboard | DM active campaigns, player active campaigns, archived campaigns | Dashboard route only |
| Campaign overview | Campaign document, campaign characters, sessions or member-safe session summaries, thread summaries, campaign custom-item administration | Campaign route only |
| Character sheet | Campaign document and character document | Character route only |
| Character belonging to another player | Owner profile document | Only while that character is displayed |
| Player message drawer | Latest thread-message page | Only while the drawer is open with a campaign and character |
| DM message view | Latest thread-message page | Only while a thread is selected |
| Character custom-item interface | One DM query, or published plus creator-draft player queries | Only while a picker is open or the character owns a linked definition requiring live controls |
| Campaign character-row claim history | Claim-log query | Only while history is open |
| Character administrative claim history | Claim-log query | Only while history is open |

The character sheet does not start a second profile subscription when the effective user owns the
character. It reuses the account name already supplied by the global profile subscription. A DM
viewing another player's character still receives that player's live profile name.

## Listener counts

The small fixture was used for comparable before-and-after route counts. Counts include the two
global account subscriptions, even when the user-link document does not exist.

| Journey | Before | After | Change |
| --- | ---: | ---: | ---: |
| Dashboard | 5 | 5 | No change; this is the only consumer of both campaign-list queries |
| Campaign overview | 9 | 7 | Removed two unused campaign-list listeners |
| Own character, default tab | 7 | 4 | Removed two unused campaign-list listeners and one duplicate profile listener |
| Settings | 4 | 2 | Removed two unused campaign-list listeners |
| Empty custom-item character tab, picker closed | Character base + 1 DM or + 2 player | Character base only | Queries are no longer eager |
| Empty custom-item character tab, picker open | Character base + 1 DM or + 2 player | Same | Required picker behaviour retained |
| Message or claim-history interface open | Base + 1 | Base + 1 | Required live behaviour retained |

A production-shaped own-character route settled at four active listeners: user link, effective
profile, campaign document, and character document. Dashboard remained at five, campaign overview
settled at seven, and Settings settled at two.

## Delivered documents and emulator observations

The small campaign route delivered the following fixture sizes to its route listeners: one campaign,
eight sessions, four characters, one thread summary, and twelve custom items. Before correction it
also maintained DM and player campaign-list listeners on that route even though no component read
their results.

The character route similarly carried both campaign-list snapshots and a second callback for the
same effective-user profile. Firestore's client reused cached targets during navigation, so the
second application callback did not consistently produce a second visible emulator request. The
duplicate was removed because it was confirmed application work, not because the emulator proved a
second billed read.

Before correction, a player custom-item picker's published query and creator query each delivered
the same two published fixture documents. The creator query also admitted archived definitions that
were discarded client-side. It now includes `status == "draft"`, making the two picker result sets
disjoint by construction: all published definitions plus only the current creator's drafts.

On the corrected campaign overview, the recorder captured both cache- and server-current snapshots
where Firestore emitted both callbacks. Other targets emitted only a cache callback when their data
did not change. Repeated custom-picker openings delivered cache snapshots and did not accumulate
listeners. This is evidence of client cache reuse; it is not presented as an exact server-read or
billing count.

## Repeated-use and cleanup verification

Optional interfaces were opened and closed five times each.

| Interface | Starts | Stops | Final result |
| --- | ---: | ---: | --- |
| Player message view | 5 | 5 | Returned to route baseline |
| DM selected-thread message view | 5 | 5 | Returned to route baseline |
| Campaign character-row claim history | 5 | 5 | Returned to route baseline |
| Character administrative claim history | 5 | 5 | Returned to route baseline |
| Corrected empty DM custom-item picker | 5 | 5 | Returned to four-listener character baseline |

The shared subscription hook also has deterministic coverage for disabled-to-enabled transitions,
unmount cleanup, query-key changes, document-path changes, and stale callbacks from replaced
listeners. Campaign or character selection changes therefore replace the old semantic key and stop
the previous listener.

## Query bounds and server filtering

Every identified live list query is bounded:

| Query | Bound | Server filtering |
| --- | ---: | --- |
| Active campaigns per role | 50 | DM ID or member array plus active archive state |
| Archived campaigns | 100 | DM ID plus archived state |
| Campaign characters | 100 | Campaign subcollection; players additionally filter by owner UID |
| Player character summaries | 1,000 | Owner UID |
| Sessions | 200 | Campaign full-session or member-safe summary subcollection |
| Thread summaries | 100 | Campaign thread subcollection, ordered by activity |
| Live message page | 100 | Selected thread subcollection, ordered newest first |
| Claim history | 50 | Selected character claim-log subcollection |
| Custom items | 200 per query | Campaign subcollection plus status, creator, and/or category |

Older messages use explicit one-shot pages of 100 with document cursors. Other bulk maintenance
lookups are paginated or separately bounded and are not persistent listeners.

The new creator query uses only equality constraints. Firestore documents index merging for simple
compound equality queries, so no speculative composite index was added:
<https://firebase.google.com/docs/firestore/query-data/index-overview>. The exact
creator/status/category query shape also passed the local Firestore rules suite.

## Implemented corrections

1. The campaign-list provider now wraps only the Dashboard route. Campaign overview, character,
   Settings, and message UI no longer inherit two subscriptions they do not consume.
2. The application passes the already-loaded effective-user first name to the character sheet. The
   sheet subscribes to an owner profile only when the owner is a different user.
3. The custom-item creator query is server-filtered to the current user's drafts. Published items
   continue to come from the separate published query.
4. Weapons, Armour, Gear, Cybernetics, Psychic Powers, Drugs, Archeotech, and Traits enable their
   custom-item subscription only while a picker is open or a linked character item requires live
   definition state.
5. Performance listener events record cache and pending-write metadata without enabling
   metadata-only callbacks or changing normal application behaviour.
6. Focused orchestration, query-shape, picker-gating, document-switch, metadata, and rules tests cover
   the corrections.

## Alternatives considered

- **Add an application-wide subscription registry:** rejected. Firestore already reused cached
  targets during repeated journeys, and the confirmed fan-out was better removed at its provider and
  consumer boundaries.
- **Move custom items into another shared provider:** rejected. It would fan every category out to
  every character route and retain subscriptions while no picker or linked item needs them.
- **Place subscriptions exclusively inside picker modals:** rejected. Linked custom inventory rows
  require live definition state for edit, publish, archive, and update-all controls after a picker
  closes.
- **Convert campaign, session, character, or message listeners to one-shot reads:** rejected. Their
  live synchronisation is intended product behaviour.
- **Disable the archived-campaign listener while the Dashboard section is collapsed:** rejected for
  this correction. It supplies visible count and empty-state information, so removal would be a
  product change rather than transparent cleanup.
- **Reduce list limits because some fixtures are large:** rejected. Limits are existing safety
  ceilings, and size or an isolated timing is not evidence that ordinary product behaviour is wrong.
- **Add a three-field custom-item index pre-emptively:** rejected. The query uses equality filters,
  existing index merging is documented, and local query/rules verification passed.
- **Increase test timeouts:** rejected and not needed.

## Verification completed

- Focused application tests: 55 tests passed for provider scope, character profile reuse,
  subscription lifecycle, query bounds, and performance metadata.
- Focused custom-interface tests: 112 tests passed across the affected fast-suite files.
- Complete fast application suite: 211 files and 2,239 tests passed.
- Heavy application suite: 3 files and 62 tests passed.
- Firestore emulator rules suite: 25 files and 240 tests passed.
- TypeScript and production Vite/PWA build: passed.
- Lint: passed.
- Formatting check: passed.
- Local safety check: passed.
- Guarded browser verification: corrected Dashboard, campaign, character, Settings, cache metadata,
  and repeated custom-picker lifecycle were exercised against local emulators.

No timeout was increased. No commit or push was made.
