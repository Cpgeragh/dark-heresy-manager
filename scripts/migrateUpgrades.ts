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
    let w = weapon;

    if (Array.isArray(w.attachments)) {
      changed = true;
      const upgrades = (w.attachments as string[]).map((id: string) =>
        id === "cr-melee-attachment" ? "cr-melee-upgrade" : id
      );
      const { attachments: _, ...rest } = w;
      w = { ...rest, upgrades };
    }

    if ("rarity" in w) {
      changed = true;
      const { rarity, ...rest } = w;
      w = { ...rest, availability: rarity };
    }

    return w;
  });
  return { weapons: migrated, changed };
}

function migrateItemArray(items: any[]): { items: any[]; changed: boolean } {
  let changed = false;
  const migrated = items.map((item) => {
    if (!("rarity" in item)) return item;
    changed = true;
    const { rarity, ...rest } = item;
    return { ...rest, availability: rarity };
  });
  return { items: migrated, changed };
}

const ITEM_ARRAYS = [
  "shields",
  "armour",
  "cybernetics",
  "gear",
  "archeotech",
  "drugs",
  "consumables",
  "grenades",
] as const;

async function runMigration() {
  console.log("=== Migration Start ===");

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

      for (const key of ITEM_ARRAYS) {
        if (data[key] !== undefined && !Array.isArray(data[key])) {
          continue;
        }
        const result = migrateItemArray(data[key] ?? []);
        if (result.changed) update[key] = result.items;
      }

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
