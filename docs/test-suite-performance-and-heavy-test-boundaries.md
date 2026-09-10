# Test-suite performance and heavy-test boundaries

**Measured:** 2026-09-10  
**Environment:** Windows, 16 logical processors, 32 GiB memory, root Vitest 4.1.8 and Functions Vitest 4.1.11  
**Scope:** Application fast and heavy tests, Firestore rules tests, Functions unit tests, and Functions emulator integration tests

## Purpose

This report separates test-runner and emulator overhead from application runtime performance. It
records which suites are intrinsically expensive, which setup can safely be avoided, and which
test boundaries should remain unchanged because they provide meaningful integration coverage.

The measurements are local observations rather than permanent timing thresholds. Durations vary
with machine load, worker scheduling, filesystem caching, and emulator startup. File size, a single
slow result, or a cold emulator request is not treated as proof of a defect.

## Baseline

| Suite                          | Files | Tests | Vitest report span |           Outer command |
| ------------------------------ | ----: | ----: | -----------------: | ----------------------: |
| Fast application suite         |   212 | 2,265 |            112.6 s | Not separately recorded |
| Heavy UI suite                 |     3 |    63 |             64.1 s | Not separately recorded |
| Firestore rules                |    25 |   241 |             74.9 s |                  84.5 s |
| Functions unit                 |    38 |   434 |              4.9 s | Not separately recorded |
| Functions emulator integration |    24 |    92 |            197.0 s |                 214.7 s |

The outer Firestore and Functions measurements include Firebase emulator process startup and
shutdown. The Vitest spans include test discovery, transforms, environment creation, hooks, and
worker scheduling in addition to test assertions.

## Fast application suite

The original fast configuration gave every file a `jsdom` environment. Its most expensive files
were `PsychicTab` (15.0 s), `CustomPieceForm` (12.3 s), `WeaponsTab` (10.9 s), `BackgroundTab`
(10.6 s), `SkillsTab` (10.1 s), and `ExperienceTab` (9.6 s). Slow individual cases were dominated
by complete form entry and real picker interactions, including a 4.6 s custom-ranged-weapon form
case and a 3.7 s read-only armour-picker case.

Those files completed earlier when run alone, confirming worker contention, but reducing the pool
from eight workers to four increased the complete run from 112.6 s to 158.7 s. The existing 50%
worker cap therefore provides better feedback latency on the measured machine.

Static inspection followed by an actual Node-environment run divided the suite into three exact
sets:

| Environment boundary                | Files | Tests | Diagnostic span |
| ----------------------------------- | ----: | ----: | --------------: |
| Node-safe unit tests                |    65 | 1,015 |           4.4 s |
| Browser-dependent unit tests        |    32 |   241 |          10.7 s |
| Non-heavy browser integration tests |   115 | 1,009 |          78.9 s |

The three diagnostic runs cover the same 212 files and 2,265 tests as the original fast suite.
Their sequential total was 94.0 s, 16.5% below the original run. The production fast configuration
therefore uses named Node and jsdom projects in one Vitest invocation. Browser-dependent unit tests
are an explicit exception list; new unit tests default to Node so undeclared browser dependencies
fail visibly.

## Heavy UI suites

The heavy group completed in 64.1 s: `TalentsTab` used 38.2 s, `GearTab` 11.6 s, and the talent
overflow flows 7.1 s of assertion time. Each file produced essentially the same duration alone.
A fixed-seed shuffled run passed all 63 tests in 64.4 s, and representative Gear and overflow
cases remained stable when run after the rest of the heavy group.

The slow paths exercise complete acquisition flows, large real reference lists, custom-item form
creation, error handling, and off-career talent overflow. Moving more tests into this group would
only relocate work, while splitting or replacing these interactions with shallow events would
weaken their coverage. The existing heavy boundary remains unchanged.

## Firestore rules

The original serial rules run creates a new isolated module graph for every file. That also
recreates the module-scoped rules test environment in `tests/firestore/setup.ts`. A candidate that
disabled file isolation while retaining serial execution reduced the Vitest span from 74.9 s to
approximately 25 s and the outer emulator command from 84.5 s to approximately 31 s.

The candidate passed seven complete runs, including several fixed-seed shuffled orders, but failed
during the later complete validation run. The first batch-operations test attempted to create
campaign IDs `c1`, `c2`, and `c3`; the emulator evaluated them as existing-document updates and
correctly denied the operation. The same run had started a fresh emulator. This is evidence that
reusing the module graph and its Firestore clients does not provide a sufficiently deterministic
empty-state boundary, even when `clearFirestore()` is awaited after tests.

The cold first-request cost moved to whichever file ran first, so that portion is emulator and
environment startup overhead rather than a character-rules performance defect. However, speed
does not justify accepting intermittent data pollution. The candidate was reverted and the rules
configuration retains both `fileParallelism: false` and Vitest's default file isolation.

## Functions tests

Functions unit tests completed 434 cases in 4.9 s. The slowest unit file contains intentional real
minimum-duration checks of approximately 100 ms and 60 ms. Fake timers would stop those tests from
verifying wall-clock safety and are not appropriate.

The emulator integration group completed in 214.7 s externally, of which about 17.7 s was emulator
and process overhead. Its longest cases exercise chunked character deletion (18.1 s), account
deletion (14.9 s), campaign deletion (11.1 s), concurrent numeric adjustment (9.1 s), identity
reclaim (9.0 s), and custom-item mutation (8.8 s). Character deletion was effectively identical
alone and in the group. These are genuine callable, transaction, authorisation, and cleanup paths;
sharing mutable authentication/application setup or replacing them with unit-level assertions is
not justified.

The local emulator reported that the Functions package requests Node 22 while the host used Node 24. This environmental warning is not evidence of product latency and did not cause a test failure.

## Decisions and rejected alternatives

- Keep the fast suite at the 50% worker cap; four workers materially worsened total duration.
- Run browser-free unit tests under Node and retain jsdom only where browser APIs or rendering are
  required.
- Retain Firestore rules file isolation. Shared module state was substantially faster but produced
  one real cross-test data-pollution failure during complete validation.
- Keep Gear, talent, Functions integration, concurrency, deletion, and rules-limit scenarios at
  their present coverage depth.
- Do not shorten meaningful input values, replace complete `userEvent` sequences with shallow
  events, add artificial emulator warmups, use fake timers for wall-clock guarantees, or increase
  timeouts merely to improve reported duration.
- No repeatable state leak or fake-timer incompatibility was found.

## Verification standard

Changes to these boundaries should be checked with repeated runs of the affected project, followed
by the complete containing group. Complete validation includes the fast and heavy application
groups, Firestore rules, Functions unit and emulator groups, the production build, lint,
formatting, repository safety checks, and a whitespace check. Firebase tests must use only the
local `dh-test` emulators.

## Change verification

The environment split preserved the exact fast-suite boundary:

- The `node-unit` project passed 65 files and 1,015 tests in 3.9 s.
- The `jsdom-app` project passed 147 files and 1,250 tests in 88.2 s.
- Three complete fast runs each passed all 212 files and 2,265 tests in 92.7 s, 97.9 s, and 96.0 s.

The complete runs were consistently below the 112.6 s baseline, with no test moved out of the
combined fast suite.

Three initial normal Firestore candidate runs passed in 24.0–26.0 seconds, and fixed-seed shuffled
runs also passed in 24.0–25.4 seconds. The subsequent complete validation run failed one of the 241
tests because campaign documents from another context remained observable. The candidate was
therefore rejected despite its large timing improvement. A command-line-only diagnostic invocation
also stopped before test discovery because it used an obsolete seed flag; it had no bearing on the
test result.

After restoring file isolation, the complete Firestore rules suite passed all 25 files and 241
tests in 74.9 s. The remaining complete groups also passed:

- Heavy UI: 3 files and 63 tests in 64.3 s.
- Functions unit: 38 files and 434 tests in 5.4 s.
- Functions emulator integration: 24 files and 92 tests in 196.4 s, excluding outer emulator
  startup and shutdown.

The changed-test command resolved both named projects and exited successfully with no affected test
files, as expected for configuration and documentation changes. Vitest UI-mode discovery also
resolved both projects with automatic browser opening disabled; no browser was opened. The
production build, lint, repository-wide formatting check, focused formatting check for this report
and the configurations, local safety checks, and whitespace check all passed. The production build
continued to print its existing generic large-chunk advisory; file size alone is not treated as a
runtime defect.
