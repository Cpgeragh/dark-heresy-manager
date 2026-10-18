// src/pages/CampaignOverview/PartySection.tsx

import { useCallback, useMemo, useRef, useState } from "react";
import { useCampaignCharacters } from "../../hooks/useCampaignCharacters";
import { useCampaignCharacterSummaries } from "../../hooks/useCampaignCharacterSummaries";
import { useDeletionChatChoice } from "../../components/chat/useDeletionChatChoice";
import { useToast } from "../../components/Toast";
import { createNewCharacter } from "../../services/characterService";
import { validateCharacterName } from "../../utils/validation";
import { IMPORTANT_TOAST_DURATION } from "../../constants/ui";
import { PRODUCT_LIMITS } from "../../constants/productLimits";
import {
  editableInputClass,
  uiSplitRow,
  uiStackBody,
  uiStackList,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { AddButton } from "../../ui/buttons/AddButton";
import { Button } from "../../ui/buttons/Button";
import { RequiredFieldsNote } from "../../ui/forms/CustomFormFooter";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { ErrorState } from "../../ui/ErrorState";
import { RouteLoadError } from "../../ui/RouteLoadError";
import { useRouteLoading } from "../../context/useRouteReady";
import { CharacterRow } from "./CharacterRow";
import { MyCharacterCard } from "./MyCharacterCard";
import { PartyRosterTile } from "./PartyRosterTile";
import { RolePlaque } from "./RolePlaque";
import { SectionPending } from "./SectionPending";

interface PartySectionProps {
  campaignId: string;
  isDM: boolean;
  effectiveUserId: string;
  gmName?: string;
  inquisitorName?: string;
}

export function PartySection({
  campaignId,
  isDM,
  effectiveUserId,
  gmName,
  inquisitorName,
}: PartySectionProps) {
  const toast = useToast();
  const { ask: askAboutChats, modals: deletionChatModals } = useDeletionChatChoice({
    accountId: effectiveUserId,
    about: "character",
  });
  const {
    characters,
    loading: charactersLoading,
    error: charactersError,
  } = useCampaignCharacters(isDM ? null : campaignId, effectiveUserId);
  const {
    summaries: partySummaries,
    loading: summariesLoading,
    error: summariesError,
  } = useCampaignCharacterSummaries(campaignId);
  const loading = charactersLoading || summariesLoading;
  useRouteLoading(loading);

  const [search, setSearch] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const creatingCharacterRef = useRef(false);
  const newCharacterNameValid = validateCharacterName(newCharacterName.trim()).isValid;

  const closeCreate = useCallback(() => {
    if (creatingCharacterRef.current) return;
    setCreateOpen(false);
    setNewCharacterName("");
  }, []);

  const partyMembers = useMemo(() => {
    const ownCharacterIds = new Set(characters.map((c) => c.id));
    return partySummaries.filter((s) => !ownCharacterIds.has(s.id));
  }, [characters, partySummaries]);

  const handleCreate = useCallback(async () => {
    if (creatingCharacterRef.current) return;
    const name = newCharacterName.trim();
    const validation = validateCharacterName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid character name");
      return;
    }
    creatingCharacterRef.current = true;
    setCreatingCharacter(true);
    try {
      const recoveryCode = await createNewCharacter(campaignId, name);
      toast.success(
        `Character created!\n\nRecovery Code: ${recoveryCode}\n\n(Click the copy button to save this code)`,
        IMPORTANT_TOAST_DURATION,
        recoveryCode
      );
      setNewCharacterName("");
      setCreateOpen(false);
    } catch (err) {
      console.error("Character creation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create character.");
    } finally {
      creatingCharacterRef.current = false;
      setCreatingCharacter(false);
    }
  }, [campaignId, newCharacterName, toast]);

  if (charactersError) return <RouteLoadError resource="campaign" />;
  if (loading) return <SectionPending />;

  const plaques =
    gmName || inquisitorName ? (
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
        {gmName && <RolePlaque role="Game Master" name={gmName} />}
        {inquisitorName && <RolePlaque role="Inquisitor" name={inquisitorName} />}
      </div>
    ) : null;

  if (isDM) {
    const filteredCharacters = search.trim()
      ? partySummaries.filter((c) =>
          c.characterName.toLowerCase().includes(search.trim().toLowerCase())
        )
      : partySummaries;

    return (
      <div>
        {plaques}
        <div className={`${uiSplitRow} mb-3`}>
          <div className="w-1/2">
            <input
              type="search"
              name="character-search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={editableInputClass(true) + " h-10"}
              autoComplete="off"
              enterKeyHint="search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <AddButton label="Create character" onClick={() => setCreateOpen(true)} />
        </div>

        <div className={uiStackList}>
          {filteredCharacters.length === 0 ? (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
              {search.trim() ? `No characters match "${search}".` : "No characters yet."}
            </p>
          ) : (
            filteredCharacters.map((char) => (
              <CharacterRow
                key={char.id}
                campaignId={campaignId}
                characterId={char.id}
                characterName={char.characterName}
                userId={char.userId}
                portraitUrl={char.portraitUrl}
                isDM={isDM}
                onDeleted={(deletedId) =>
                  void askAboutChats({ campaignId, characterId: deletedId })
                }
              />
            ))
          )}
        </div>
        {deletionChatModals}
        {createOpen && (
          <PickerModal
            title="Create Character"
            query=""
            onQueryChange={() => undefined}
            onClose={closeCreate}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
            footer={
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="submit"
                  form="create-character-form"
                  variant="primary"
                  disabled={!newCharacterNameValid}
                  loading={creatingCharacter}
                  loadingLabel="Creating"
                >
                  Create
                </Button>
                <Button variant="neutral" disabled={creatingCharacter} onClick={closeCreate}>
                  Cancel
                </Button>
              </div>
            }
          >
            <PickerBody>
              <form
                id="create-character-form"
                className={uiStackBody}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCreate();
                }}
              >
                <div>
                  <RequiredFormLabel htmlFor="new-character-name">Character Name</RequiredFormLabel>
                  <input
                    id="new-character-name"
                    className={`${editableInputClass(true)} mt-0.5`}
                    value={newCharacterName}
                    maxLength={PRODUCT_LIMITS.characterNameCharacters}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    disabled={creatingCharacter}
                    autoFocus
                    aria-required="true"
                    aria-label="Character name"
                    autoComplete="off"
                  />
                </div>
                <RequiredFieldsNote />
              </form>
            </PickerBody>
          </PickerModal>
        )}
      </div>
    );
  }

  return (
    <div className={uiStackList}>
      {plaques}
      {characters.length === 0 && (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
          You haven't claimed a character in this campaign yet.
        </p>
      )}
      {characters.map((c) => (
        <MyCharacterCard key={c.id} character={c} campaignId={campaignId} />
      ))}
      {summariesError ? (
        <ErrorState>Unable to load the party roster. Please refresh the page.</ErrorState>
      ) : partyMembers.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No one else has joined yet.</p>
      ) : (
        partyMembers.map((s) => <PartyRosterTile key={s.id} summary={s} />)
      )}
    </div>
  );
}
