// src/hooks/useClaimActions.ts

import { claimCharacter as claimCharacterInService } from "../services/characterService";

export function useClaimActions() {
  async function claimCharacter(code: string) {
    return claimCharacterInService(code);
  }

  return { claimCharacter };
}
