// src/pages/CampaignOverview/SessionCard.tsx

import { useState, useCallback, useRef } from "react";
import { recordComponentRender } from "../../performance/performanceMetrics";
import type { SessionListDocument } from "../../types/Firestore";
import {
  getSessionXpAffectedDocumentCount,
  type CloseSessionData,
  type SessionUpdateData,
} from "../../services/sessionService";
import { useToast } from "../../components/Toast";
import { Button } from "../../ui/buttons/Button";
import { CardOverlayButton } from "../../ui/buttons/CardOverlayButton";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { Chip } from "../../ui/chips/Chip";
import { CheckIcon } from "../../ui/icons/CheckIcon";
import { uiLayerLocal } from "../../ui/styles/layerStyles";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { uiCardTapHeader } from "../../ui/styles/buttonStyles";
import {
  uiInlineRow,
  uiSection,
  uiStackBody,
  uiStackList,
  uiTextBody,
  uiTextError,
  uiTextLabel,
  uiTextMeta,
  uiTextNotice,
} from "../../ui/styles/editableStyles";
import { colourDivider } from "../../ui/styles/colourTokens";
import { toSessionDate } from "../../utils/sessionDate";
import { isSessionOpen } from "../../utils/sessionStatus";
import { CloseSessionConfirmModal } from "./CloseSessionConfirmModal";
import { SessionForm } from "./SessionForm";

interface Character {
  id: string;
  characterName: string;
}

type SessionWithId = SessionListDocument & { id: string };

interface Props {
  session: SessionWithId;
  characters: Character[];
  isDM: boolean;
  onDelete?: (reverseXp: boolean) => Promise<void>;
  onSave?: (data: SessionUpdateData) => Promise<void>;
  onApplyXp?: () => Promise<void>;
  onCloseSession?: (data: CloseSessionData) => Promise<void>;
}

export function SessionCard({
  session,
  characters,
  isDM,
  onDelete,
  onSave,
  onApplyXp,
  onCloseSession,
}: Props) {
  recordComponentRender("SessionCard");
  const toast = useToast();
  const [view, setView] = useState<"none" | "notes" | "close" | "edit">("none");
  const [pendingClose, setPendingClose] = useState<CloseSessionData | null>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reverseXp, setReverseXp] = useState(false);
  const [applyingXp, setApplyingXp] = useState(false);
  const applyingXpRef = useRef(false);

  const isOpen = isSessionOpen(session);
  const tappable = isDM && isOpen && Boolean(onSave);
  const nameById = Object.fromEntries(characters.map((c) => [c.id, c.characterName]));
  const attendeeNames = session.attendees
    .map((id) => nameById[id] ?? id)
    .sort((a, b) => a.localeCompare(b));
  const hasSavedSummary = Boolean(session.summary.trim());
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

  const handleConfirmClose = useCallback(async () => {
    if (!pendingClose || !onCloseSession || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    try {
      await onCloseSession(pendingClose);
      toast.success("Session closed");
      setPendingClose(null);
      setView("none");
    } catch (err) {
      console.error("Failed to close session:", err);
      toast.error(err instanceof Error && err.message ? err.message : "Failed to close session");
      setPendingClose(null);
    } finally {
      closingRef.current = false;
      setClosing(false);
    }
  }, [pendingClose, onCloseSession, toast]);

  return (
    <div className={`${uiSection} ${uiStackList}${tappable ? ` ${uiCardTapHeader} relative` : ""}`}>
      {tappable && (
        <CardOverlayButton label={`Open session of ${dateStr}`} onClick={() => setView("notes")} />
      )}
      <div
        className={`${uiStackList}${tappable ? ` pointer-events-none relative ${uiLayerLocal}` : ""}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold lg:text-lg">{dateStr}</span>
          <div
            className={`${uiInlineRow}${tappable ? ` pointer-events-auto relative ${uiLayerLocal}` : ""}`}
          >
            {isOpen && <Chip colour="sky">In progress</Chip>}
            {!isOpen && session.xpAwarded > 0 && (
              <Chip colour="amber">+{session.xpAwarded} XP</Chip>
            )}
            {isDM &&
              !isOpen &&
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
            {isDM && !isOpen && onSave && (
              <Button variant="secondary" size="sm" onClick={() => setView("edit")}>
                Edit
              </Button>
            )}
            {tappable && onCloseSession && (
              <Button size="sm" disabled={!hasSavedSummary} onClick={() => setView("close")}>
                Close Session
              </Button>
            )}
            {isDM && onDelete && (
              <RemoveButton label="Delete session" onClick={() => setConfirmingDelete(true)} />
            )}
          </div>
        </div>

        {attendeeNames.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={uiTextLabel}>Attendees</span>
            <span className={`text-xs lg:text-sm ${uiTextBody}`}>{attendeeNames.join(", ")}</span>
          </div>
        )}
        {tappable && onCloseSession && !hasSavedSummary && (
          <p className={uiTextNotice}>Save the session notes before closing.</p>
        )}

        {session.summary && (
          <p className={`text-sm lg:text-base ${uiTextBody}`}>{session.summary}</p>
        )}

        {isDM && session.dmNotes && (
          <p className={`${uiTextMeta} border-t ${colourDivider} pt-2`}>DM: {session.dmNotes}</p>
        )}
      </div>

      {view === "notes" && onSave && (
        <SessionForm
          mode="open"
          characters={characters}
          session={session}
          onSave={onSave}
          onClose={() => setView("none")}
        />
      )}

      {view === "close" && onCloseSession && (
        <SessionForm
          mode="close"
          characters={characters}
          session={session}
          onRequestCloseSession={setPendingClose}
          onClose={() => setView("none")}
        />
      )}

      {pendingClose && (
        <CloseSessionConfirmModal
          xpAwarded={pendingClose.xpAwarded}
          attendeeNames={pendingClose.attendees.map((id) => nameById[id] ?? id)}
          busy={closing}
          onYes={() => void handleConfirmClose()}
          onNo={() => setPendingClose(null)}
        />
      )}

      {view === "edit" && onSave && (
        <SessionForm
          mode="edit"
          characters={characters}
          session={session}
          onSave={onSave}
          onClose={() => setView("none")}
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
