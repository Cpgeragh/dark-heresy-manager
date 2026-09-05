# Dark Heresy Manager

A campaign and character management app for Dark Heresy (1st Edition), built as an installable Progressive Web App. A Game Master runs one or more campaigns; players claim and manage their own character sheets within them.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS
- Firebase: Firestore (data), Authentication (anonymous sign-in), Cloud Functions (protected server-side operations), Firebase Hosting
- Vite PWA plugin for offline support and installability

## Project structure

- `src/` — the React application (pages, character-sheet tabs, hooks, services, Firestore data layer, game-rules reference data)
- `functions/` — an independent Cloud Functions project for server-side operations that can't be trusted to the client (recovery codes, ownership transfers, resumable bulk jobs)
- `billing-guard/` — a small standalone Cloud Function that acts as an automatic billing kill switch
- `tests/` — unit, integration, Firestore-rules, and Cloud Functions test suites
- `docs/` — architecture, security, backup, and deployment documentation (see below)

## Getting started

```bash
npm install
npm run dev
```

## Scripts

**App**
- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck and build for production
- `npm run lint` — run ESLint
- `npm run format` / `npm run format:check` — run or check Prettier across the app, tests, Functions, and billing-guard

**Tests**
- `npm run test` — Vitest in watch mode (fast suite)
- `npm run test:run` — the fast suite plus the heavier integration files, once
- `npm run test:rules` — Firestore security-rules tests against the local emulator
- `npm run test:functions` — Cloud Functions tests against the local emulator
- `npm run test:functions:unit` — Cloud Functions unit tests (mocked Firestore, no emulator)
- `npm run test:all` — every suite above

**Safety checks**
- `npm run check:safety` — local secret-scanning and lockfile-consistency checks
- `npm run check:deployment:local` — safety checks, production build, and the full test suite

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system overview, data model, and the authoritative product-limits table
- [`SECURITY_RULES.md`](SECURITY_RULES.md) — Firestore security rules reference
- [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md) — manual functional test checklist
- [`docs/accessibility-test-checklist.md`](docs/accessibility-test-checklist.md) — accessibility test checklist
- [`docs/backup-policy.md`](docs/backup-policy.md) — backup configuration and retention
- [`docs/data-lifecycle-policy.md`](docs/data-lifecycle-policy.md) — what happens to data over time (retention, deletion, cleanup)
- [`docs/deployment-readiness-checklist.md`](docs/deployment-readiness-checklist.md) — pre-deployment checklist
- [`docs/billing-kill-switch.md`](docs/billing-kill-switch.md) — the automatic billing kill switch
- [`docs/dependency-security-assessment.md`](docs/dependency-security-assessment.md) — dependency security assessment
