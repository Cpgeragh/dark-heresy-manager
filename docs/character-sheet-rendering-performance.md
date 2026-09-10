# Character-sheet rendering performance

Status: Completed  
Measured: 8 September 2026

This report records the character-sheet rendering investigation and the narrowly targeted changes
that followed it. Measurements used the deterministic `dh-test` Firebase emulators and the
application's local `performance` mode. No live Firebase project was contacted.

The principal confirmed costs were not harmless parent rerenders. Three tabs mounted both their
desktop and mobile trees, skill effects were rebuilt separately for every row, characteristic
modifier data was repeatedly rescanned, and generic mutation callbacks changed identity whenever
the character snapshot changed. Correcting those boundaries substantially reduced exact component
render counts. It did not materially change initial data readiness, which shows that initial
loading remains dominated by work outside these corrected React render paths.

## Method and interpretation

- A performance-mode-only counter records component function executions. The counts are exact for
  each named trace, including React development-mode behaviour; they are not production analytics.
- React Profiler commit durations identify where React spent time. Browser-control settling time is
  excluded from the commit figures.
- Initial-load results use repeated runs where noted. Most interaction timings are single diagnostic
  traces, so counts and attributed causes carry more weight than an isolated duration.
- The near-limit fixture contains 180 entries in each dense collection. Its corrected rank and
  valid ranged-weapon/ammunition relationship make the measured journeys deterministic.
- Desktop measurements used the isolated in-app browser at a 1280-pixel viewport. Responsive
  behaviour was also covered by tests that explicitly switch the media-query result.
- The instrumentation did not force garbage collection and no arbitrary test timeout was raised.

## Confirmed changes

### One responsive tree per tab

Characteristics, Skills and Psychic Powers previously rendered desktop and mobile markup
simultaneously and hid one tree with CSS. A shared, tested media-query hook now mounts only the
layout that can be displayed. This removes duplicate field, row and card work while retaining a
responsive update when the query result changes.

### Stable characteristic derivation

Characteristic modifier totals and source descriptions now come from one memoised breakdown.
Unnatural-characteristic contributions are indexed once, rather than repeatedly scanning talent,
trait and equipment sources for each displayed characteristic.

### Batched skill-effect derivation

The skills tab now constructs the active talent, trait and career context once and computes all
skill effects in one pass. It no longer rebuilds the same source sets independently for every
skill row.

### Stable mutation and tab boundaries

Generic character update and patch callbacks now depend on character availability rather than the
entire changing character object. The expensive top-level Characteristics, Skills, Talents,
Weapons, Armour, Gear, Cybernetics and Psychic tabs have memoised boundaries, with stable empty
array fallbacks where optional data is absent. Memoisation was limited to these measured boundaries.

## Before-and-after evidence

Render-count labels below are abbreviated only to keep the table readable. Counts are component
function executions in one trace.

| Journey                                  | Before                                      | After                                    | React timing evidence                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Near-limit initial load, Characteristics | sheet 16; tab 10; stat block 120; field 120 | sheet 17; tab 2; stat block 18; field 18 | Ready time was effectively unchanged: 777.3 ms before and 774.3 ms median after. Largest commit fell from 280.5 ms to a 49.1 ms median after.                                      |
| Switch to Characteristics                | sheet 4; tab 4; stat block 48; field 48     | sheet 4; tab 2; stat block 18; field 18  | Largest commit: 279.9 ms before, 2.3 ms after.                                                                                                                                     |
| Switch to Skills                         | sheet 4; tab 4; skill row 1,452             | sheet 4; tab 2; skill row 366            | Largest commit: 1,499.8 ms before, 2.9 ms after.                                                                                                                                   |
| Switch to Psychic Powers                 | sheet 6; tab 4; grid 12; power card 2,160   | sheet 4; tab 2; grid 4; power card 720   | A warm trace fell from 245.5 ms plus 50.7 ms to a 2.7 ms largest commit. A separate cold-after-change trace still reached 231.4 ms, so first construction remains a real cost.     |
| Change a characteristic                  | sheet 4; tab 4; stat block 48; field 52     | sheet 10; tab 2; stat block 18; field 22 | Largest commit: 275.7 ms before, 42.8 ms after. The sheet's own count rose because this journey includes the complete update propagation, but the expensive child tree contracted. |

The repeated initial runs were:

| Fixture                |      Ready or last-required-commit result |        Largest commit |
| ---------------------- | ----------------------------------------: | --------------------: |
| Small, three runs      | 893.3 / 645.8 / 762.7 ms; median 762.7 ms | 28.7 / 30.4 / 24.4 ms |
| Near-limit, three runs | 816.4 / 725.3 / 774.3 ms; median 774.3 ms | 49.2 / 47.4 / 49.1 ms |

Initial readiness varies independently of the corrected render work. The stable near-limit commit
distribution and exact count reduction are the useful evidence; the individual readiness values
are not treated as a regression or improvement.

## Update propagation after correction

| Update                                    | Exact relevant render counts                                                              |                                   React commits |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------: |
| Wounds                                    | sheet 4; vitals 4                                                                         |       2 commits; 23.5 ms total; 11.9 ms largest |
| Fatigue                                   | sheet 8; vitals 8                                                                         |       4 commits; 76.3 ms total; 27.8 ms largest |
| Characteristic                            | sheet 10; Characteristics 2; stat block 18; field 22                                      | 6 commits; about 69.8 ms total; 42.8 ms largest |
| Ammunition rounds                         | sheet 10; Weapons 2; ranged rows 360; ammunition rows 2; melee rows 360; grenade rows 720 |     5 commits; 246.5 ms total; 237.3 ms largest |
| Equipment toggle                          | sheet 8; Weapons 2; ranged rows 362; ammunition rows 2; melee rows 360; grenade rows 720  |     4 commits; 209.8 ms total; 196.5 ms largest |
| Grenade quantity                          | sheet 10; Weapons 2; ranged rows 360; melee rows 360; grenade rows 720                    |     5 commits; 280.7 ms total; 273.4 ms largest |
| Talent removal                            | sheet 8; Talents 4; card groups 4; talent cards 718                                       |     6 commits; 207.8 ms total; 198.2 ms largest |
| Talent acquisition, including picker flow | sheet 12; Talents 4; card groups 12; talent cards 2,158                                   |     9 commits; 643.4 ms total; 225.6 ms largest |
| XP award                                  | sheet 10; Experience 10                                                                   |       8 commits; 77.0 ms total; 31.3 ms largest |

The full talent-acquisition flow is not compared numerically with the earlier partial trace because
the earlier trace included unrelated settling work. Weapons, Gear and Talents still produce broad
row propagation for near-limit data. Those traces are retained as leads, not proof that further
complexity is warranted.

Post-correction top-level tab traces also showed:

| Tab         | Relevant render counts                                    | Largest commit |
| ----------- | --------------------------------------------------------- | -------------: |
| Talents     | tab 4; card groups 8; talent cards 1,440                  |       235.4 ms |
| Weapons     | tab 4; ranged 720; ammunition 4; melee 720; grenade 1,440 |       300.6 ms |
| Armour      | tab 2; rows 720                                           |         1.7 ms |
| Gear        | tab 4; gear rows 720; consumable rows 720                 |       203.7 ms |
| Cybernetics | tab 2; implant rows 720                                   |       206.7 ms |
| Corruption  | tab 4                                                     |         7.7 ms |
| Insanity    | tab 4                                                     |         8.2 ms |
| Experience  | tab 4                                                     |         6.6 ms |

These single timings vary with first construction, garbage collection and browser state. In
particular, the low Armour duration does not imply that 720 executions are intrinsically free, and
the higher dense-tab values do not alone justify virtualisation.

## Alternatives considered

- Blanket memoisation was rejected. It would add comparison and maintenance cost to inexpensive
  components without evidence of a user-visible benefit.
- Custom comparison functions on every row were rejected. Many rows receive legitimately changing
  objects and callbacks; a bespoke comparator risks stale behaviour and needs stronger repeated
  evidence than these traces provide.
- List virtualisation was rejected for now. It changes scrolling, focus and accessibility behaviour,
  and the current evidence does not isolate DOM volume as the sole cause.
- Caching Firestore snapshot objects or changing provider data ownership was rejected because it
  would cross into subscription and data-consistency behaviour already examined separately.
- Memoising inexpensive Experience, Corruption and Insanity calculations was rejected because their
  measured commits were small.
- Optimising from bundle size, generic warnings or one unusually fast or slow trace was rejected;
  none is proof of a rendering defect.

## Validation

The completed implementation passed:

- 171 focused character-sheet and helper tests across 12 files.
- 2,243 broader fast application tests across 212 files.
- 62 heavy Gear and Talents tests across 3 files.
- 240 Firestore rules tests across 25 files using the disposable emulator project.
- 90 Functions emulator integration tests across 23 files.
- 20 focused startup and PWA update-state tests across 4 files.
- Lint and repository formatting checks.
- The production build (414 transformed modules and 43 precache entries totalling 2,679.83 KiB)
  and both PWA harness revisions. The harness build contained 44 precache entries totalling
  2,678.94 KiB.

The backend-blocked optimised route cleared its loading screen to the expected account-load error.
On a warm reload, the local server received the navigation document and service-worker/update
files but no cached application assets. After the exact test server process was stopped, the same
deep route still loaded from the installed service-worker cache and again reached the bounded error
state. This verifies the corrected build in backend-blocked, cached-route and fully origin-offline
states without Chrome or a live backend.

All 428 Functions unit tests pass. An outdated DM header-patch fixture initially omitted the
required character `campaignId`; the fixture was corrected without changing Functions production
behaviour.

## Remaining observations

The confirmed duplicate responsive trees and repeated derived calculations are corrected. Dense
Weapons, Gear, Cybernetics and Talents rows remain candidates for a future investigation only if
repeated warm distributions and interaction-specific profiles demonstrate a practical problem.
Any such work should first identify which props actually change per row and verify focus, scrolling
and editing behaviour before choosing memoisation or virtualisation.
