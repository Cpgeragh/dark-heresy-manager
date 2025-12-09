const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));
const DEFAULT_SKILLS = require("../src/data/defaultSkills.cjs");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log("=== Default Skills Migration Start ===");

  const campaignsSnap = await db.collection("campaigns").get();

  for (const campDoc of campaignsSnap.docs) {
    const campaignId = campDoc.id;

    const charsSnap = await db
      .collection("campaigns")
      .doc(campaignId)
      .collection("characters")
      .get();

    for (const charDoc of charsSnap.docs) {
      const charId = charDoc.id;
      const data = charDoc.data();

      if (!data.skills || data.skills.length === 0) {
        await charDoc.ref.update({
          skills: DEFAULT_SKILLS,
        });

        console.log(`[OK] Added default skills to ${campaignId}/${charId}`);
      } else {
        console.log(`[SKIP] ${campaignId}/${charId} already has skills`);
      }
    }
  }

  console.log("=== Default Skills Migration Complete ===");
}

run().catch((err) => console.error(err));