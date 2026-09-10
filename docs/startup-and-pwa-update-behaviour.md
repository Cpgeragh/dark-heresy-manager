---
title: Startup and PWA update behaviour
date: 2026-09-07
last_updated: 2026-09-10
status: Corrections applied and verified
---

# Startup and PWA update behaviour

## Purpose

This report examines the path from navigation to a usable application, including service-worker registration and update handling, authentication, device-link resolution, profile loading, and campaign subscription startup. It also checks whether the loading screen can remain indefinitely and whether the production precache is aligned with startup needs.

Accessibility is outside this investigation.

## Correction outcome

The bounded startup corrections identified by this investigation have been applied. The existing three-second update-check safeguard and thirty-second stalled-update safeguard are unchanged.

- The three-second watchdog now begins before service-worker registration, so it also covers a registration helper that never calls back. Browsers without service-worker support render the application immediately.
- Authentication observer and anonymous-sign-in failures are now exposed to the application and produce the existing explicit account-load error screen. A first anonymous sign-in hands account synchronisation to the signed-in observer callback, eliminating the duplicate call without clearing loading between callbacks.
- A stalled update clears the post-upgrade session marker before falling back, preventing a later reload from being mislabelled as a successful upgrade.
- Both splash WebPs are precached. Manifest icons are included once each, and the unreferenced Roboto and Roboto Mono imports, faces, and packages have been removed.
- The service-worker registration helper is now the only normal update check. Successful activation
  records the post-upgrade marker before reloading, preserving the single updated-page loading path.
  The campaign-subscription sequence remains unchanged because the investigation did not justify
  altering it.

One guarded browser run per corrected state was used as an end-to-end regression check. These values confirm branch behaviour; they are not a new statistical baseline and do not replace the five-run investigation results below.

| Corrected state                   | Observed result                                                                                                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First visit, fresh origin         | App requested at 225.1 ms; onboarding visible; one account-synchronisation start. Auth readiness was 5994.1 ms because the first local Firestore listener response took about 5.2 seconds on that cold emulator run.                                                     |
| Cached visit, no update           | Update check completed and app rendered at 104.5 ms; Auth ready at 366.3 ms.                                                                                                                                                                                             |
| Update available                  | Automatic update and reload completed; the new page recorded the post-upgrade path at 88.4 ms and Auth ready at 587.5 ms.                                                                                                                                                |
| Update download stalled           | Update detected at 72.5 ms; fallback rendered the app at 30082.8 ms; Auth ready at 30247.9 ms. The next reload recorded the ordinary loading path, proving the false post-upgrade marker was cleared.                                                                    |
| Backend unavailable, clean origin | App rendered at 173.5 ms; anonymous sign-in failed at 2242.3 ms; the explicit account-load error was visible instead of an indefinite splash. An origin with persisted Auth and Firestore data continued to reach onboarding from its local cache.                       |
| Fully offline                     | Direct `/weapons` and `/talents` navigations loaded from the service worker. Their update checks rejected and rendered the app at 2044.1 ms and 2053.4 ms; Auth was ready at 2295.0 ms and 2325.6 ms. Both splash WebPs were served from cache with zero transfer bytes. |

## Method and safety boundary

Measurements used production-shaped PWA builds in the repository's guarded performance mode. The browser and Firebase Admin environments were pinned to the local `dh-test` project and the Auth and Firestore emulators. No measurement build could use the production project.

Two local PWA revisions were built. A one-byte, performance-mode-only precache entry had a different revision in each build, allowing update downloads to succeed or remain deliberately open. That entry is absent from normal production builds. A local request log distinguished browser requests from assumptions based on timing.

The small deterministic fixture was used. Each reported state has five successful runs. Times are milliseconds from navigation start, reported as median with the observed range in parentheses. Online controlled-visit measurements used the campaign overview route. Backend-unavailable and fully offline measurements used the direct small-character route. Those route-ready values should therefore be compared within a state, not as equivalent page workloads.

## Investigation baseline results

### State summary

| State                                  |                                      App render requested |                                                    Auth ready |     Campaign subscriptions ready |                     Route ready or final readiness |
| -------------------------------------- | --------------------------------------------------------: | ------------------------------------------------------------: | -------------------------------: | -------------------------------------------------: |
| First visit, fresh origin              |                                       277.7 (231.7–646.1) |                                          814.2 (744.4–1068.4) | Not applicable during onboarding | Visible onboarding confirmed in every included run |
| Normal cached visit                    |                                          72.8 (71.5–83.2) |                                           303.5 (285.6–335.4) |              337.8 (314.2–369.0) |                                665.6 (648.4–700.0) |
| Controlled visit, explicitly no update |                                          74.2 (71.7–90.7) |                                           299.8 (272.8–333.7) |              329.7 (303.4–369.2) |                                667.4 (638.4–701.2) |
| Update available                       | Automatic update and reload completed in 2245 (2156–2490) | Final page readiness was 688.7 (652.5–769.6) after its reload | Included in final page readiness |                 Updated route visible in every run |
| Update download stalled                |                                 30122.2 (30086.6–30126.4) |                                     30326.9 (30276.9–30347.5) |        30368.8 (30307.5–30383.2) |                          30641.4 (30592.8–30670.9) |
| Backend unavailable, assets available  |                                         81.2 (75.9–186.1) |                                        4249.7 (4224.6–4389.4) |           4267.9 (4243.3–4424.7) |                             4581.9 (4543.1–4714.1) |
| Fully offline                          |                                    2108.2 (2100.2–2118.7) |                                        4256.5 (4229.2–4290.0) |           4274.6 (4253.8–4304.5) |                             4581.9 (4543.5–4604.5) |

The update-available duration is browser-observed time from starting the controlled navigation until the updated route was visible after the automatic reload. The final-page value is the updated page's own listener-based readiness timestamp; it is not added again to the total.

### HTML and assets

- Normal cached navigation `load` was 51.5 ms (48.8–52.1 ms). The no-update sample was also 51.5 ms (49.8–61.9 ms).
- A fresh origin loaded in 233.3 ms (184.9–598.4 ms). The service worker registered and released the app at 277.7 ms median.
- Fully offline navigation `load` was 2085.2 ms (2069.6–2096.0 ms), even though the cached main JavaScript and CSS completed in single-digit milliseconds.
- Before correction, the two splash WebP files were not precached. During online cached visits, each file was requested on every reload. In an offline trace their preload requests remained pending for about 2.02 and 2.07 seconds. The splash then requested the same URLs as images; one of those image requests remained pending for about another 2.04 seconds.
- The online delay from these images was only about 12–23 ms in the measured local environment. That isolated online timing is not evidence of a user-visible defect. Their absence from the offline cache is relevant because they are the deliberate loading-screen visuals and because the failed preloads extend the offline `load` event.
- After correction, both WebPs are in the generated precache and completed on fully offline route starts with zero transfer bytes.

### Service-worker registration and update checking

The original investigation recorded the following behaviour before the dedicated single-check
follow-up:

- First-visit registration completed at 277.7 ms (231.7–645.9 ms) and did not wait for an update check because there was no controlling worker.
- On a controlled no-update visit, the explicit update check took 19.7 ms (18.7–20.8 ms) and the app was requested at 74.2 ms median.
- With the server unavailable, the explicit update check rejected at 2108.2 ms (2100.2–2118.7 ms) and immediately released the app. This was below the existing three-second safety fallback.
- Five no-update navigations produced ten requests for `sw.js` and ten for its Workbox import. The registration helper performs registration/update work and the application then calls `registration.update()` explicitly, so the request evidence is consistent with two checks per controlled visit.
- The second check costs little in the local online trace. Removing it without first proving identical update detection would change a deliberate correctness path for a small measured gain, so this investigation does not recommend changing it in the first correction.

The dedicated follow-up on 2026-09-10 removed the explicit `registration.update()` call after
proving that the registration helper already performs the required check. A successful guarded
update produced two `sw.js` and two Workbox requests across the update page and its automatic
reload: one pair per real visit, rather than two pairs per visit. Controlled reloads sometimes
produced no network request because the browser throttled or coalesced its update check; that is
browser behaviour and is not treated as product latency.

Removing the second call alone was not sufficient. The browser experiment showed that helper-owned
activation can reload the page without passing through the previous explicit-update branch. The
registration callback now receives the update-ready signal, records `pwa-just-upgraded`, displays
the existing updating state, and reloads once. The updated page consumes that marker and renders
the application directly, avoiding a second update splash. The three-second registration safeguard
and thirty-second stalled-update safeguard are unchanged.

The service-worker work did not delay initial HTML parsing or cached JavaScript execution. It does deliberately gate application rendering on controlled visits. Offline, its approximately two-second failure overlaps the approximately two-second wait for cached Auth state, so removing the gate would not have improved the measured end-to-end route time.

### Authentication, device linking, and profile loading

The first listener snapshot for `userLinks/{uid}` represents device-link resolution. The first `userProfiles/{uid}` snapshot represents profile loading.

| State                |                                           Auth state received |   Device link resolved |       Profile resolved | Account synchronisation/auth ready |
| -------------------- | ------------------------------------------------------------: | ---------------------: | ---------------------: | ---------------------------------: |
| First visit          | Initial anonymous-auth path began immediately after app mount |    586.2 (507.0–890.0) |    593.8 (517.0–898.0) |               814.2 (744.4–1068.4) |
| Normal cached visit  |                  Approximately 130–143 in representative runs |    144.8 (140.3–158.4) |    149.4 (144.6–162.6) |                303.5 (285.6–335.4) |
| Explicitly no update |                  Approximately 130–153 in representative runs |    143.7 (141.0–166.2) |    150.1 (145.5–171.4) |                299.8 (272.8–333.7) |
| Backend unavailable  |                                        2191.5 (2172.1–2288.6) | 2201.6 (2183.6–2319.9) | 2204.7 (2187.0–2333.1) |             4249.7 (4224.6–4389.4) |
| Fully offline        |                                       Approximately 2166–2207 | 2198.1 (2182.6–2230.1) | 2203.0 (2186.2–2236.1) |             4256.5 (4229.2–4290.0) |

Offline and backend-unavailable starts spend about two seconds obtaining cached Auth state and another approximately two seconds in account synchronisation. Device-link and profile listeners resolve quickly once the user ID is available. Campaign-list and direct-route cached snapshots then complete in roughly another 0.3 seconds.

Before correction, every successful fresh-origin run started account synchronisation twice. The Auth observer first received `null`, called anonymous sign-in, and then received the signed-in user while the original callback continued with the same credential. Both callbacks called `synchroniseUserAccount`. This was direct repeated-work evidence, not an inference from file size or an isolated timing. The corrected first-visit browser trace and focused hook test each record exactly one synchronisation.

One additional clean-origin diagnostic run is excluded from the five-run successful summary because its user-link and profile reads timed out against an emulator carrying several other long-lived browser tabs. At about 10.36 seconds it showed the explicit account-recovery screen rather than hanging. It is retained as evidence that this particular downstream error path is visible, but it is not treated as production-performance evidence.

### Campaign subscription startup

With the backend available, campaign-list subscriptions were ready at 329.7 ms median on the explicit no-update visits. The remaining campaign-overview listeners reached their first snapshots at 667.4 ms median.

With the backend unavailable, cached campaign-list subscriptions were ready at 4267.9 ms and the direct campaign and character documents at 4581.9 ms. Fully offline values were effectively the same: 4274.6 ms and 4581.9 ms. This consistency matches the earlier small-campaign offline baseline and does not indicate a subscription fan-out regression.

## Safeguards and indefinite-loading review

### Three-second update-check fallback

The fallback remains justified as a maximum wait for an update check that never settles. Characterisation tests show that it releases the application at exactly 3000 ms when the update promise remains pending. In the real fully offline measurements, the update call rejected at about 2.11 seconds, so the earlier error path released the app first.

Before correction, the timer started only inside the successful registration callback. It did not protect two paths:

- service workers are unsupported and the registration helper returns without invoking either callback;
- registration itself remains pending indefinitely and invokes neither callback.

Those paths could leave the initial loading screen indefinitely. The timer now starts before registration, and unsupported browsers render immediately. Deterministic tests cover both paths without changing the three-second duration.

### Thirty-second stalled-update fallback

The deterministic stalled resource remained open in the local server, proving the browser was not merely using its HTTP cache. All five runs detected the update by 119.2 ms and requested the app at 30.09–30.13 seconds. The direct cached route was ready by 30.59–30.67 seconds.

The fallback works and remains 30 seconds. The corrected fallback removes `pwa-just-upgraded` before displaying the cached application. Both the deterministic test and a real stalled-download browser check confirmed that the next reload uses the ordinary loading path rather than a false post-upgrade path.

### Authentication failures

Before correction, an anonymous-sign-in failure was not exposed to `App`, and the Auth observer had no error callback. Those failures now end loading and use the same explicit `Unable to load your account. Please refresh.` screen as device-link and profile failures. A clean-origin browser run with the local backend stopped confirmed the visible error at 2242.3 ms.

All exercised successful, update, stalled-update, backend-unavailable, and fully offline states clear the loading screen. Unsupported service workers, never-settled registration, registration failure, update-check failure, and Auth failure are also bounded by deterministic tests.

## Precache inventory

The investigation build reported 52 precache entries totalling about 2.78 MiB. Parsing that generated manifest gave 50 unique URLs:

- `icon-192.png` and `icon-512.png` each appear twice because `includeAssets` adds files that already match the public-asset/glob path;
- 11 WOFF2 files are precached;
- no WebP file is precached;
- the performance-only revision entry is absent.

Across five cached campaign visits, only the Cinzel and IM Fell English Latin font files were requested. Source inspection found that the global Roboto stylesheet is imported but no application rule assigns the Roboto family. It emits seven WOFF2 subsets into the precache. `RobotoMonoZero` emits one further WOFF2 file, but no rule uses that family. This combined source and request evidence justifies a focused removal test; the precache's total size alone would not.

The corrected normal production build reports 43 entries totalling 2677.18 KiB, and all 43 URLs are unique. The inventory includes both splash WebPs and only the intended Cinzel and IM Fell English WOFF2 files; it contains no Roboto asset and no performance-only revision marker. The web manifest retains 192px and 512px icons, each with the combined `any maskable` purpose. Source review found no remaining removed-family reference, and the recovery-code and account-recovery components passed in the complete suite.

## Findings

1. The measured states reach a usable or explicit recovery/error screen; the real stalled-update path remains bounded by the intended 30-second fallback.
2. The unsupported and never-settled registration gaps are corrected by immediate unsupported rendering and a watchdog that begins before registration.
3. Early Auth failures now end loading and display an explicit error.
4. A first anonymous sign-in now performs account synchronisation once.
5. The stalled-update fallback now clears the false post-upgrade marker.
6. The dedicated follow-up reduced the normal update path from two checks per visit to the
   registration helper's single check while preserving update activation, post-upgrade loading,
   and both existing safeguards.
7. The startup-critical splash WebPs are now available offline.
8. The unreferenced Roboto assets are removed. Remaining fonts and application chunks were not removed merely because they contribute to cache size.

## Implemented correction scope

1. The existing three-second watchdog starts before service-worker registration, and unsupported browsers render immediately.
2. Auth initialisation and sign-in errors are exposed to `App`, including an observer error callback and explicit failure UI.
3. Initial anonymous sign-in defers synchronisation to the observer's signed-in callback.
4. The existing thirty-second stalled-update fallback clears its upgrade marker before rendering the cached app.
5. WebP is included in the Workbox glob. Redundant public/manifest icon inclusion is disabled because the PNG glob already includes the physical files, and each manifest icon combines its `any` and `maskable` purposes.
6. Unreferenced Roboto and Roboto Mono source imports, declarations, and direct dependencies are removed.
7. Focused startup, Auth, application-error, performance-recorder, fixture, and PWA-configuration tests cover the corrected branches.
8. Guarded browser checks cover all startup states, backend-unavailable startup, and fully offline direct routes.
9. The explicit second update call is removed. Helper-owned activation now records the post-upgrade
   marker and reloads exactly once through an injected page-reload boundary.

## Alternatives considered

- **Shorten the three- or thirty-second safeguards:** rejected. The 30-second timeout is what bounded a genuinely stalled download, and the offline update rejection already beats the three-second fallback. The evidence supports broader coverage and state cleanup, not shorter values.
- **Render the app before every controlled update check:** rejected for the proposed correction. It would change the intentional update-before-use product behaviour, and the offline check overlapped Auth's cached-state delay rather than increasing measured end-to-end route readiness.
- **Remove the explicit second service-worker check without an activation callback:** rejected by
  the dedicated follow-up. The browser showed that helper-owned activation can reload without the
  post-upgrade marker. The implemented callback preserves that state transition while eliminating
  the duplicate check.
- **Remove image preloads instead of caching the splash images:** rejected. These images are deliberately eager loading-screen assets. Precaching the small files preserves that design offline; removing the preloads would not make them available offline.
- **Trim precache entries based on size or the build's generic chunk warning:** rejected. Only assets with source-level non-use and request evidence are proposed for removal. Large route chunks remain covered by the separate JavaScript investigation.
- **Change campaign subscription order or count:** rejected. Online startup is sub-second, and backend-unavailable and fully offline readiness are consistent. No subscription defect was demonstrated here.
- **Increase test timeouts:** rejected. A parallel broad run produced interaction-test timeouts under worker contention; the affected 57 tests and then all 2,218 fast tests passed with existing per-test timeouts when run serially.

## Verification completed

- Focused startup, Auth, application-loading, PWA-configuration, performance-recorder, and guarded-fixture tests: 30 passed.
- Complete fast suite with existing test timeouts, run serially: 211 files and 2,225 tests passed.
- Lint: passed.
- Formatting check: passed.
- Local safety check: passed.
- Normal TypeScript and production Vite/PWA build: passed; 43 unique production precache entries totalling 2677.18 KiB, with no performance revision entry.
- Guarded PWA harness rebuild: both revisions passed TypeScript and production-shaped builds; each performance build contained 44 entries, including its one local measurement entry.
- Browser verification: the original five-run investigation matrix plus corrected-state checks for first visit, cached/no-update, successful automatic update and reload, genuine open-response stalled update, backend-unavailable startup, and fully offline direct `/weapons` and `/talents` routes.
- Single-check follow-up: all 9 focused PWA startup tests passed, including helper-owned activation,
  one reload, post-upgrade marker consumption, registration failure, unsupported service workers,
  never-settled registration, and stalled-update fallback.
- Guarded single-check browser verification: a successful update reloaded once, the updated page
  recorded `startup:post-upgrade` before rendering the application, and the request log showed one
  update-check request pair per real visit.

No timeout was increased. No commit or push was made.
