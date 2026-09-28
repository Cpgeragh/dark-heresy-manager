# Contributing to Dark Heresy Manager

Supported local workflows apply to the checked-out commit. Production architecture and policy remain in `docs/`; historical investigation logs belong in pull requests or issues.

## Development prerequisites

| Requirement          | Supported use                                           |
| -------------------- | ------------------------------------------------------- |
| Node.js 22           | Application tooling and the deployed Functions runtime  |
| npm                  | Root, Functions, and billing-guard package installation |
| Java JDK 11 or newer | Firestore emulator execution                            |

Install dependencies from the repository root:

```bash
npm install
npm --prefix functions install
```

Install the billing-guard package separately when changing that project:

```bash
npm --prefix billing-guard install
```

## Local execution modes

| Mode                | Command                                       | Firebase destination                                     |
| ------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Guarded local app   | `npm run performance:local`                   | Fixed `dh-test` Auth, Firestore, and Functions emulators |
| Configured Vite app | `npm run dev`                                 | Project named by the active Vite environment file        |
| Production preview  | `npm run build` followed by `npm run preview` | Uses the build-time Firebase configuration               |

Use the guarded local app for ordinary development unless work explicitly requires staging. The performance launcher refuses conflicting project IDs or emulator hosts before starting.

## Firebase environment configuration

The `requiredEnvVars` object in `src/firebase.ts` is the client configuration boundary. Copy `.env.example` to the environment file used by Vite and set every required value. Staging also requires `VITE_RECAPTCHA_SITE_KEY`.

All `VITE_` values are public browser configuration. Server secrets belong in Google Secret Manager and must never appear in a Vite environment file. The local safety checker rejects unapproved browser-exposed variable names.

## Test layers

| Layer                 | Command                       | Dependencies                             |
| --------------------- | ----------------------------- | ---------------------------------------- |
| Fast application      | `npm run test:fast`           | No emulator                              |
| Heavy application     | `npm run test:heavy`          | No emulator                              |
| Application aggregate | `npm run test:run`            | No emulator                              |
| Firestore rules       | `npm run test:rules`          | Firestore emulator                       |
| Functions unit        | `npm run test:functions:unit` | Functions package dependencies           |
| Functions integration | `npm run test:functions`      | Auth, Firestore, and Functions emulators |
| Complete local suite  | `npm run test:all`            | All dependencies above                   |

Use `npm run test:changed` for quick local feedback. Run the affected focused suite after a change, then run `npm run test:all` before deployment-sensitive work is complete.

## Repository checks

| Check                           | Command                          |
| ------------------------------- | -------------------------------- |
| TypeScript and production build | `npm run build`                  |
| Lint                            | `npm run lint`                   |
| Formatting                      | `npm run format:check`           |
| Secret and lockfile safety      | `npm run check:safety`           |
| Generated PWA inventory         | `npm run check:build-inventory`  |
| Complete local deployment gate  | `npm run check:deployment:local` |

`check:deployment:local` performs local safety checks, a production build, PWA inventory validation, and all four test layers. It does not deploy or run an online vulnerability audit.

## Performance test harness appendix

Start the guarded performance environment:

```bash
npm run performance:local
```

Seed one deterministic profile from another terminal:

```bash
npm run performance:seed -- --profile new-account
npm run performance:seed -- --profile empty
npm run performance:seed -- --profile small
npm run performance:seed -- --profile large-character
npm run performance:seed -- --profile large-dm
npm run performance:seed -- --profile long-thread
```

The fixture definitions and measurement interface are documented in [the performance harness appendix](docs/performance-testing.md). Performance numbers are valid only for their recorded commit and environment. Active documentation records current invariants and uses `Pending re-measurement` when no current baseline exists.

## Documentation standard

- Describe the current system rather than the sequence used to investigate it.
- Limit headings to levels one through three.
- Use tables for inventories, comparisons, and alternative decisions.
- Put commands and schemas in language-labelled fenced blocks.
- Keep implementation references anchored to the checked-out commit and name the owning function, constant, or npm script.
- Record numerical units in table headings or field names.
- Move historical measurements to the relevant pull request or issue instead of retaining them as current specifications.
- Update documentation and focused tests whenever an interface, limit, route, or persistence boundary changes.
