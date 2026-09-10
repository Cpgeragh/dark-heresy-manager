---
title: Final performance verification
date: 2026-09-10
status: Verification complete
---

# Final performance verification

## Purpose

This report consolidates the completed performance investigations and repeats the original
baseline scenarios against the final approved source. It covers delivery, startup and PWA
behaviour, authenticated routes, dense character rendering, large lists and pickers, Firestore
activity, persistence, repeated-use lifecycle behaviour, and test execution.

No deployment was performed. Authenticated browser checks used only the disposable `dh-test`
Firebase Auth, Firestore, and Functions emulators. Browser verification used an isolated in-app
browser against local services; Google Chrome and live Firebase projects were not used.

## Method and interpretation

The original baseline was recorded on 2026-09-06. Final measurements were recorded on 2026-09-10
after the approved performance changes. Production delivery figures came from three optimized
builds. Authenticated scenarios used deterministic performance fixtures and five warm reloads.
Readiness was taken from the last required first listener snapshot or the explicit startup mark,
not a fixed delay. React timings came from the application-level Profiler.

The in-app browser's isolated evaluation context did not expose paint timing entries. This report
therefore does not invent replacement first-paint, contentful-paint, or largest-contentful-paint
figures. Startup comparisons use application marks and document navigation values that the guarded
performance recorder exposes directly.

Browser-observed interaction time includes browser control, DOM and accessibility traversal, and
local worker scheduling. Emulator process startup, fixture seeding, service-worker installation,
Functions cold start, and test setup are identified separately. Single wall-clock values and heap
samples are diagnostic observations, not CI budgets.

## Before-and-after summary

| Area and measure                 |                                                 Original baseline |                                                                     Final verification | Interpretation                                                                                                                                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------: | -------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Startup JavaScript               |                     2,391.44 kB / 666.26 kB gzip in one main file | 731.51 kB / 228.50 kB gzip startup file; largest lazy chunk 945.11 kB / 249.65 kB gzip | Route and feature splitting removed most application code from initial startup without hiding the remaining large character chunk.                                                                                                                         |
| CSS                              |                                          70.82 kB / 18.59 kB gzip |                                                               58.67 kB / 11.23 kB gzip | Stable across all three final builds.                                                                                                                                                                                                                      |
| PWA precache                     |                                         21 entries / 2,759.38 KiB |                             43 unique entries / 2,688.20 KiB from the PWA build report | More split assets are cached while total cached bytes are lower. The independent inventory sum is 2,688.62 KiB because it includes the 423-byte manifest.                                                                                                  |
| Built output                     |                                        3,185,189 bytes / 34 files |                                                             2,969,224 bytes / 48 files | The higher file count is the intended result of code splitting, not additional startup work.                                                                                                                                                               |
| Production build phase           |                                     6.82–7.07 s across three runs |                                                          5.91–6.19 s across three runs | Stable local build result; not a runtime budget.                                                                                                                                                                                                           |
| Fresh optimized PWA shell        |                       Splash ready 343.8 ms median; load 407.3 ms |                             First-visit app-render mark 533.5 ms median; load 490.5 ms | The fresh-origin run used the `localhost.` loopback alias to obtain uncached origins. Its response start was 306.2–313.5 ms, so the absolute total is not directly comparable to the original host path. All five reached the application render boundary. |
| Cached optimized PWA shell       |                       Splash ready 166.8 ms median; load 211.4 ms |                                           App-render mark 86.3 ms median; load 62.0 ms | All five launches settled. The first service-worker takeover was a 321.1 ms outlier; the next four app-render marks were 73.7–98.5 ms with no progressive slowdown.                                                                                        |
| Empty signed-in dashboard        |                Ready 613.8 ms; largest commit 6.9 ms; 5 listeners |                                     Ready 688.7 ms; largest commit 4.9 ms; 5 listeners | Readiness varied while rendering and subscription ownership remained stable. No correction is justified by this local difference.                                                                                                                          |
| Small campaign                   |               Ready 720.6 ms; largest commit 20.2 ms; 9 listeners |                                    Ready 670.6 ms; largest commit 22.2 ms; 7 listeners | Listener ownership reduced while readiness remained in the same range.                                                                                                                                                                                     |
| 45-campaign dashboard            |               Ready 808.2 ms; largest commit 50.1 ms; 5 listeners |                                    Ready 767.8 ms; largest commit 34.0 ms; 5 listeners | The final five runs consistently rendered 308 DOM nodes.                                                                                                                                                                                                   |
| Near-limit character default tab | Character snapshot 658.1 ms; largest commit 309.5 ms; 7 listeners |                       Character snapshot 622.5 ms; largest commit 41.1 ms; 4 listeners | The large rendering and listener reductions are preserved. Final runs were exact at 263 DOM nodes and 9 sheet / 6 tab / 12 stat-block / 12 field executions.                                                                                               |
| Large campaign                   |            Ready 1,573.0 ms; largest commit 244.1 ms; 9 listeners |                                 Ready 1,578.8 ms; largest commit 211.9 ms; 7 listeners | Five corrected measurements waited for both Session 180 and custom item 180; all settled at 5,738 DOM nodes.                                                                                                                                               |
| 100-message drawer               |              345 ms observed; largest commit 31.9 ms; 8 listeners |                405 ms observed; largest initial commit 31.5 ms; 5 listeners while open | The browser-control time varied while React work and bounded subscription ownership remained stable.                                                                                                                                                       |
| Dense Gear navigation            |                        About 3.80 s; large commits 203 and 266 ms |                                                       3.257 s; largest commit 247.7 ms | The dense owned tree remains substantial but did not regress.                                                                                                                                                                                              |
| Dense Weapons navigation         |                        About 3.83 s; large commits 317 and 354 ms |                                                       3.260 s; largest commit 332.1 ms | The known dense owned-weapon tree remains a documented lead, not proof that virtualization is safe.                                                                                                                                                        |
| Gear picker search               |                            123 ms observed for a selective result |                                         87 ms observed for one `Auspex/Scanner` result | The corresponding selective search commit was 1.0 ms; larger commits in the trace came from opening and closing the dense parent tree.                                                                                                                     |
| Fixed-cost gear mutation         |               701 ms to rendered item; Function body about 161 ms |                           Warm acknowledgement 376.7 ms; server snapshot 54.6 ms later | The first local call took 3.43 s because it included Functions cold start and is excluded from steady-state latency. Both operations produced one mutation pair and one server-current snapshot.                                                           |
| Older message pages              |             48.5 ms second-page commit; 75.6 ms third-page commit |                                  55.0 ms second-page commit; 73.9 ms third-page commit | The 100-message page boundary remains stable. Browser control observed 535 and 425 ms respectively.                                                                                                                                                        |
| Fully offline cached campaign    |                              5/5; 4,355 ms median, 4,334–4,437 ms |                                             5/5; 4,738.9 ms median, 4,727.2–4,763.8 ms | Every required snapshot came from cache and every run returned to 376 DOM nodes and 7 listeners. The result is close to the later startup investigation's roughly 4.58 s local route result and does not show progressive degradation or data loss.        |
| Fast application tests           |     212 files / 2,265 tests; 112.6 s before the environment split |                                             213 files / 2,268 tests; 96.31 and 96.39 s | The extra file and three tests are the generated-build inventory checks. Coverage remains complete.                                                                                                                                                        |
| Heavy application tests          |                                        3 files / 63 tests; 64.1 s |                                                  3 files / 63 tests; 64.23 and 63.73 s | The meaningful integration boundary remains stable.                                                                                                                                                                                                        |
| Firestore rules                  |                                      25 files / 241 tests; 74.9 s |                                                          25 files / 241 tests; 76.56 s | File isolation remains enabled because the faster shared-state candidate previously produced real data pollution.                                                                                                                                          |
| Functions unit / emulator        |                  434 tests in 4.9 s; 92 emulator tests in 197.0 s |                                     434 tests in 5.85 s; 92 emulator tests in 197.14 s | Local runtime and emulator overhead are stable; the Node 22/24 host warning did not cause a failure.                                                                                                                                                       |

## Render-count and lifecycle evidence

The dedicated rendering investigation remains the strongest deterministic before-and-after
evidence. A near-limit Characteristics load fell from 120 stat blocks and 120 fields to 18 of each,
with the largest commit falling from 280.5 ms to a 49.1 ms median. A warm Skills switch fell from
1,452 row executions and a 1,499.8 ms commit to 366 rows and 2.9 ms. A warm Psychic Powers switch
fell from 2,160 cards to 720, with a 2.7 ms largest commit. The final default-tab reloads retained a
similarly bounded component pattern and a 41.1 ms median largest commit.

Repeated-use checks did not find an accumulating interface owner. Route cycles returned to exact
subscription and DOM baselines. Twenty-one large-picker closes returned to 10,697 DOM nodes and 4
listeners. Sixteen character-message closes returned to the same state. Campaign messages,
sessions, portrait cancellation, and service-worker updates also returned to stable structural
counts. Later-cycle heap floors stabilized or fell after warm-up; that behaviour is retained cache,
not repeatable leak evidence.

## Firestore and persistence evidence

Final route listener counts preserve the subscription corrections: Dashboard 5, small and large
campaigns 7, character 4, and an open character message drawer 5. Picker-specific subscriptions
still start only while their owner is open and stop on close.

The save investigation established deterministic operation counts and completion signals:

- a Character Name typing burst now uses one 600 ms debounced protected operation instead of one
  request per keystroke;
- blur and unmount flush the final dirty text once without a later duplicate;
- compatible inventory and ammunition deltas coalesce for 300 ms and apply transactionally, so a
  two-click burst uses one six-write protected operation instead of two operations and twelve
  physical writes;
- rank-up now uses one atomic seven-write protected operation instead of two operations and
  thirteen writes;
- message drafts clear only when their Firestore batch acknowledges success; and
- independent audit and usage records run concurrently only after the protected outcome is known.

Two-tab emulator and browser checks converged without a lost delta. An offline direct-Firestore
message remained pending until reconnection, then appeared exactly once and cleared its draft.
Callable mutations remain intentionally online-only and report failure for explicit retry.

## Stable automated regression check

`scripts/checkBuiltPwaInventory.mjs` inspects the generated `dist` directory rather than source
configuration. It verifies that:

- generated precache URLs are unique and refer to emitted files;
- every emitted cache-eligible JavaScript, CSS, HTML, icon, image, WebP, WOFF2, and web manifest is
  precached, excluding the service worker and its imported Workbox runtime;
- both icons and both startup artwork files exist and are cached;
- no Roboto asset or performance-only revision marker is present; and
- no cache-eligible asset exceeds the existing 2 MiB Workbox boundary.

The checker reports inventory counts and bytes but deliberately does not enforce exact hashes,
file counts, totals, or wall-clock budgets. It runs in local deployment verification and immediately
after the hosting predeploy build. Its three focused tests cover a valid generated build, a missing
eligible asset, and duplicate/forbidden production metadata.

The final build passed with 43 unique precache entries, 43 eligible files, 48 emitted files, and an
independently summed 2,688.62 KiB precache inventory.

## Findings that did not justify more runtime changes

- The existing large-chunk advisory is an inventory lead, not evidence of a user-observable defect.
  The largest character chunk is loaded on demand and its dense paths have separate render evidence.
- Dense Gear, Weapons, Talents, and picker open/close paths still rebuild large owned trees. Their
  focused results are stable, while virtualization would change scrolling, focus, and accessibility
  behaviour and lacks evidence strong enough to justify that risk.
- The first local Functions call was much slower than the warm call. The difference was emulator
  cold start, not a persistent save-state delay.
- Fresh-origin PWA totals included about 309 ms before the loopback response began. That host-alias
  and browser-tab setup cost prevents treating the absolute cold total as a product regression.
- Two fresh PWA origins delayed account synchronization when several simultaneous tabs exhausted
  the browser's shared connection capacity. Their shell marks remained valid; their authenticated
  settling was discarded. Sequential cached launches and authenticated scenarios completed.
- The offline route was a few hundred milliseconds slower than the original baseline but remained
  tightly clustered, cache-only, complete, and close to the later startup-specific result.
- Heap samples rose before garbage collection in some dense journeys, but later floors and exact
  DOM/listener counts stabilized. No repeatable leak signature was found.
- Firestore rules can run much faster without per-file isolation, but the candidate produced a real
  cross-test state-pollution failure and remains rejected.

No additional runtime change is justified by these findings.

## Manual regression coverage

The manual checklist now includes two repeatable, user-observable checks:

- launch an already-cached installed app five times and confirm that every launch leaves the splash,
  restores its route, and shows no progressive slowdown or stuck update state; and
- repeat Dashboard to Campaign to dense Character to large picker five times, confirming responsive
  search, correct restoration on close, and no retained stale modal, selection, or route state.

Existing manual coverage already addresses update interruption, full offline recovery, two-tab
synchronization, debounce/blur behaviour, messages, and bounded product limits; those checks were
not duplicated.

## Final verification

The following completed successfully against the final source:

- three production TypeScript, Vite, and PWA builds plus generated-inventory verification;
- two complete fast application runs: 213 files and 2,268 tests each;
- two complete heavy application runs: 3 files and 63 tests each;
- the complete Firestore rules suite: 25 files and 241 tests on `dh-test`;
- the complete Functions unit suite: 38 files and 434 tests;
- the complete Functions emulator integration suite: 24 files and 92 tests on `dh-test`; and
- the isolated local browser scenarios recorded above.

Formatting, lint, safety, secret-name, lockfile, and whitespace checks also passed. No arbitrary
test timeout was increased, and no commit, push, live-project access, or deployment was performed.

## Conclusion

The final source preserves the demonstrated reductions in startup code, Firestore listener
ownership, character render propagation, picker result construction, duplicate persistence work,
and fast-suite setup. Repeated routes, optional interfaces, cached launches, and offline restarts
return to stable structural states. Remaining large dense-tree costs, emulator cold starts, and
environment-dependent wall-clock variation are documented leads rather than evidence for another
correction.
