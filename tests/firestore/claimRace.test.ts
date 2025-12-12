import { describe, it, expect } from "vitest";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  createCampaign,
  createCharacter,
  dbAs,
} from "./helpers";
import { getTestEnv } from "./setup";

describe("Claim race safety", () => {
  it("prevents ownership overwrite after a character is claimed", async () => {
    const env = await getTestEnv();

    const campaignId = "campaign-race";
    const characterId = "character-race";

    const dmUid = "dm-1";
    const playerA = "player-a";
    const playerB = "player-b";

    // Setup campaign + character
    await createCampaign(env, campaignId, dmUid);

    await createCharacter(env, campaignId, characterId, {
      userId: "UNASSIGNED",
      isEditableByPlayer: true,
    });

    // DM assigns ownership to Player A (legal path)
    await setDoc(
      doc(
        dbAs(env, dmUid),
        "campaigns",
        campaignId,
        "characters",
        characterId
      ),
      { userId: playerA },
      { merge: true }
    );

    // Player B attempts to steal ownership (must fail)
    let error: unknown = null;

    try {
      await setDoc(
        doc(
          dbAs(env, playerB),
          "campaigns",
          campaignId,
          "characters",
          characterId
        ),
        { userId: playerB },
        { merge: true }
      );
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();

    // Ownership remains with Player A
    const snap = await getDoc(
      doc(
        dbAs(env, dmUid),
        "campaigns",
        campaignId,
        "characters",
        characterId
      )
    );

    expect(snap.data()?.userId).toBe(playerA);
  });
});