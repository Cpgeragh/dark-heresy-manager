# Dark Heresy Manager

Dark Heresy Manager is an installable Progressive Web App for running Dark Heresy First Edition campaigns. Game Masters manage the campaign, while players claim characters with Recovery Codes and use the same account across connected devices.

Repository paths and documentation links refer to the checked-out commit.

## Product capabilities

| Area         | Current capability                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts     | Anonymous Firebase Authentication backed by permanent application accounts, Recovery Codes, and up to 10 connected devices                           |
| Campaigns    | Game Master campaign administration, active and archived campaigns, and bounded membership                                                           |
| Characters   | Twenty character-sheet sections, portrait storage in the character document, JSON export and import, ownership claims, and controlled player editing |
| Sessions     | Private Game Master notes, member-safe summaries, attendance, XP awards, reversal, and repair tooling                                                |
| Messaging    | One private thread per character with 100-message pages and a bounded Game Master inbox                                                              |
| Custom items | Draft, publish, archive, restore, version, propagate, and remove workflows                                                                           |
| Offline use  | Installable PWA shell and persistent multi-tab Firestore cache; callable mutations require a network connection                                      |

## Technology

| Layer           | Implementation                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Client          | React 19, TypeScript, Vite, Tailwind CSS                                                             |
| Backend         | Firebase Authentication, Firestore, and second-generation callable Cloud Functions                   |
| Hosting         | Firebase Hosting with SPA rewrites, security headers, and PWA cache controls                         |
| Tests           | Vitest, Firebase Local Emulator Suite, and Firestore Rules Unit Testing                              |
| Cost protection | Bounded queries, product limits, callable rate limits, runtime limits, and an isolated billing guard |

## Local requirements

| Requirement          | Reason                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Node.js 22           | Matches the Cloud Functions runtime declared by the `engines.node` field in `functions/package.json` |
| npm                  | Installs the root application and the independent Functions packages                                 |
| Java JDK 11 or newer | Required by the Firestore emulator                                                                   |

Install the application and Functions dependencies:

```bash
npm install
npm --prefix functions install
```

Install `billing-guard` dependencies only when testing or deploying that isolated project:

```bash
npm --prefix billing-guard install
```

## Safe local development

Use the guarded local environment for application work that must not contact staging or production:

```bash
npm run performance:local
```

This command builds the Functions package, starts the Auth, Firestore, and Functions emulators for the fixed `dh-test` project, and serves the app at `http://127.0.0.1:4175`.

Use `npm run dev` only with a populated `.env` that intentionally targets a Firebase project. The application validates these keys in `src/firebase.ts` inside `requiredEnvVars`:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_RECAPTCHA_SITE_KEY
```

Copy `.env.example` to `.env`, supply the selected project's public web configuration, and confirm the project ID before starting Vite. Staging also requires the reCAPTCHA Enterprise site key. Do not place server secrets or service-account credentials in a `VITE_` variable.

## Common commands

| Command                          | Purpose                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`                    | Start Vite with the Firebase configuration in the selected environment file                   |
| `npm run build`                  | Type-check the repository and create a production build                                       |
| `npm run preview`                | Serve the most recent production build locally                                                |
| `npm run lint`                   | Run ESLint                                                                                    |
| `npm run format:check`           | Check source formatting without changing files                                                |
| `npm run test`                   | Run the fast application suite in watch mode                                                  |
| `npm run test:run`               | Run the complete fast and heavy application suites once                                       |
| `npm run test:rules`             | Run Firestore rules tests against the local emulator                                          |
| `npm run test:functions:unit`    | Run mocked Functions unit tests                                                               |
| `npm run test:functions`         | Run client-to-Functions integration tests against local emulators                             |
| `npm run test:all`               | Run all four test layers                                                                      |
| `npm run check:safety`           | Check local secrets and lockfile consistency without a network request                        |
| `npm run check:build-inventory`  | Validate the generated PWA asset and precache inventory                                       |
| `npm run check:deployment:local` | Run safety checks, the production build, build-inventory validation, and all four test layers |

The complete command catalogue and contribution workflow are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository layout

| Path             | Responsibility                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `src/`           | React pages, shared UI, hooks, services, Firestore helpers, domain logic, and reference data |
| `functions/`     | Protected callable operations and their independent unit tests                               |
| `billing-guard/` | Isolated Pub/Sub billing guard deployed to its own project                                   |
| `tests/`         | Application, integration, Firestore rules, and callable-emulator tests                       |
| `scripts/`       | Local safety, deployment build, PWA inventory, and performance-environment tooling           |
| `docs/`          | Architecture, operations, policies, performance contracts, and manual verification           |

## Documentation

| Document                                                                 | Use                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [Application architecture](docs/architecture.md)                         | Runtime boundaries, data ownership, limits, and deployment structure |
| [Firestore security boundary](SECURITY_RULES.md)                         | Current client access rules and server-only paths                    |
| [Data lifecycle policy](docs/data-lifecycle-policy.md)                   | Retention, deletion, recovery data, and exports                      |
| [Backup policy](docs/backup-policy.md)                                   | Current backup schedule and restore boundary                         |
| [Billing guard](docs/billing-kill-switch.md)                             | Budget notification, dry-run, deactivation, and recovery procedure   |
| [Dependency security assessment](docs/dependency-security-assessment.md) | Dated runtime audit results and accepted transitive risk             |
| [Performance verification](docs/final-performance-verification.md)       | Current performance regression standard                              |
| [Manual test checklist](docs/manual-test-checklist.md)                   | Functional manual test coverage                                      |
| [Accessibility checklist](docs/accessibility-test-checklist.md)          | Screen-reader, keyboard, and contrast coverage                       |
| [Deployment readiness checklist](docs/deployment-readiness-checklist.md) | Staging and production release gate                                  |
