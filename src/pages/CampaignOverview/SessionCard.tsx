// src/pages/CampaignOverview/SessionCard.tsx

import { useState, useCallback, useRef } from "react";
import { recordComponentRender } from "../../performance/performanceMetrics";
import type { SessionListDocument } from "../../types/Firestore";
import {
  getSessionXpAffectedDocumentCount,
  type SessionUpdateData,
} from "../../services/sessionService";
import { useToast } from "../../components/Toast";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { CheckIcon } from "../../ui/icons/CheckIcon";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import {
  uiInlineRow,
  uiSection,
  uiStackBody,
  uiStackList,
  uiTextBody,
  uiTextError,
  uiTextMeta,
} from "../../ui/styles/editableStyles";
import { colourDivider } from "../../ui/styles/colourTokens";
import { toSessionDate } from "../../utils/sessionDate";
import { SessionForm } from "./SessionForm";

interface Character {
  id: string;
  characterName: string;
}

type SessionWithId = SessionListDocument & { id: string };

interface Props {
  campaignId: string;
  session: SessionWithId;
  characters: Character[];
  isDM: boolean;
  onDelete?: (reverseXp: boolean) => Promise<void>;
  onSave?: (data: SessionUpdateData) => Promise<void>;
  onApplyXp?: () => Promise<void>;
}

export function SessionCard({
  campaignId,
  session,
  characters,
  isDM,
  onDelete,
  onSave,
  onApplyXp,
}: Props) {
  recordComponentRender("SessionCard");
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reverseXp, setReverseXp] = useState(false);
  const [applyingXp, setApplyingXp] = useState(false);
  const applyingXpRef = useRef(false);

  const nameById = Object.fromEntries(characters.map((c) => [c.id, c.characterName]));
  const dateStr = toSessionDate(session.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const xpAffectedDocuments = getSessionXpAffectedDocumentCount(session.attendees.length);

  const closeDelete = useCallback(() => {
    if (deletingRef.current) return;
    setConfirmingDelete(false);
    setReverseXp(false);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!onDelete || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await onDelete(reverseXp);
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session. Please try again.");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
      setConfirmingDelete(false);
      setReverseXp(false);
    }
  }, [onDelete, reverseXp, toast]);

  const handleApplyXp = useCallback(async () => {
    if (!onApplyXp || applyingXpRef.current) return;
    applyingXpRef.current = true;
    setApplyingXp(true);
    try {
      await onApplyXp();
      toast.success(
        `+${session.xpAwarded} XP applied to ${session.attendees.length} character(s).`
      );
    } catch (err) {
      console.error("Failed to apply XP:", err);
      toast.error("Failed to apply XP. Please try again.");
    } finally {
      applyingXpRef.current = false;
      setApplyingXp(false);
    }
  }, [onApplyXp, session.xpAwarded, session.attendees.length, toast]);

  return (
    <div className={`${uiSection} ${uiStackList}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold lg:text-lg">{dateStr}</span>
        <div className={`${uiInlineRow}`}>
          {session.xpAwarded > 0 && <Chip colour="amber">+{session.xpAwarded} XP</Chip>}
          {isDM &&
            session.xpAwarded > 0 &&
            session.attendees.length > 0 &&
            session.xpApplied !== undefined &&
            (session.xpApplied === true ? (
              <Chip colour="green">
                <span>XP Applied</span>
                <CheckIcon className="h-[1em] w-[1em]" />
              </Chip>
            ) : (
              <Button
                size="sm"
                onClick={handleApplyXp}
                loading={applyingXp}
                loadingLabel="Applying"
              >
                Apply XP
              </Button>
            ))}
          {isDM && onSave && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {isDM && onDelete && (
            <Button variant="dangerGhost" size="sm" onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {session.attendees.length > 0 && (
        <p className={uiTextMeta}>
          Attendees: {session.attendees.map((id) => nameById[id] ?? id).join(", ")}
        </p>
      )}

      {session.summary && <p className={`text-sm lg:text-base ${uiTextBody}`}>{session.summary}</p>}

      {isDM && session.dmNotes && (
        <p className={`${uiTextMeta} border-t ${colourDivider} pt-2`}>DM: {session.dmNotes}</p>
      )}

      {editing && onSave && (
        <SessionForm
          campaignId={campaignId}
          characters={characters}
          session={session}
          onSave={onSave}
          onClose={() => setEditing(false)}
        />
      )}

      {confirmingDelete && (
        <PickerModal
          title="Delete Session"
          query=""
          onQueryChange={() => undefined}
          onClose={closeDelete}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                loading={deleting}
                loadingLabel="Deleting"
                onClick={() => handleDelete()}
              >
                Delete
              </Button>
              <Button variant="neutral" disabled={deleting} onClick={closeDelete}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <div className={uiStackBody}>
              <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
                Delete the session on {dateStr}?
              </p>
              {session.xpApplied === true && (
                <>
                  <p className={`text-xs lg:text-sm ${uiTextError}`}>
                    This session's XP was already applied. Deleting it won't remove that XP unless
                    checked below.
                  </p>
                  <label
                    className={`flex items-center gap-1.5 text-xs lg:text-sm ${uiTextBody} cursor-pointer`}
                  >
                    <input
                      type="checkbox"
                      checked={reverseXp}
                      onChange={(e) => setReverseXp(e.target.checked)}
                      disabled={deleting}
                    />
                    Also remove {session.xpAwarded} XP from attendees
                  </label>
                  <p className={uiTextMeta}>
                    This will affect {reverseXp ? xpAffectedDocuments : 2} documents.
                  </p>
                </>
              )}
            </div>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
