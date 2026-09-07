# Performance baseline

Measured: 6 September 2026

This baseline was recorded on the local development machine against the disposable `dh-test`
Firebase emulators. It is a reference point for subsequent performance investigations, not a set
of pass/fail budgets.

## Method

- Production bundle and PWA figures came from optimized Vite builds.
- Authenticated journeys used Vite's explicit `performance` mode and deterministic emulator data.
- Warm journey figures are the median of five full reloads on the same route.
- “Ready” means the last required Firestore listener produced the data needed for the named screen,
  not an arbitrary delay.
- React figures come from the application-level React Profiler.
- Browser-observed interaction times include UI animation and browser-control overhead; React
  commit durations are the cleaner diagnostic signal.
- JavaScript heap readings rose across development-server reloads without forced garbage
  collection. They are retained in the raw recorder but are not treated as evidence of a leak.

True clean-storage authenticated cold runs were not manufactured by deleting browser data. The
existing production-shell cold measurements are reported separately, and authenticated data
comparisons use stable warm runs. Backend-offline restart is verified separately after installing
the performance PWA.

## Delivery baseline

| Measure                 |                     Baseline |
| ----------------------- | ---------------------------: |
| Main JavaScript         | 2,391.44 kB (666.26 kB gzip) |
| CSS                     |     70.82 kB (18.59 kB gzip) |
| PWA precache            |    21 entries / 2,759.38 KiB |
| Built output            |   3,185,189 bytes / 34 files |
| Transformed modules     |                          412 |
| Build phase, three runs |                  6.82–7.07 s |

The performance-infrastructure production build transformed 413 modules and produced a 2,391.54
kB main bundle (666.31 kB gzip), a 0.10 kB / 0.004% difference. It contained none of the emulator
hosts, `dh-test`, fixture values, or performance recorder names. The separate performance build did
contain those expected local-only markers.

## Production-shell cold and warm baseline

Five cold and five warm runs of the backend-blocked optimized shell produced:

| Signal                   |    Cold median (range) |    Warm median (range) |
| ------------------------ | ---------------------: | ---------------------: |
| Splash ready             | 343.8 ms (332.5–363.0) | 166.8 ms (152.7–188.8) |
| First paint              |       380 ms (360–396) |       192 ms (176–196) |
| First contentful paint   |       392 ms (380–408) |       212 ms (196–232) |
| Largest contentful paint |       408 ms (392–428) |       224 ms (212–240) |
| Document load            | 407.3 ms (389.2–412.9) | 211.4 ms (197.9–235.4) |
| Longest main-thread task |    about 87 ms (87–97) |    about 88 ms (86–92) |

The repeated long task is a lead for bundle parsing/evaluation investigation; it is not yet an
attributed defect.

## Authenticated warm journeys

| Journey                      |                Ready median | Largest React commit median | Active listeners |
| ---------------------------- | --------------------------: | --------------------------: | ---------------: |
| Empty signed-in dashboard    |                    613.8 ms |                      6.9 ms |                5 |
| Small campaign               |                    720.6 ms |                     20.2 ms |                9 |
| 45-campaign dashboard        |                    808.2 ms |                     50.1 ms |                5 |
| Large character, default tab | 658.1 ms character snapshot |                    309.5 ms |                7 |
| Large DM campaign            |                  1,573.0 ms |                    244.1 ms |                9 |
| 100-message drawer           |          345 ms interaction |                     31.9 ms |                8 |

The large DM route loaded 90 characters, 180 sessions, 180 custom items and 90 thread summaries.
Its focused listener times on the first stable load were approximately 410 ms, 313 ms, 429 ms and
197 ms respectively.

## Focused load-bearing interactions

| Interaction                                         |   Browser-observed time | React detail                                                     |
| --------------------------------------------------- | ----------------------: | ---------------------------------------------------------------- |
| Large character → Gear (180 gear + 180 consumables) |            about 3.80 s | large commits of 203 ms and 266 ms                               |
| Large character → Weapons (180 ranged + 180 melee)  |            about 3.83 s | large commits of 317 ms and 354 ms                               |
| Open ordinary gear picker                           |                  392 ms | picker reference list included in render                         |
| Search ordinary gear picker                         |                  123 ms | filtered to one reference result                                 |
| Add ordinary gear through callable Function         | 701 ms to rendered item | authenticated Function body about 161 ms; one character snapshot |
| Load first older message page (200 shown)           |                  340 ms | final commit 48.5 ms                                             |
| Load second older message page (300 shown)          |                  391 ms | final commit 75.6 ms                                             |

## Offline restart

After the optimized performance PWA and small fixture had loaded twice, the app server and all
three Firebase emulators were stopped. The same campaign route still restored its application
shell, account and complete cached campaign on five out of five reloads.

Median readiness was 4,355 ms (range 4,334–4,437 ms). The reliability result is positive, while the
consistent delay is a concrete lead for the later startup/PWA investigation.

These results establish investigation leads for the later bundle, character-sheet, list and write
batches. They do not by themselves prescribe virtualization, memoization, code splitting or any
other specific implementation.

## Test execution baseline

| Group                        |                                  Result |
| ---------------------------- | --------------------------------------: |
| Representative journey group | 69 tests; 5.66–5.94 s across three runs |
| Heavy Gear/Talent group      | 61 tests; 66.79–67.91 s across two runs |
| GearTab isolated             |           16.38 s total / 12.96 s tests |
| TalentsTab isolated          |           41.71 s total / 38.30 s tests |
| Talent overflow isolated     |            11.31 s total / 8.08 s tests |

The isolated totals and grouped totals are similar, so there is no current evidence that grouping is
the cause of the slow heavy tests. No timeout increase is justified by this baseline.
