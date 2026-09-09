---
title: Large-list, picker, search, and custom-form performance
date: 2026-09-09
status: Corrections implemented and verified
---

# Large-list, picker, search, and custom-form performance

## Purpose

This report records the investigation of interfaces whose cost grows with character, campaign,
message, reference-data, or custom-item volume. It distinguishes React work from browser-control
and test-runner overhead, records the confirmed causes found during investigation, and documents
the narrowly scoped corrections and their verification.

No live Firebase project was contacted. All authenticated measurements used the disposable
`dh-test` Auth, Firestore, and Functions emulators.

## Method and interpretation

- The application ran in its guarded local `performance` mode. Production bundles do not contain
  the performance fixture or component-counter code.
- Performance-only counters recorded component function executions. React development mode and
  listener updates multiply these counts, so they show propagation patterns rather than a literal
  production render count.
- React Profiler commit durations are the primary rendering signal. Browser-observed action times
  include animation, accessibility-tree traversal, browser-control work, and emulator latency.
- Single interaction timings are diagnostic traces, not pass/fail budgets. Repeated propagation
  and exact component relationships carry more weight than one duration.
- Scrolling was checked separately from React updates. A scroll that produced no commit is not
  reported as React rendering work merely because the document was large.
- Heap readings rose monotonically without forced garbage collection and are not treated as leak
  evidence.
- No arbitrary timeout was added or increased.

The deterministic datasets were:

| Fixture                         | Contents used by this investigation                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Near-limit character and picker | 180 entries in each dense character collection and 200 mixed-category campaign custom items |
| Large campaign                  | 90 characters, 180 sessions, 180 campaign custom items, and 90 message-thread summaries     |
| Long message thread             | 300 messages, loaded in pages of 100                                                        |
| Small control                   | Small character and campaign data plus 12 mixed-category campaign custom items              |

## Initial near-limit character rendering

The figures below are single diagnostic traces after the requested tab had loaded. They establish
relative density and propagation; they are not presented as stable production budgets.

| Tab            | Largest React commit | Total recorded React commit time | Dominant component executions                            |
| -------------- | -------------------: | -------------------------------: | -------------------------------------------------------- |
| Skills         |             341.5 ms |                         371.5 ms | 366 skill rows                                           |
| Talents        |             607.4 ms |                         662.4 ms | 720 talent-entry cards                                   |
| Traits         |             192.8 ms |                         386.7 ms | 736 talent-entry cards                                   |
| Weapons        |             465.1 ms |                         630.3 ms | 720 ranged, 720 melee, and 1,440 grenade-card executions |
| Armour         |             269.2 ms |                         281.7 ms | 720 armour-row executions                                |
| Gear           |             227.9 ms |                         339.6 ms | 720 gear and 720 consumable-row executions               |
| Drugs          |             200.6 ms |                         265.4 ms | 1,440 drug-row executions                                |
| Cybernetics    |             211.0 ms |                         261.4 ms | 720 implant-row executions                               |
| Psychic Powers |             198.0 ms |                         265.4 ms | 720 power-card executions                                |

These results confirm that the initial dense screens perform substantial work, but a large initial
tree alone does not identify a safe correction. The more useful evidence came from interactions
that should affect only a picker, form, or one campaign section.

## Picker, search, and scrolling results

Browser-observed times below are included to show the shape of each journey. They must be read with
the browser-control caveat above. React commits and component propagation are the stronger signal.

| Picker         |   Open | First broad input |        Continued input | Scroll |  Close | Largest relevant commit and propagation                          |
| -------------- | -----: | ----------------: | ---------------------: | -----: | -----: | ---------------------------------------------------------------- |
| Drugs          |  23 ms |       25 ms (`a`) |        16 ms (`stimm`) |  67 ms | 110 ms | 152.0 ms; 1,440 drug-row executions across the trace             |
| Skills         | 185 ms |       23 ms (`a`) |   22 ms (`acrobatics`) |  48 ms | 112 ms | 59.2 ms; 732 skill-row executions                                |
| Talents        | 121 ms |       33 ms (`a`) | 34 ms (`ambidextrous`) |  17 ms |  50 ms | 47.1 ms; 720 owned talent-card executions                        |
| Traits         | 113 ms |       41 ms (`a`) |        17 ms (`blind`) |  16 ms |  48 ms | 46.1 ms; 1,472 owned talent-card executions                      |
| Ranged weapons | 260 ms |    1,723 ms (`a`) |      45 ms (`autogun`) |  34 ms | 282 ms | 478.4 ms; broad results instantiate detailed ranged-weapon cards |
| Cybernetics    |  98 ms |      228 ms (`a`) |        18 ms (`augur`) |  15 ms | 115 ms | 114.5 ms; 1,440 owned implant-row executions                     |
| Psychic Powers | 381 ms |       86 ms (`a`) | 16 ms (`fearful aura`) |  11 ms | 115 ms | 157.3 ms; 2,356 power-card executions                            |
| Consumables    |  33 ms |      298 ms (`a`) |    19 ms (`lamp pack`) |  11 ms | 126 ms | 98.9 ms; 1,080 gear and 1,080 consumable-row executions          |

Scrolling produced no separate React update in the measured lists. Continued, selective search was
also consistently cheap. The expensive pattern is broad result construction and parent-state
propagation, not typing in general. This is evidence against adding a debounce to every search.

The ranged-weapon picker is the clearest picker-specific cost. Unlike the lighter shared picker
rows, every matching reference weapon is converted into and rendered as a detailed `RangedCard`.
The first broad search produced a 188.9 ms React search commit inside a trace whose largest commit
was 478.4 ms. The browser-observed 1.7 seconds includes control overhead and is not used alone to
claim a product regression.

The correction replaces each collapsed ranged-picker result with a lightweight reference row and
mounts the existing detailed card only when that result is expanded. Selection behavior, the
information control, the class marker, the expand/collapse control, focus restoration, and the
picker's public API remain unchanged. The post-correction broad-search React commit was 122.1 ms,
about 35% below the 188.9 ms baseline. The browser-observed picker open, first broad input, and
continued input were 276 ms, 202 ms, and 80 ms respectively.

The post-correction trace executed 950 lightweight ranged-picker rows and 132 shared picker rows.
It did not mount full cards for collapsed picker results. The 1,080 `RangedCard` executions in the
same trace came from the 180 ranged weapons already displayed on the dense sheet behind the modal.
That background tree still produced 445.5-451.8 ms commits during open and close, so this report
does not claim that total picker opening became cheap. Isolating the owned-weapons tree would be a
separate optimization requiring its own evidence and approval.

## Custom-gear flow

Opening the near-limit gear picker, moving to the custom form, typing, cancelling, reopening, and
closing all completed. The form itself responded quickly to input: the first name input was
observed at 42 ms and continued input at 20 ms. The picker is intentionally retained in a suspended
state while the custom form is displayed, preserving picker state and scroll position.

The combined open, form, cancel, and reopen trace executed 2,520 gear rows, 2,520 consumable rows,
2,232 picker rows, 12 gear-picker functions, 20 picker-modal functions, and 8 custom-form functions.
Its largest commits were 270.9 ms and 210.9 ms. This confirms that local picker/form state can
invalidate the dense owned-inventory tree even when the inventory has not changed.

The exact failed payload was then reproduced outside the mocked component boundary. The cause was
not an extra application field or a missing rule allowance: `stripUndefined()` recursively treated
Firebase's `serverTimestamp()` field-value sentinel as an ordinary object and converted it to a
plain `{ _methodName: "serverTimestamp" }` object. The unchanged rules correctly rejected that
plain object where a timestamp was required.

The correction limits recursive undefined removal to arrays and plain objects. Dates, Firestore
timestamps, field-value sentinels, and other class instances now retain their identity. The draft
item and version payload construction is also exposed as a pure builder so tests assert the exact
top-level key sets, trimmed display name, and the identity of all four timestamp fields before a
write is attempted. No Firestore rule, query limit, or document schema was relaxed.

After the correction, the complete browser-to-emulator custom-gear write succeeded through the
unchanged rules in both data shapes:

| Fixture    | Save-to-success-toast wall time | Additional observations                                      |
| ---------- | ------------------------------: | ------------------------------------------------------------ |
| Small      |                          880 ms | Warm emulator; created item was available to the character   |
| Near-limit |                        1,450 ms | 23 React commits; largest commit 266.8 ms                     |

The near-limit custom form opened in 1,167 ms in the correction trace, compared with approximately
2,520 ms in the earlier browser-controlled trace. This is useful directional evidence but not a
stable performance budget because browser-control and emulator conditions varied between the two
runs. The near-limit fixture already contained 200 custom items and the successful operation
created another draft; that diagnostic action is not used to infer or change product cap policy.

## Campaign list and custom-item administration propagation

Initial large-campaign rendering produced a 420.0 ms largest commit and 1,146.0 ms of recorded
React commit time. The trace executed 360 character rows, 720 session cards, and 1,080 custom-item
administration rows. Listener snapshots correctly distinguished cache delivery from server-current
delivery; the emulator figures are diagnostic and not billing estimates.

Custom-item category and status filters were locally bounded. Filtering to Gear and Published took
161 ms and 93 ms in the browser-controlled trace, with React commits of 12.7 ms and 9.9 ms.
Restoring all categories produced a 101.3 ms commit. Filtering the custom-item library did not
itself rerender unrelated campaign sections.

Session create, edit, and delete exposed broader propagation:

- Locating one attendee among 90 accessible checkboxes took about 3.1 seconds in browser control,
  while the corresponding React commit was about 10 ms. This is test/automation traversal cost,
  not a slow product update.
- A session create caused 900 character-row, 1,808 session-card, and 1,800 custom-item-row
  executions across its complete trace.
- A session edit and a session delete each caused 180 character-row and 360 custom-item-row
  executions even though neither dataset changed.
- A custom-item archive/delete trace similarly executed 1,440 character rows, 2,880 session cards,
  and 398 custom-item rows.

Source inspection identified a shared propagation mechanism: `ToastProvider` places both changing
toast state and stable notification actions in one context value. All 28 `useToast` consumers,
including campaign rows and dense character tabs, therefore receive every toast addition and
removal as a context update. Component memoisation alone cannot block a context update. This is a
more direct cause than merely observing that `CampaignOverview` is large.

The correction separates the stable action API from the changing display-state context. Only the
toast container subscribes to the display list; existing action consumers retain the same
`useToast()` API. After creating a session in the large campaign, counters were reset while the
success toast remained visible. Its automatic expiry 5.5 seconds later produced no recorded
component execution in the campaign overview, 90 character rows, 181 session cards, or 180
custom-item rows. A React Profiler regression test separately proves that an action-only consumer
commits once while a toast is added and expires. The small custom-gear success toast was observed,
but that tab's hidden snapshot trigger did not return data, so no render count is claimed for that
specific expiry.

## Messages and repeated optional interfaces

A 300-message thread remained bounded by its existing 100-message paging:

| Journey              | Result                                                |
| -------------------- | ----------------------------------------------------- |
| Open latest page     | 100 messages; largest initial commit 37.6 ms          |
| Load second page     | 200 messages; largest commit 52.8 ms                  |
| Load third page      | 300 messages; largest commit 75.5 ms                  |
| Empty boundary fetch | Removed the load-more control; largest commit 83.4 ms |
| Scroll 300 messages  | 14 ms to end and 10 ms to start; no React commit      |
| Close and reopen     | Reopened at 100 messages; largest commit 28.4 ms      |

Repeated campaign-thread opening and closing also returned to the route's listener baseline. No
listener accumulation was found. Message paging, scrolling, and optional-interface cleanup do not
currently justify virtualisation or a lifecycle correction.

## Armour-picker subscription correction

Opening the Armour picker in editable DM mode initially replaced the tab with `Unable to load
custom armour items.` The same failure occurred with mixed custom data and with no custom-item
documents. Read-only rendering and merely enabling edit mode succeeded; opening the picker was the
transition that enabled the category subscription.

An emulator-backed rule test proved that the exact DM query—category equality plus the existing
200-document limit—was allowed. Temporary local-only diagnostics then identified the synchronous
exception: the newly enabled subscriber received a null query and Firebase attempted to inspect
its missing delegate. The hook's effect callback could observe the previous render's disabled
closure when a subscription changed from disabled to enabled in one commit.

The hook now reads the latest empty-data and subscribe callbacks from refs when the effect runs.
The performance recorder also stores a sanitized error classification such as
`permission-denied`, `failed-precondition`, or `exception-type`, never the raw error message. No
query, index, security rule, or list limit changed.

Both target states succeeded after the correction:

| State                    | Listener result                                      | Lifecycle result                         |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------- |
| Mixed custom Armour data | Cached snapshot in 11.3 ms; custom Armour item shown | Listener stopped when the picker closed |
| No custom Armour data    | Server snapshot in 119.7 ms; zero documents          | Active listeners returned to baseline   |

The empty-custom-data picker opened in 719 ms while the dense character still displayed its
near-limit built-in Armour inventory. Its trace executed 136 picker rows and 1,440 owned Armour-row
functions. Those figures describe the surrounding dense tree; they are not evidence for changing
the already bounded query.

## Test-runner reproduction

The previously reported custom-gear delay was reproduced without changing a timeout:

| Run                                            | Result               | Vitest-reported test time |
| ---------------------------------------------- | -------------------- | ------------------------: |
| Custom gear form component, isolated           | 4 tests passed       |                    1.79 s |
| GearTab custom-gear test, isolated             | 1 passed; 11 skipped |                    5.70 s |
| Complete GearTab suite                         | 12 tests passed      |                   12.85 s |
| Three heavy suites together                    | 62 tests passed      |                   59.66 s |
| GearTab custom-gear test after the heavy group | 1 passed; 11 skipped |                    5.68 s |
| Three heavy suites after corrections           | 62 tests passed      |                   58.11 s |

The isolated custom-gear test was effectively unchanged after the heavy group. The former
over-15-second observation belongs to suite/process cost and user-event/test setup rather than a
15-second custom-form interaction. The full browser journey nevertheless has separate real React
propagation and Firestore-create failures, so making only the test query faster would conceal
product evidence.

## Implemented corrections and remaining evidence

Four narrowly scoped corrections were justified and implemented:

1. Toast actions and toast display state use separate contexts, preventing global action consumers
   from rerendering on toast addition and expiry.
2. Collapsed ranged-picker results use lightweight reference rows and defer detailed-card mounting
   until expansion.
3. Undefined-value stripping preserves Firebase field-value objects, and exact draft payload tests
   cover the browser-to-rules boundary.
4. Firestore subscription effects use the latest callback refs, and recorded listener errors expose
   only a sanitized classification.

The corrections remove the confirmed global toast propagation, the ranged picker's eager detail
construction, and both functional blockers. The dense sheet behind modal pickers still rerenders
substantial owned-inventory trees during some modal operations. This report deliberately leaves
that behavior unchanged: a new isolated measurement would be needed to justify a component
boundary without masking legitimate inventory updates.

## Alternatives considered and rejected

- Blanket debouncing was rejected. Continued typing was cheap and debouncing would add deliberate
  input latency without addressing broad result construction or context propagation.
- Blanket row memoisation was rejected. Context updates bypass it, inline callbacks can defeat it,
  and many rows legitimately change after an inventory update.
- Full list virtualisation was rejected for the first correction. It changes scrolling, focus, and
  keyboard behavior across many mature components. The ranged-picker evidence points more directly
  to eager detailed-card construction, which can be corrected without limiting results.
- Global pagination was rejected. Messages already page correctly, campaign list filters were
  responsive, and changing every picker API would be disproportionate.
- Unmounting the suspended picker while a custom form is open was rejected because it would lose
  the deliberately preserved search and scroll state.
- Reducing Firestore query limits was rejected. The product limits are existing safety ceilings;
  large fixture size is not by itself evidence that fewer records are acceptable.
- Increasing a test timeout was rejected. The isolated and post-heavy custom-gear test durations
  were stable, and the three heavy suites passed at their current limits.
- Treating the isolated browser's wall-clock times, Vite warnings, bundle size, or uncollected heap
  as proof of a defect was rejected.

## Verification

- Correction-focused application set: 14 files and 133 tests passed.
- Final Toast and ranged-card lint follow-up: 3 files and 31 tests passed.
- Final affected character-sheet and weapon set: 4 files and 70 tests passed.
- Complete fast application suite: 212 files and 2,252 tests passed.
- Three heavy Gear and Talent suites: 3 files and 62 tests passed together.
- Complete Firestore rules suite: 25 files and 241 tests passed against the local emulator.
- Startup, loading, PWA configuration, and offline-indicator group: 4 files and 18 tests passed.
- Production build completed and generated a 43-entry, 2,682.80 KiB precache.
- Lint, formatting verification, local safety checks, and diff whitespace checks passed.

No Functions source changed, so Functions tests were not repeated for these client-only
corrections. No timeout was increased. No commit or push was made.
