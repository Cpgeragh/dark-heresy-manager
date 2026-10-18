// src/pages/CampaignOverview/SessionHistorySection.tsx

import { useMemo, useState } from "react";
import { useSessions } from "../../hooks/useSessions";
import { useCampaignCharacterSummaries } from "../../hooks/useCampaignCharacterSummaries";
import { applySessionXp } from "../../services/sessionService";
import {
  uiStackBody,
  uiStackList,
  uiTextNotice,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { Button } from "../../ui/buttons/Button";
import { ErrorState } from "../../ui/ErrorState";
import { useRouteLoading } from "../../context/useRouteReady";
import { BeginSessionForm } from "./BeginSessionForm";
import { SessionCard } from "./SessionCard";
import { SectionPending } from "./SectionPending";

interface SessionHistorySectionProps {
  campaignId: string;
  isDM: boolean;
}

export function SessionHistorySection({ campaignId, isDM }: SessionHistorySectionProps) {
  const {
    sessions,
    openSession,
    loading: sessionsLoading,
    error: sessionsError,
    startSession,
    closeSession,
    deleteSession,
    updateSession,
  } = useSessions(campaignId, isDM);
  const { summaries, loading: summariesLoading } = useCampaignCharacterSummaries(campaignId);
  const loading = sessionsLoading || summariesLoading;
  useRouteLoading(loading);

  const [showBeginForm, setShowBeginForm] = useState(false);

  const sessionCharacters = useMemo(
    () =>
      summaries.map((summary) => ({
        id: summary.id,
        characterName: summary.characterName,
        userId: summary.userId ?? null,
      })),
    [summaries]
  );

  if (loading) return <SectionPending />;

  return (
    <div className={uiStackBody}>
      {isDM && showBeginForm && (
        <BeginSessionForm
          characters={sessionCharacters}
          onBegin={startSession}
          onClose={() => setShowBeginForm(false)}
        />
      )}

      {isDM && (
        <div className={uiStackList}>
          <Button
            className="w-full sm:w-auto sm:self-start"
            disabled={openSession !== null}
            onClick={() => setShowBeginForm(true)}
          >
            Begin Session
          </Button>
          {openSession && (
            <p className={uiTextNotice}>Close the open session before beginning another.</p>
          )}
        </div>
      )}

      {sessionsError ? (
        <ErrorState>Unable to load sessions. Please refresh the page.</ErrorState>
      ) : sessions.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No sessions recorded yet.</p>
      ) : (
        <div className={uiStackList}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              characters={sessionCharacters}
              isDM={isDM}
              onDelete={isDM ? (reverseXp) => deleteSession(session.id, reverseXp) : undefined}
              onSave={isDM ? (data) => updateSession(session.id, data) : undefined}
              onCloseSession={isDM ? (data) => closeSession(session.id, data) : undefined}
              onApplyXp={
                isDM
                  ? () =>
                      applySessionXp(campaignId, session.id, session.attendees, session.xpAwarded)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
