# JavaScript bundle investigation — 7 September 2026

Measurements use optimized production builds and compare against the 6 September baseline. A
disposable source-map build was used for attribution and was removed after the investigation.

## What was in the original bundle

The original application shipped one 2,391.44 kB main JavaScript file (666.26 kB gzip). Approximate
raw source contribution in the disposable source-map build was:

| Source group             | Approximate raw size |
| ------------------------ | -------------------: |
| Reference data           |            872.43 kB |
| Third-party dependencies |            705.09 kB |
| Character-sheet UI       |            399.24 kB |
| Mechanics                |            163.58 kB |
| Other application code   |            189.59 kB |

The largest individual contributors included Firestore (265.87 kB), career advances (184.50 kB),
weapon reference data (184.44 kB), React DOM (178.18 kB), gear reference data (85.20 kB), Auth
(67.84 kB), psychic reference data (55.01 kB), talent descriptions (52.15 kB), and skill
descriptions (42.98 kB).

`App.tsx` eagerly imported every top-level screen. `CharacterSheet.tsx` then eagerly imported every
tab, so opening an ordinary character also fetched specialist inventory screens and their large
reference datasets before the user selected them.

## Boundaries assessed

Route-level splitting reduced the shared loading shell to about 222 kB gzip in the measurement
build. Estimated route totals were approximately 230.5 kB for onboarding, 241.4 kB for the
dashboard, 250.3 kB for a campaign, 629.2 kB for a character sheet, and 229.8 kB for settings.

Splitting every character tab was rejected. It reduced the ordinary character route to about 389
kB gzip, but fragmented the PWA into 96 precache entries without enough benefit for the small tabs.
Splitting only the six substantial tabs produced a better balance: an ordinary character route of
about 483 kB gzip and 52 precache entries. The six selected boundaries are Talents, Weapons,
Cybernetics, Psychic Powers, Gear, and Archeotech.

Picker-only splits were also rejected because the same reference datasets are needed to render
existing item cards and rows. Splitting the background-completion modal was rejected because it
saved less than 0.3 kB from the character route.

## Implemented result

- Dashboard, Campaign Overview, Character Sheet, Onboarding, Settings, and Missing Profile Recovery
  now load at their route boundary.
- The six substantial character tabs now load only when selected.
- Route and tab fallbacks retain the application or character shell while the requested code loads.
- Workbox's 2 MiB per-file precache limit is explicit again as a guardrail. Every emitted asset is
  below it.

| Delivery measure        |                  Before |                  After | Change                 |
| ----------------------- | ----------------------: | ---------------------: | ---------------------- |
| Startup JavaScript      | 2,391.44 kB / 666.26 gz |  727.81 kB / 227.32 gz | −69.6% raw / −65.9% gz |
| Largest JavaScript file |             2,391.44 kB |              941.77 kB | −60.6%                 |
| PWA precache            |       21 / 2,759.38 KiB |      52 / 2,774.16 KiB | +31 files / +14.78 KiB |
| Complete built output   |  3,185,189 B / 34 files | 3,202,016 B / 65 files | +16,827 B / +31 files  |

The build still reports Vite's generic 500 kB chunk warning for the 941.77 kB character-sheet
chunk. It is below the offline-cache guardrail and is substantially smaller than the former main
bundle; further splitting should be justified by a later measured bottleneck rather than by the
warning alone.

## Verification

- Direct production-like URLs loaded all six deferred tabs against deterministic small-profile
  emulator data.
- After the PWA had installed, the preview server and all Firebase emulators were stopped and their
  ports confirmed closed. An offline reload restored Weapons, and a direct offline navigation then
  loaded Talents. This verifies that the split files are precached and direct navigation remains
  functional offline.
- The production build transformed 413 modules, emitted 52 precache entries totalling 2,774.16
  KiB, and included every emitted JavaScript asset in the service-worker precache manifest.
- Lint and the local safety check passed.
- The complete fast suite passed: 207 files and 2,204 tests.
- The isolated heavy Gear and Talent suites passed: 3 files and 61 tests. No timeout was increased.

The change deliberately optimizes delivery boundaries only. It does not claim that large rendered
inventories are now cheap; their render and interaction costs remain separate later performance
investigations.
