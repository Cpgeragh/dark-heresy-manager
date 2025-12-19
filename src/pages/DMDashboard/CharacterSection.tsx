// src/pages/DMDashboard/CharacterSection.tsx

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { createEmptyCharacterData } from "../../utils/characterFactory";
import type { CharacterListItem } from "../../types/Firestore";
import { useToast } from "../../components/Toast";
import { buildRoute } from "../../constants/routes";
import { validateCharacterName } from "../../utils/validation";
import {
  IMPORTANT_TOAST_DURATION,
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from "../../constants/ui";

interface CharacterSectionProps {
  campaignId: string;
  characters: CharacterListItem[];
}

/**
 * Generate a recovery code in format: DH-XXXX-YYYY
 */
function generateRecoveryCode(): string {
  const seg = () =>
    Math.random()
      .toString(36)
      .substring(2, 2 + RECOVERY_CODE_SEGMENT_LENGTH)
      .toUpperCase();

  const segments = Array.from({ length: RECOVERY_CODE_SEGMENTS }, () => seg()).join(
    "-"
  );

  return `${RECOVERY_CODE_PREFIX}-${segments}`;
}

function CharacterSection({ campaignId, characters }: CharacterSectionProps) {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [characterName, setCharacterName] = useState("");

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
  }, []);

  const handleCharacterView = useCallback(
    (characterId: string) => {
      navigate(buildRoute.characterSheet(campaignId, characterId), {
        state: { characterOrder: characters.map((c) => c.id) },
      });
    },
    [navigate, campaignId, characters]
  );

  const handleCreate = useCallback(async () => {
    const trimmedName = characterName.trim();

    // Validate character name
    const validation = validateCharacterName(trimmedName);
    if (!validation.isValid) {
      toast.warning(validation.error || "Invalid character name");
      return;
    }

    const recoveryCode = generateRecoveryCode();

    try {
      const characterData = createEmptyCharacterData({
        campaignId,
        recoveryCode,
        userId: null,
        characterName: trimmedName,
      });

      const ref = doc(collection(db, "campaigns", campaignId, "characters"));

      await setDoc(ref, characterData);

      await setDoc(doc(db, "recoveryIndex", recoveryCode), {
        campaignId,
        characterId: ref.id,
      });

      toast.success(
        `Character created successfully!\n\nRecovery Code: ${recoveryCode}\n\n(Click the copy button to save this code)`,
        IMPORTANT_TOAST_DURATION
      );
      setCharacterName("");
    } catch (err) {
      console.error("Character creation error:", err);
      toast.error("Failed to create character. Please try again.");
    }
  }, [campaignId, characterName, toast]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Create Character</h2>

      {/* CREATE CHARACTER */}
      <div className="flex gap-2">
        <input
          id="character-name-input"
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-64"
          placeholder="Character Name"
          value={characterName}
          onChange={handleNameChange}
          aria-label="New character name"
        />

        <button
          className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded"
          onClick={handleCreate}
          aria-label="Create new character"
        >
          Create
        </button>
      </div>

      {/* CHARACTER LIST */}
      <div>
        <h3 className="text-xl mb-2">Characters in campaign</h3>

        {characters.length === 0 ? (
          <p className="text-slate-400" role="status">
            No characters yet.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            role="list"
            aria-label="Characters in this campaign"
          >
            {characters.map((character) => (
              <li
                key={character.id}
                className="flex items-center justify-between border border-slate-700 rounded px-4 py-3 bg-slate-900/60"
              >
                <div>
                  <div className="font-semibold">
                    {character.header?.characterName ?? "Unnamed Character"}
                  </div>

                  <div className="text-xs text-slate-400">
                    Owner: {character.userId ?? "Unclaimed"} · Editable:{" "}
                    {character.isEditableByPlayer ? "Yes" : "No"}
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    Recovery: {character.recoveryCode}
                  </div>
                </div>

                <button
                  onClick={() => handleCharacterView(character.id)}
                  className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
                  aria-label={`View ${character.header?.characterName ?? "character"}`}
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CharacterSection;