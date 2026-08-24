// functions/src/index.ts
//
// Stage 3.0 scaffolding: proves a Function can be written, emulated, and
// called from the client end to end. Nothing here is protected yet — auth,
// App Check, rate limiting, and every other Stage 3.1 requirement land once
// the shared foundation is built.

import { onCall } from "firebase-functions/v2/https";

export const ping = onCall(() => {
  return { ok: true };
});
