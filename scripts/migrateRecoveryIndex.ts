// scripts/migrateRecoveryIndex.ts

/**
 * ESM-compatible migration script
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ESM-safe JSON import helper
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load service account JSON safely under ESM
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function runMigration() {
  console.log("=== Recovery Index Migration Start ===");

  const campaignsSnap = await db.collection("campaigns").get();

  for (const campaign of campaignsSnap.docs) {
    const campaignId = campaign.id;

    const charsSnap = await db
      .collection("campaigns")
      .doc(campaignId)
      .collection("characters")
      .get();

    for (const ch of charsSnap.docs) {
      const characterId = ch.id;
      const data = ch.data() as any;

      const code = data.recoveryCode;

      if (!code) {
        console.warn(`[SKIP] Character ${characterId} has no recoveryCode`);
        continue;
      }

      const indexRef = db.collection("recoveryIndex").doc(code);

      const existing = await indexRef.get();
      if (existing.exists) {
        console.log(`[SKIP] recoveryIndex/${code} already exists`);
        continue;
      }

      await indexRef.set({
        campaignId,
        characterId,
        createdAt: new Date(),
      });

      console.log(
        `[OK] Added recoveryIndex/${code} -> (${campaignId}, ${characterId})`
      );
    }
  }

  console.log("=== Recovery Index Migration Complete ===");
}

runMigration().catch(console.error);
