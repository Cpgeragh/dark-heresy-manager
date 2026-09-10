---
title: Save latency, write coalescing, and synchronisation
date: 2026-09-10
status: Corrections implemented and verified
---

# Save latency, write coalescing, and synchronisation

## Purpose

This report records the delay and persistent workload between an editing action and durable state.
It covers notes and character fields, inventory and ammunition counters, talents and experience,
sessions, custom items, and messages. It also records rapid-edit behaviour, two-tab convergence,
offline recovery, and the signals that end saving states.

No live Firebase project was contacted. Authenticated measurements used only the disposable
`dh-test` Auth, Firestore, and Functions emulators. No arbitrary timeout was added or increased.

## Method and interpretation

Source inspection and unit tests established each mutation boundary, debounce, transaction, and
write path. Emulator-backed tests established authorisation, rules behaviour, transaction
contention, and snapshot delivery. An isolated in-app browser exercised the same local application
against those emulators.

Performance mode now records metadata-only `mutation-start`, `mutation-complete`, and
`mutation-error` events. A shared mutation ID pairs each start with its outcome. Completion duration
ends when the write, batch, transaction, or callable promise settles; it is acknowledgement latency,
not listener turnaround. The following listener snapshot remains a separate event so the two
intervals can be measured independently. No mutation payload, character value, message text, or raw
error message is recorded.

Browser-controlled wall time includes DOM and accessibility-tree traversal, user-event simulation,
browser-control work, local emulator scheduling, Functions cold start, and worker contention.
Emulator timings are diagnostic traces, not production service-level objectives. Exact call and
write counts, final persisted values, transaction behaviour, and paired signals carry more weight
than a single elapsed time.

## Mutation inventory

| Area                 | Persistent operation and completion signal                                                             | Rapid-edit policy                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Notes                | Protected character-field callable; its promise ends saving                                            | Existing 600 ms trailing debounce; blur and unmount flush once                                              |
| Character fields     | Protected single- or multi-field callable; its promise ends saving                                     | Character Name now uses the same 600 ms draft behaviour; other discrete controls save immediately           |
| Inventory quantities | Protected transactional numeric-delta callable                                                         | Compatible deltas to one exact item/property coalesce for 300 ms                                            |
| Ammunition           | The same numeric-delta callable for clips, rounds, and magazine rounds                                 | Compatible deltas to one exact nested item/property coalesce for 300 ms                                     |
| Talents and XP       | Protected single- or atomic multi-field callable                                                       | Dialogs await the real result; grouped state changes remain one atomic operation                            |
| Sessions             | Direct Firestore create, update, delete, and apply-XP operations                                       | No coalescing across operations with ordering or consistency dependencies                                   |
| Custom items         | Direct Firestore draft create/save, publish, archive, and restore operations                           | Existing batch and workflow boundaries retained                                                             |
| Messages             | Firestore batch for send, document update for mark-read, bounded deletion then summary reset for clear | Identical in-flight sends retain existing single-flight protection; drafts clear only after acknowledgement |

Direct Firestore services and protected character services are wrapped at their actual persistence
boundary. UI saving states now end from resolved or rejected promises rather than a fixed delay.
The character mutation hook counts pending operations, so one early completion cannot clear the
busy state while another save is still running.

## Initial evidence

Notes already had the intended draft behaviour. Typing three characters and blurring produced one
callable request, retained the final value, and did not add a later duplicate request. Unit tests
also cover the trailing-debounce, blur-flush, and unmount-flush paths.

Character Name did not share that protection. Three consecutive characters produced three
protected callable invocations. Their snapshots could arrive out of order, and the final stored
name retained only the first of the three characters in the reproduced trace. Name editing also
patched the complete header object each time.

Quantity controls had a separate stale-array race. Two rapid Drug increments and two rapid
Ammunition increments each issued two callable requests but changed the stored number by only one.
Two tabs updating different rows of the same array could also overwrite one another because each
request submitted its own complete, previously read array.

The protected callable path creates persistent operational records around the product mutation.
Source inspection found six physical Firestore writes for an ordinary protected character edit:
one rate-limit write, one idempotency claim, the character update and idempotency completion in the
operation transaction, one audit entry, and one usage metric. A header change also writes the
character summary, making seven. These are physical writes on the inspected path, not a billing
estimate. Consequently, three immediate name calls could generate 21 writes, and two stale-array
quantity calls could generate 12. A rank-up previously used separate experience and header calls,
for 13 writes across the two protected operations.

Message sending uses one atomic Firestore batch containing the new message and its thread summary.
The wrapper components previously caught and displayed an error without rethrowing it. The input
therefore interpreted a failed send as success and cleared the unsent draft.

The former offline banner also implied that all changes would synchronise automatically. That is
true for supported direct Firestore writes but not for HTTPS callable mutations.

## Implemented corrections

### Debounced text and final-edit safety

Character Name now uses the established 600 ms debounced draft mechanism. A typing burst produces
one header mutation, while blur and unmount synchronously schedule the final dirty value exactly
once. Notes keep their existing implementation. Tests cover debounce expiry, blur, unmount, final
value retention, and absence of a delayed duplicate.

### Transactional numeric deltas

Supported single-number changes are detected only when the before/after collections differ at one
exact numeric path. This covers consumable, drug, grenade, ranged-weapon, and melee-weapon quantity;
armour spare cells; ammunition clips and rounds; and ranged magazine rounds.

Compatible changes to the same character, collection, item, nested item, and property accumulate
for 300 ms. A zero net delta cancels without a request. The callable validates the narrow locator,
authorisation, safe-integer delta and fallback, and the complete resulting field. Its transaction
reads current server state, applies the accumulated delta with a zero lower bound, and writes the
validated collection. Independent tabs therefore compose against fresh state instead of replacing
one another's arrays. Structural edits, multiple changed paths, and unsupported number changes
fall back to the existing complete-field validation and patch.

One two-click burst now uses one protected operation—six physical writes on the inspected path—in
place of two operations and 12 writes, while preserving both clicks.

### Deterministic saving outcomes

Talent acquisition, talent removal, and experience dialogs now await a Boolean result from the
actual mutation. They close only after success and remain open on failure. Rank-up writes experience
and header together through one atomic multi-field patch, reducing its protected-operation path
from 13 physical writes to seven while preventing partial rank state.

Message wrappers rethrow after showing their toast. The message input catches the rejection at its
own boundary, keeps the draft, and becomes ready for retry. It clears only after the Firestore batch
acknowledges success.

Audit and usage writes begin concurrently after the protected handler outcome is known. They are
independent observability records, and failure remains non-fatal as before. Authentication,
validation, rate limiting, idempotency, authorisation, product transactions, ordered message
clearing, and all operations with consistency or security dependencies remain serial.

The offline banner now says to keep the page open and retry any change that reports a failure. The
performance build adds guarded Firestore network controls for repeatable offline queue testing;
they do not suggest that callable Functions are offline queueable.

## Emulator and browser results

The corrected one-tab Drug journey began at quantity 2. Two rapid increments produced one
authenticated callable invocation and persisted quantity 4. The CORS preflight was observed but is
not counted as a mutation.

For the two-tab journey, both tabs began at quantity 4. One increment in each tab produced a
transactional final value of 6. An intermediate snapshot displayed 5 before the second transaction
completed; after 1.2 seconds both tabs displayed 6. This is the expected shared-cache and listener
convergence sequence, not a lost update.

The emulator integration test also ran concurrent authenticated delta calls and preserved a nested
ammunition sibling while updating its target. Contended calls took approximately 2.3 to 3.4 seconds
in that local run, while an ordinary single call was about 132 ms. The longer interval includes
transaction retry, emulator scheduling, and local Functions runtime overhead; it is not evidence of
equivalent production latency.

For offline synchronisation, the performance control awaited Firestore network disablement before
the action. A message send remained visibly pending and its draft stayed in the input. After the
control awaited reconnection, the batch completed, the input cleared, and the message appeared.
The emulator contained exactly one matching message. This verifies direct Firestore queue and
reconnection behaviour without making a claim about callable mutations.

## Alternatives considered and rejected

- Blanket debouncing of every character field was rejected. Discrete selections and modal saves
  are already single intentional operations, and adding delay would weaken feedback without
  addressing a demonstrated duplicate-write path.
- Client-side read/modify/write transactions over every inventory array were rejected. The client
  cannot safely use its rendered array as current state across tabs; the narrow server transaction
  preserves authorisation, validation, and idempotency at the existing protected boundary.
- Coalescing structural array edits or unrelated number paths was rejected. Their ordering and
  consistency semantics differ and cannot be represented safely as one accumulated scalar delta.
- Parallelising validation, rate limiting, authorisation, idempotency, transactions, message clear
  phases, or dependent custom-item workflow steps was rejected. Only independent post-outcome
  audit and usage recording was parallelised.
- Closing dialogs or clearing message drafts optimistically was rejected because a visible success
  state must follow persistence acknowledgement, not an assumed result or fixed delay.
- Treating callable Functions as Firestore-offline writes was rejected. They fail when unavailable
  and require retry; only direct Firestore writes use the local persistence queue tested here.
- Removing audit or usage records to lower write counts was rejected. The performance correction
  reduces duplicate product operations while retaining the established security and observability
  controls.
- Treating Functions cold start, emulator contention, browser automation time, a single timing,
  bundle size, or the existing large-chunk warning as proof of a save-latency defect was rejected.

## Verification

- Correction-focused application set: 8 files and 145 tests passed.
- Focused startup, Firebase, PWA, loading, and offline set: 6 files and 36 tests passed.
- Complete fast application suite: 212 files and 2,265 tests passed.
- Three heavy Gear and Talent suites: 3 files and 63 tests passed.
- Correction-focused Functions unit set: 2 files and 14 tests passed.
- Complete Functions unit suite: 38 files and 434 tests passed.
- Complete Functions emulator integration suite: 24 files and 92 tests passed.
- Complete Firestore rules suite: 25 files and 241 tests passed against the local emulator.
- Production build completed and generated a 43-entry, 2,688.20 KiB precache.
- Lint, formatting verification, local safety checks, and diff whitespace checks passed.

The browser checks used only an isolated in-app browser against local services. No Google Chrome,
live Firebase project, commit, or push was used.

## Remaining boundaries

The numeric coalescer intentionally handles only one supported scalar path at a time; broader edits
continue through the fully validated field patch. Callable mutations remain online-only and report
failures for explicit retry. A local emulator timing should not be promoted to a production budget
without repeated measurements in a stable production-like environment. These are explicit product
boundaries rather than unresolved evidence of lost writes.
