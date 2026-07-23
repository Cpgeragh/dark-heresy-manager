// scripts/migrateUpgrades.ts

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

type MigratableItem = Record<string, unknown>;

function isMigratableItem(value: unknown): value is MigratableItem {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateWeaponArray(weapons: unknown[]): { weapons: unknown[]; changed: boolean } {
  let changed = false;
  const migrated = weapons.map((weapon) => {
    if (!isMigratableItem(weapon)) return weapon;

    let w = weapon;

    if (Array.isArray(w.attachments)) {
      changed = true;
      const upgrades = w.attachments.map((id) =>
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

function migrateItemArray(items: unknown[]): { items: unknown[]; changed: boolean } {
  let changed = false;
  const migrated = items.map((item) => {
    if (!isMigratableItem(item)) return item;
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
      const data = ch.data() as Record<string, unknown>;
      const update: Record<string, unknown> = {};

      const ranged = migrateWeaponArray(
        Array.isArray(data.rangedWeapons) ? data.rangedWeapons : []
      );
      if (ranged.changed) update.rangedWeapons = ranged.weapons;

      const melee = migrateWeaponArray(
        Array.isArray(data.meleeWeapons) ? data.meleeWeapons : []
      );
      if (melee.changed) update.meleeWeapons = melee.weapons;

      for (const key of ITEM_ARRAYS) {
        const items = data[key];
        if (items !== undefined && !Array.isArray(items)) {
          continue;
        }
        const result = migrateItemArray(items ?? []);
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
