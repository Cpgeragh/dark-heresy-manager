// functions/src/shared/secrets.ts
//
// Stage 3.2a: Cloud Functions Secret Manager parameter definitions. Real
// values are set via `firebase functions:secrets:set` for deployment, and
// via functions/.secret.local (gitignored) for local emulator testing.

import { defineSecret } from "firebase-functions/params";

export const recoveryCodeHmacSecret = defineSecret("RECOVERY_CODE_HMAC_SECRET");
export const identityCodeHmacSecret = defineSecret("IDENTITY_CODE_HMAC_SECRET");
