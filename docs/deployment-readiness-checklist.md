# Deployment Readiness Checklist

A reusable checklist to run through before deploying anything (rules, Functions, hosting) to any real Firebase project, staging first, later production. This covers infrastructure readiness built in Stage 4. It does not replace Stage 11's fuller security/cost/restore/functionality verification pass, which is specifically required before any real production deployment, not staging.

## Firestore

- [ ] `firestore.rules` deployed matches what's been tested (`npm run test:rules` clean)
- [ ] `firestore.indexes.json` deployed matches `docs/architecture.md`'s index table
- [ ] Target project's default database exists, region and settings confirmed intentional (production is `europe-west2`, Standard, Native mode, delete protection and PITR both off)

## Cloud Functions

- [ ] All Functions build cleanly (`npm --prefix functions run build`)
- [ ] `recoveryCodeHmacSecret` configured in Secret Manager for the target project, not the local `.secret.local` placeholder
- [ ] App Check confirmed wired in monitoring mode (not yet enforced, per Stage 11's own gating), intentional for the target environment
- [ ] Rate limits, idempotency, and audit logging confirmed working against a real deployed callable, not only the emulator

## Client configuration

- [ ] Correct `.env.<environment>` file used for the build (`vite build --mode <environment>`)
- [ ] `src/firebase.ts`'s fail-fast config check confirmed to actually catch a missing value before deploying, not just assumed
- [ ] No client code calls a deployed Function unless that integration has actually been built and tested, currently none does

## Tests

- [ ] `tsc -b --noEmit` clean
- [ ] `npm run test:all` green (client suite, rules emulator, Functions unit, Functions real-emulator, all four layers)

## Credential hygiene

- [ ] No service-account key file present anywhere in what's being deployed, Functions get runtime credentials automatically once deployed, no key file is ever needed for that
- [ ] Confirm which Google account and which project a deploy is actually targeting before running `firebase deploy`, a real, demonstrated risk this session during 4.0's setup

## Cost protections

- [ ] Billing/budget alert live and correctly scoped for the target environment (4.3)
- [ ] `MAX_JOB_TOTAL_COUNT` and other bulk-job ceilings still appropriate for the target environment's expected usage

## Backups

- [ ] `docs/backup-policy.md` reviewed; mechanism actually enabled for the target environment if it's expected to hold real data worth protecting

## Rollback plan

- [ ] Firestore rules: redeploy the prior version directly from git history (`git show <prior-commit>:firestore.rules`)
- [ ] Functions: redeploy from the prior known-good git commit
- [ ] Staging specifically: disposable and isolated by design, a broken deploy there has no real-user impact
