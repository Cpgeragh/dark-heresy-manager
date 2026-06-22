// scripts/migrateUpgrades.ts

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

function migrateWeaponArray(weapons: any[]): { weapons: any[]; changed: boolean } {
  let changed = false;
  const migrated = weapons.map((weapon) => {
    if (!Array.isArray(weapon.attachments)) return weapon;
    changed = true;
    const upgrades = (weapon.attachments as string[]).map((id: string) =>
      id === "cr-melee-attachment" ? "cr-melee-upgrade" : id
    );
    const { attachments: _, ...rest } = weapon;
    return { ...rest, upgrades };
  });
  return { weapons: migrated, changed };
}

async function runMigration() {
  console.log("=== Upgrade Migration Start ===");

  const campaignsSnap = await db.collection("campaigns").get();
  let totalUpdated = 0;

  for (const campaign of campaignsSnap.docs) {
    const charsSnap = await db
      .collection("campaigns")
      .doc(campaign.id)
      .collection("characters")
      .get();

    for (const ch of charsSnap.docs) {
      const data = ch.data() as any;
      const update: Record<string, any> = {};

      const ranged = migrateWeaponArray(data.rangedWeapons ?? []);
      if (ranged.changed) update.rangedWeapons = ranged.weapons;

      const melee = migrateWeaponArray(data.meleeWeapons ?? []);
      if (melee.changed) update.meleeWeapons = melee.weapons;

      if (Object.keys(update).length > 0) {
        await ch.ref.update(update);
        console.log(`[OK] ${campaign.id} / ${ch.id}`);
        totalUpdated++;
      }
    }
  }

  console.log(`=== Migration Complete — ${totalUpdated} characters updated ===`);
}

runMigration().catch(console.error);
