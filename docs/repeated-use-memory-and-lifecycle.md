---
title: Repeated-use memory and lifecycle performance
date: 2026-09-10
status: Investigation complete; no correction required
---

# Repeated-use memory and lifecycle performance

## Purpose

This report records controlled repeated-use checks for performance that could degrade during a
single application session. It covers route changes, message interfaces, campaign administration,
large pickers, portrait selection, and service-worker updates. The investigation required
repeatable upward growth before treating retained memory as a defect.

No live Firebase project was contacted. Authenticated journeys used the disposable `dh-test`
Firebase Auth, Firestore, and Functions emulators on `127.0.0.1`. Browser checks used an isolated
in-app browser against local services only.

## Method and interpretation

Each journey received a warm-up before its measured cycles where the interface loaded substantial
code or reference data. Measurements were taken after the interface had opened and after it had
closed or the route had settled. The following signals were compared:

- total DOM nodes;
- active Firestore subscriptions from the performance recorder;
- JavaScript heap size where the browser exposed it; and
- event-listener, timer, animation-frame, and asynchronous-resource cleanup in source and focused
  lifecycle tests.

The browser-control context could not safely replace global timer or event-listener functions in
the application page. Those resources were therefore checked through explicit source pairing and
existing tests. Adding global monkey-patches solely for this investigation was rejected because it
would alter the lifecycle being measured.

Heap readings are samples, not a complete retained-object graph. A rising value before garbage
collection is not by itself evidence of a leak. A correction would require repeatable growth in
later-cycle floors, failure to return to stable DOM or subscription counts, or retained resources
with an unpaired lifecycle.

Browser automation time, file-chooser time, React development behavior, emulator cold start,
fixture seeding, PWA build time, and service-worker installation time were excluded from product
memory conclusions. One route-loop automation call exceeded its control deadline and was
discarded; the same journey was rerun in smaller complete groups.

## Repeated journey results

| Journey                                   |         Measured cycles | Stable closed or settled state                                                                                | Heap interpretation                                                                                                  |
| ----------------------------------------- | ----------------------: | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Campaign message thread                   |                       6 | 371 DOM nodes and 7 subscriptions; open state was 499 nodes and 8 subscriptions                               | Closed samples ranged from about 19.45 to 23.37 MB and ended below the first measured sample                         |
| Campaign session form                     |                       6 | 371 DOM nodes and 7 subscriptions; open state was 399 nodes with the same subscription count                  | Closed samples ranged from about 19.77 to 22.37 MB without upward progression                                        |
| Dashboard, campaign, and character routes | 4 complete route cycles | Dashboard: 90 nodes and 5 subscriptions; campaign: 371 and 7; character: 421 and 4                            | Samples fluctuated between about 30.6 and 35.4 MB and finished near the low end                                      |
| Large ranged-weapon picker                |                      21 | Every close returned to 10,697 DOM nodes and 4 subscriptions; open state was 13,362 nodes                     | Garbage collection produced later-cycle floors of about 79.0, 81.9, and 80.6 MB, showing stabilisation after warm-up |
| Character message drawer                  |                      16 | Every close returned to 10,697 DOM nodes and 4 subscriptions; open state was 10,702 nodes and 5 subscriptions | Samples fluctuated through roughly 60 to 81 MB and repeatedly returned to about 61 to 66 MB                          |
| Portrait crop and cancel                  |         3 after warm-up | Every cancel returned to 207 DOM nodes and 6 subscriptions; crop state was 225 nodes                          | Closed samples were 35.15, 35.71, 36.38, and 35.52 MB, including the final fall                                      |
| Controlled PWA no-update reload           |                       5 | Every load settled at 376 DOM nodes and 7 subscriptions                                                       | Samples ranged from about 13.3 to 18.0 MB and ended below the first sample                                           |
| Real service-worker revision transition   |                       3 | Every transition showed the updating screen, reloaded, and settled at 376 nodes and 7 subscriptions           | Post-update samples were about 21.9, 21.5, and 16.0 MB                                                               |

The PWA test used two locally built guarded revisions. The local request log confirmed that each
revision transition requested `sw.js`, the Workbox import, and the changed one-byte performance
revision asset. The visible update and automatic reload therefore represented a real
service-worker update rather than an inference from elapsed time.

The portrait journey selected the existing local `public/icon-192.png`, opened the crop interface,
and cancelled it. It did not press Save and did not perform a Storage upload.

## Subscription and interface cleanup

The repeated browser counts agree with the implemented ownership boundaries:

- `useFirestoreSubscription` stops its current listener on source replacement and unmount.
- Character message threads exist only while the message drawer is open, and DM thread detail
  exists only while that thread is expanded.
- Picker and modal content unmounts on close. Modal body-scroll ownership is reference-counted and
  released, and dialog and viewport listeners are removed.
- Route-owned campaign and character subscriptions stop when navigation replaces their owner.
- The portrait preview is component state. The workflow uses a data URL rather than retaining an
  object URL that would require explicit revocation.

No measured journey accumulated a Firestore subscription or left additional DOM nodes after its
owner closed.

## Event handlers, timers, and asynchronous resources

Source inspection found paired installation and cleanup for the repeated-use paths:

- drawer and header escape/outside handlers;
- modal resize and visual-viewport resize/scroll handlers;
- online and offline handlers;
- media-query change handlers;
- character-sheet `popstate` and scroll handlers;
- swipe and characteristics touch handlers;
- characteristics animation frames; and
- toast timers, which are removed individually and cleared when the provider unmounts.

Portrait decoding creates short-lived `FileReader` and `Image` instances whose handlers complete
with the read or decode operation. Neither resource is held by a global collection.

Two bounded timers do not provide leak evidence:

- swipe transitions schedule a 180 ms return to the idle state; and
- PWA startup schedules safety callbacks, including the three-second registration fallback and
  the guarded stalled-update fallback. Startup runs once per page bootstrap, and its settled guard
  prevents a late callback from rendering the application twice. The no-update runs recorded one
  late safety mark per new page, not an increasing number within a page.

Changing these timers without repeatable retention would alter working behavior without addressing
an observed degradation.

## Retained cache versus leak assessment

The large picker loaded a large character tree, reference-data modules, Firestore data, and browser
rendering structures. Its early heap samples rose until garbage collection ran. Later collection
floors clustered near 79 to 82 MB while the DOM and subscription baselines remained exact through
21 closes. This is the expected signature of warmed reusable data and browser allocation, not an
unbounded retained interface.

The performance recorder also intentionally bounds its metadata history to 2,000 events. Event
history can therefore grow during a long measurement session, but it cannot grow without limit and
is absent from normal production builds.

No journey produced the repeatable later-cycle upward growth required for a correction.

## Alternatives considered

- **Clear reference and browser caches after each close:** rejected. The measured allocation
  stabilised and is reusable; discarding it would add repeated loading and computation.
- **Instrument every global timer and event listener:** rejected for this investigation. Such
  monkey-patching would change the measured environment, while source ownership and focused tests
  already expose the relevant lifecycle.
- **Treat the highest heap sample as retained memory:** rejected. Later garbage collections reduced
  the heap and stable structural counts contradicted an accumulating interface.
- **Force garbage collection between every action:** rejected. The isolated browser did not expose
  a reliable production-equivalent forced-GC control, and forcing collection would make the journey
  less representative.
- **Change the bounded swipe or PWA timers:** rejected. They expire or are limited to one bootstrap,
  and no repeated-use growth was observed.
- **Repeat earlier picker rendering corrections:** rejected. Picker rendering was addressed in the
  dedicated large-list investigation; this work examined lifecycle stability only.

## Verification

The focused lifecycle run passed 126 tests across 12 files. It covered Firestore subscription
replacement and unmount, campaign subscription ownership, media-query cleanup, PWA startup states,
portrait handling, picker and modal behavior, drawers, message threads, toast cleanup, application
header behavior, character navigation, and campaign administration.

The repeated local browser measurements above then exercised the integrated application with real
emulator listeners and real guarded service workers. No arbitrary timeout was added or increased.

Final verification also passed:

- the complete fast application suite: 212 files and 2,265 tests;
- the three resource-intensive character-sheet files: 63 tests;
- the TypeScript and production Vite/PWA build, producing 43 production precache entries;
- ESLint and Prettier checks, including this report; and
- local safety, secret-name, lockfile, whitespace, and scope-diff checks.

## Conclusion

Repeated use of the measured routes and interfaces returns to stable DOM and subscription
baselines. Browser heap samples fluctuate and, after warm-up, stabilise or fall. Source and test
evidence show bounded timers and paired cleanup for the relevant event handlers and asynchronous
resources.

No runtime cleanup or cache invalidation is justified by the evidence. Future correction should be
considered only if the same controlled journey demonstrates repeatable upward growth after warm-up
and identifies the retained owner.
