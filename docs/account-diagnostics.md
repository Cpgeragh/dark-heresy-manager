# Account connection diagnostics

The app records a bounded private server report after startup settles, or when
startup detects a connection error. Reports distinguish a restored login from a
login created during this launch, identify the loaded build and Firebase project,
and record whether the account is connected, new, awaiting reconnection or failed
to load. This does not automatically restore an account or establish the cause of
a reset.

The server derives the current device UID from Firebase Authentication and the
account ID from its own device-link record. A previous device UID from the local
reconnect marker is explicitly stored as client-reported evidence, never as proof
of account access. No recovery codes, tokens, profile names or campaign content
are submitted. The callable rejects additional fields and payloads over 1 KiB.
Clients cannot read or write the diagnostic collection directly; investigation
requires administrative access.

The browser sends a status once per launch and limits upload attempts to four per
device login per UTC day. The server deduplicates report IDs, stores at most four
reports per login per UTC day, and applies the existing protected-callable limit
of eight requests per rolling day. The existing callable audit and usage-counter
writes also apply. Reporting failures never block account access.

Offline reports stay in a bounded local queue and retry when the connection
returns or the app next starts. Reports queued for a different login are never
uploaded under a replacement login. Clearing local storage can remove unsent
reports, but reports already accepted by the server survive local storage loss.

Each daily document becomes eligible for deletion 14 days after its first report.
`firestore.indexes.json` enables TTL for `accountDiagnostics.expiresAt`; deploy that
configuration for deletion to take effect. Firestore TTL deletion is asynchronous,
so eligibility does not mean immediate deletion. Reports are excluded from
indexing to reduce unnecessary storage.

Deploy the new `recordAccountDiagnostic` Function and Firestore rules/index
configuration before publishing the client. No deployment is performed by this
change. Persistent storage and reconnect markers remain separate protections.
