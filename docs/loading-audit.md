# Loading audit, 2 November 2026

## Follow-up implementation

IndependentCardGrid now retains one flat, keyed card tree across screen sizes. The existing media-query hook selects positioning at 640 px by default or 1024 px for its lg option. Desktop card heights are measured before paint and watched with ResizeObserver to position alternating cards in independent columns; mobile cards use their normal document flow. Card parents and DOM order do not change when crossing the breakpoint, preserving drafts, expansion and keyboard focus. The earlier conditional-tree implementation was replaced because it remounted cards on resize. The timings below describe the pre-change build and do not establish a measured speed improvement for this implementation.

Validation: production build and focused ESLint passed. The grid, Traits, Drugs, Armour, Notes, Weapons, Cybernetics, Archeotech, Talents, talent overflow flows and shared layout recipe suites passed after updating the Traits expectation that previously counted both responsive copies. The change is local and has not been deployed. Browser timing comparisons for the changed build remain outstanding.

Resize follow-up validation: regression tests assert the same input DOM node, draft, expanded state and focus survive both resize directions. A geometry test verifies expanding the left column does not move the right column, and that following content stays beneath the tallest column. An isolated browser preview confirmed these behaviours at desktop and phone widths, including the independent columns and no overlapping following content.

## Scope and evidence

Audit goal: shorten waits while keeping navigation stable. Existing transitions may be improved if measurements show a better approach. Avoid unexpected content movement; do not require every unrelated section to block an entire screen.

The production build passed against the current working tree, which contains existing uncommitted changes. No application behaviour was changed for this audit. Build sizes are not user journey timings, and local function timings would not establish production cold start latency.

User requirement: retain the startup update check. Its opening wait is acceptable because removing it previously led to skipped updates and late updating screens. Optimisation priority is interaction after startup.

## Measured local results

Measurements used a compiled Vite performance build served at loopback port 4183, connected to the dh-test emulators. The development server was used only for setup, not for the reported browser measurements. Browser: Chromium 156 on Windows, initially 1280 by 720; narrow checks requested 390 by 844 (document client width 380 due to scrollbar). Host power plan: Balanced. Hardware details could not be read through the available system query. Functions ran with host Node 24 rather than the configured Node 22. These results are exploratory local comparisons, not a production baseline.

Source base commit: eaf796ffec458044c1bc88d701d38e1a372b284e with pre-existing uncommitted work. Measured CharacterSheet-DqC8FWAO.js SHA256: 575D0A7B10B4157E0EE1B8A65D4CCD314F34D7A650A91B38ED0E91C47D4A82E7. The tested build is a snapshot; later working-tree edits are not included automatically.

The temporary built page captured browser input timestamps and DOM mutations. Reported navigation and picker times approximate input to the final relevant DOM mutation with the expected content visible. A 100 ms quiet timer was used to collect the sample but is excluded from the reported interval. They are not INP, paint, or verified full-screen usability measurements. Most repeated navigation used keyboard activation to avoid drawer-animation interference from automated pointer clicks. Observer overhead was not separately calibrated.

Sample sequences are recorded in loading-audit-samples.json. First-visit observations are separated from five warmed repetitions where available. With only five warm samples, the nearest-rank 95th percentile equals the maximum and should not be treated as a stable tail estimate.

| Journey | First observation | Warm median | Warm range / sample count |
| --- | ---: | ---: | --- |
| Small campaign opening | 380 ms | 18 ms | 14–23 ms, 5 |
| Small character opening | 440 ms | 38 ms | 36–50 ms, 5 |
| Small Gear tab | 18 ms | 8 ms | 7–9 ms, 5 |
| Small Weapons tab | 35 ms | 9 ms | 8–11 ms, 5 |
| Dense Gear tab | 73 ms | 88 ms | 84–95 ms, 5 |
| Dense Weapons tab | 392 ms | 231 ms | 147–364 ms, 5 |
| Dense Drugs tab | 217 ms | 158 ms | 154–191 ms, 5 |
| Dense Skills tab | 122 ms | 152 ms | 121–176 ms, 5 |
| Small gear picker opening | 59 ms | 45 ms across all five opens | 42–59 ms, 5 total |
| Small gear search | 8 ms | 8 ms across all five searches | 8–14 ms, 5 total |

All 21 character tabs were visited on both small and large-character fixtures, with visible headings verified. This does not mean every tab contained a large list: the dense fixture populates selected collections. Additional single picker observations on the dense fixture were: Talent 67 ms, Advanced Skill 84 ms, Ranged Weapon 207 ms, Drug 68 ms, Implant 55 ms and Armour 80 ms. Their tested searches took 3–15 ms. Search and cancellation worked in the sampled flows; only the gear addition was submitted.

Five small-character numeric save acknowledgements were 88–132 ms, median 122 ms. One note save acknowledged in 130 ms. The initial gear save acknowledged in 3,440 ms, with local item display changing after approximately 7 ms. A first overlapping burst of five dense quantity saves acknowledged in 3,611–3,907 ms; three later quantity saves acknowledged in 220–228 ms. The initial burst overlaps function startup and is not five independent cold-start measurements. Local quantities advanced immediately, and all eight quantity mutations completed without a recorded error.

The dense Weapons tab remained slower after imports had loaded. This supports investigating list mounting, row rendering, derived calculations and layout before prioritising more preloading. It does not isolate React rendering from all browser layout work.

## Behaviour checked and coverage gaps

- Five complete dashboard/campaign/character navigation repetitions succeeded. All tab destinations were verified; no claim of a full frame-by-frame pop-in review is made.
- Browser Back and Forward restored the expected Weapons and Gear tabs in one checked journey. Rapid conflicting navigation and unsaved-edit navigation remain unverified.
- At narrow width, dense Gear had equal document client and scroll widths (380 px), with no horizontal overflow in that view. Three dense Weapons switches took 205–233 ms; three Gear switches took 113–119 ms. This uses a desktop processor, not a physical phone.
- Two snapshots after repeated use showed 10 active listeners. This is a limited stability check, not proof that no listener or memory leak exists. Heap snapshots differed with fixture size and are not comparable leak evidence.
- Existing automated checks passed: 58 tests across fixture generation, performance recording, PWA startup, route holding and startup gating. This is not the full application suite or a performance sign-off.
- Constrained CPU/network timings, deployed server timings, installed-app journeys, large-DM campaign lists, every picker variant, sustained memory trends and a continuous visual layout-shift capture remain outstanding. The browser interface used here did not expose CPU or network throttling. Do not substitute loopback timings for those results.
- Browser control disconnected during the run and recovered after reconnecting. Failed selector attempts and connection downtime were excluded. A delayed 27-second DOM sample after quantity editing included unrelated later changes and is excluded from interaction latency claims.

## Recommended next changes

1. **Remove duplicate responsive row mounting where practical.** src/ui/layout/IndependentCardGrid.tsx renders items in a mobile container and again in desktop columns, with CSS hiding the unused tree. This duplicates mounted row instances for lists using this component, including the Drugs list and portions of Weapons. Keep the intended independent column layout and visual order, but evaluate a single mounted tree or breakpoint-aware rendering with hydration, resize, focus and state behaviour checked. The duplicated structure is confirmed in source; its exact share of the measured delay is not yet isolated.
2. Profile dense Weapons, Drugs and Skills list construction. Reduce the work performed when entering these tabs, while preserving stable visible content and keyboard focus. Use the saved warmed journeys to compare any change.
3. Measure requested-tab-first preloading against the current nine-tab burst under a controlled slower connection before changing it.
4. Consider separating Settings and conversation code if dependency analysis shows meaningful savings after startup. Pair splits with preparation before opening.
5. Keep the existing update-check flow. There is no measured justification here for changing its reliability trade-off or paying for warm server instances.

The large-DM fixture was seeded (1,037 documents: 45 campaigns, 90 characters, sessions, chats and custom items), but the browser showed onboarding after the live fixture reset. The emulator account document still had onboarded: true and a public profile. That journey was not timed successfully and is excluded. This is an unresolved harness/account-cache interaction, not evidence that campaign navigation is slow. A future run should isolate fixture resets from connected tabs and start with a fresh browser cache before collecting large-DM timings.

The only tracked code adjustment made during measurement is to the local fixture seeder: an explicit --uid now uses getUser rather than searching only the first two emulator users. Seeding the third disposable account succeeded, and the existing fixture tests passed. No production application or server behaviour was changed.

## Corrections to the initial discussion

CharacterSheet.tsx already starts nine tab imports together when a character route mounts. There is advance fetching, although it begins after entering the character route and is broad rather than selective. The absence of a function named preload or prefetch was not sufficient evidence of its absence.

## Findings, in recommended investigation order

1. **Startup update check precedes application mounting, intentionally retained.** In src/pwaStartup.ts, a controlled repeat visit waits for registration.update() before renderApp(). The safety fallback is 3 seconds; a detected update can use a separate 5 minute stalled-download fallback. These are bounds in code, not observed delays. The user accepts this wait for reliable updates; it is outside the current optimisation scope.
2. **Large entry and character modules.** Fresh Vite output reports 859.14 kB minified / 268.49 kB gzip for the main index module and 1,005.76 kB / 267.84 kB gzip for CharacterSheet. Other shared dependencies also contribute. Settings and ChatInboxModal are static imports in App.tsx; the inbox statically imports ChatConversation. Several character tabs are static imports. Inspect dependency contribution before splitting, then pair useful splits with advance fetching and stable reveal. Gzip estimates are not verified hosting transfer sizes.
3. **Existing tab warming is broad.** CharacterSheet.tsx imports Weapons, Gear, Archeotech, Cybernetics, Talents, Elite Advances, Psychic, Experience and Weapon Training together during character loading. Compare this against requested-tab-first loading followed by a small idle queue. Broad fetching may help repeat interactions but compete for transfer and parsing during entry. Do not assume either strategy is faster without comparison.
4. **Recovery check starts late.** StartupGate mounts after earlier account gates and then reads the authenticated device user's recovery backup status. Evaluate starting that same check earlier using the same identity, keeping its readiness semantics and account-change isolation intact.
5. **Route reveal depends on secondary data.** The character screen holds readiness on customItemsLoading. StartupGate waits for archived campaigns and chats as well as active campaigns. First try earlier preparation and cached data reuse. Only relax a gate if the visible screen remains coherent and unavailable actions have deliberate feedback.
6. **Repeated subscriptions need measurement.** Global campaign queries coexist with a per-campaign document subscription. This does not prove duplicate network reads because Firestore can share underlying work. Count actual listener lifetimes and reads before restructuring ownership.
7. **Server saves need production evidence.** Character edits use callable functions and the source global options do not configure minInstances. Measure acknowledgement, listener synchronisation and cold versus warm calls. Do not infer deployed configuration or buy warm capacity from source alone.

## Transition assessment

- RouteHolder retains the visible route and mounts its destination hidden until readiness releases. There is no fixed animation delay in this component.
- PendingOverlay waits 200 ms before displaying feedback. This delay suppresses flicker; it does not postpone destination reveal.
- Character tab changes already use a React transition and pending feedback.
- Route readiness has a 30 second timeout with an error path. This is a failure bound, not a normal navigation delay.
- The old route stays active while the destination prepares. Exercise rapid navigation, focus, scroll position and old-page interaction during this interval before calling the transition fully verified.
- Hidden mounting does not prove that final layout, fonts and browser paint are ready. Browser checks remain necessary.

## Measurement plan

Use the existing local emulator fixtures for repeatable data and a production-equivalent build for download and rendering comparisons. The performance:local script currently serves Vite development mode with performance instrumentation; its timings must not be presented as production bundle timings.

Compare first visit, warm repeat visit, installed-app startup and update startup separately. Record startup update-check duration, account readiness, route click to visible destination, first and repeated tab switches, and edit to acknowledgement and listener synchronisation. Include ordinary and dense characters, constrained network/CPU runs, median and high-percentile results, and layout movement.

Acceptance: demonstrably shorter waits without content jumps, lost focus or edits, incorrect permissions, failed offline/update behaviour, or a slower initial load caused by excessive preloading. The exploratory samples above do not establish an approved production baseline.
