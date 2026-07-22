// src/pages/ClaimCharacter/hooks/useClaimActions.ts

import { claimCharacter as claimCharacterInService } from "../../../services/characterService";

export function useClaimActions() {
  async function claimCharacter(
    campaignId: string,
    character: {
      id: string;
      userId: string | null;
    },
    ownerId: string
  ) {
    await claimCharacterInService(campaignId, character.id, ownerId);
  }

  return { claimCharacter };
}
