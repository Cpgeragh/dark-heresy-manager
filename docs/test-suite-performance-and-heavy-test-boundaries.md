# Test-suite execution boundaries

Repository paths in this document refer to the checked-out commit.

## Test layers

| Command                       | Environment                              | Responsibility                                           |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `npm run test:fast`           | Node and parallel jsdom projects         | Unit tests and ordinary component or integration tests   |
| `npm run test:heavy`          | jsdom                                    | Resource-heavy Gear and Talents integration suites       |
| `npm run test:rules`          | Firestore emulator                       | Firestore authorization, validation, and query contracts |
| `npm run test:functions:unit` | Node in `functions/`                     | Pure and mocked protected-backend behaviour              |
| `npm run test:functions`      | Auth, Firestore, and Functions emulators | Deployed callable integration behaviour                  |
| `npm run test:all`            | All layers above                         | Full automated test contract                             |

`vitest.config.fast.ts` excludes the named heavy UI files from the parallel jsdom project. The `test:run` script then runs fast and heavy suites in sequence so the files execute exactly once.

## Classification rules

- Prefer the Node project for pure tests.
- Use jsdom only when a test needs browser or React DOM behaviour.
- Move a file to the heavy boundary only when repeatable resource pressure justifies isolation; record the reason in the configuration comment.
- Use emulator suites for security rules and Admin SDK or callable integration, not for pure validation.
- Keep test data deterministic and avoid wall-clock sleeps when a state or fake timer can prove completion.
- Do not weaken assertions or merge unrelated scenarios solely to reduce runtime.

## Performance status

Suite runtimes and test counts are `Pending re-measurement`.

| Evidence field | Required value |
| --- | --- |
| Layer | Exact npm script |
| Duration | Elapsed seconds from the actual run |
| Runner | Machine or CI runner class |
| Workers | Effective worker and parallelism settings |
| Retries | Count and cause |

Historic counts must not be copied into this document.

When a suite becomes slow, identify file-level duration and setup cost before changing the boundary. A faster suite that omits a security or lifecycle contract is not an acceptable optimization.
