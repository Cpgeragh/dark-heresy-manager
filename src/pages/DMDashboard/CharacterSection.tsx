// src/pages/DMDashboard/CharacterSection.tsx

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
  }, []);

  const handleCharacterView = useCallback(
    (characterId: string) => {
      navigate(buildRoute.characterSheet(campaignId, characterId));
    },
    [navigate, campaignId]
  );

  const handleDelete = useCallback(async (character: CharacterListItem) => {
    try {
      const charRef = doc(db, "campaigns", campaignId, "characters", character.id);
      const recoveryRef = doc(db, "recoveryIndex", character.recoveryCode);
      const batch = writeBatch(db);
      batch.delete(charRef);
      batch.delete(recoveryRef);
      await batch.commit();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Character deletion error:", err);
      toast.error("Failed to delete character. Please try again.");
    }
  }, [campaignId, toast]);

  const handleClone = useCallback(async (character: CharacterListItem) => {
    try {
      const sourceSnap = await getDoc(
        doc(db, "campaigns", campaignId, "characters", character.id)
      );
      if (!sourceSnap.exists()) {
        toast.error("Character not found.");
        return;
      }

      const recoveryCode = generateRecoveryCode();
      const originalName = character.header?.characterName ?? "Unnamed Character";
      const sourceData = sourceSnap.data();
      const cloneData = {
        ...sourceData,
        userId: null,
        isEditableByPlayer: false,
        recoveryCode,
        header: { ...sourceData.header, characterName: `Copy of ${originalName}` },
      };

      const newCharRef = doc(collection(db, "campaigns", campaignId, "characters"));
      const batch = writeBatch(db);
      batch.set(newCharRef, cloneData);
      batch.set(doc(db, "recoveryIndex", recoveryCode), { campaignId, characterId: newCharRef.id });
      await batch.commit();

      toast.success(`Character cloned as "Copy of ${originalName}"`);
    } catch (err) {
      console.error("Character clone error:", err);
      toast.error("Failed to clone character. Please try again.");
    }
  }, [campaignId, toast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data.recoveryCode !== "string" || typeof data.isEditableByPlayer !== "boolean") {
        toast.error("Invalid character file.");
        return;
      }
      const recoveryCode = generateRecoveryCode();
      const importData = { ...data, userId: null, isEditableByPlayer: false, recoveryCode };
      const charRef = doc(collection(db, "campaigns", campaignId, "characters"));
      const batch = writeBatch(db);
      batch.set(charRef, importData);
      batch.set(doc(db, "recoveryIndex", recoveryCode), { campaignId, characterId: charRef.id });
      await batch.commit();
      toast.success(
        `Imported "${data.header?.characterName ?? "character"}" successfully`,
        IMPORTANT_TOAST_DURATION
      );
    } catch {
      toast.error("Failed to import character. Check the file and try again.");
    }
    e.target.value = "";
  }, [campaignId, toast]);

  const handleCreate = useCallback(async () => {
    const trimmedName = characterName.trim();

    // Validate character name
    const validation = validateCharacterName(trimmedName);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid character name");
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

      const charRef = doc(collection(db, "campaigns", campaignId, "characters"));
      const recoveryRef = doc(db, "recoveryIndex", recoveryCode);

      const batch = writeBatch(db);
      batch.set(charRef, characterData);
      batch.set(recoveryRef, { campaignId, characterId: charRef.id });
      await batch.commit();

      toast.success(
        `Character created successfully!\n\nRecovery Code: ${recoveryCode}\n\n(Click the copy button to save this code)`,
        IMPORTANT_TOAST_DURATION,
        recoveryCode,
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

        <label className="px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded cursor-pointer hover:bg-slate-600">
          Import JSON
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </label>
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

                {confirmDeleteId === character.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Delete?</span>
                    <button
                      onClick={() => handleDelete(character)}
                      className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCharacterView(character.id)}
                      className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
                      aria-label={`View ${character.header?.characterName ?? "character"}`}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleClone(character)}
                      className="px-3 py-1 text-xs rounded bg-slate-600 text-slate-200 hover:bg-slate-500"
                      aria-label={`Clone ${character.header?.characterName ?? "character"}`}
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(character.id)}
                      className="px-3 py-1 text-xs rounded bg-red-900/60 text-red-400 hover:bg-red-800/60"
                      aria-label={`Delete ${character.header?.characterName ?? "character"}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CharacterSection;