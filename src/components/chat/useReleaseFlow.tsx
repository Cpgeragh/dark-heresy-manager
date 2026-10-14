// src/components/chat/useReleaseFlow.tsx
//
// Runs the release sequence: confirm, release, then, only if the person has a live chat about the
// character, ask whether to keep it. The chat is looked up before the release, so the release
// closing it cannot change the answer.

import { useCallback, useState, type ReactNode } from "react";
import { CHAT_LIMITS } from "shared-rules";
import { useChatsContext } from "../../context/useChatsContext";
import { clearChat } from "../../services/chatService";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { isChatBinned } from "../../utils/chatBin";
import { useToast } from "../Toast";
import { KeepOrDeleteChatModal } from "./KeepOrDeleteChatModal";
import { ReleaseConfirmModal } from "./ReleaseConfirmModal";

type Step = "idle" | "confirm" | "releasing" | "keepOrDelete";

interface UseReleaseFlowOptions {
  accountId: string;
  chatId: string | null;
  release: () => Promise<boolean>;
  onFinished: () => void;
  confirm: { title: string; message: string; confirmLabel: string };
}

export function useReleaseFlow({
  accountId,
  chatId,
  release,
  onFinished,
  confirm,
}: UseReleaseFlowOptions): { begin: () => void; active: boolean; modals: ReactNode } {
  const { chats } = useChatsContext();
  const toast = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [chatToDecide, setChatToDecide] = useState<ChatSummaryWithId | null>(null);
  const [deleting, setDeleting] = useState(false);

  const finish = () => {
    setStep("idle");
    setChatToDecide(null);
    onFinished();
  };

  const handleConfirm = async () => {
    const chat = chatId ? (chats.find((entry) => entry.id === chatId) ?? null) : null;
    setStep("releasing");

    let released = false;
    try {
      released = await release();
    } catch (releaseError) {
      console.error("Release failed:", releaseError);
    }
    if (!released) {
      setStep("idle");
      return;
    }

    if (chat && !isChatBinned(chat)) {
      setChatToDecide(chat);
      setStep("keepOrDelete");
      return;
    }
    finish();
  };

  const handleDelete = async () => {
    if (!chatToDecide) return;
    setDeleting(true);
    try {
      await clearChat(accountId, chatToDecide.id);
      toast.success(
        `Chat moved to Recently deleted. You can restore it for ${CHAT_LIMITS.binRetentionDays} days.`
      );
      finish();
    } catch (deleteError) {
      console.error("Failed to delete chat:", deleteError);
      toast.error("Failed to delete the chat. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const modals = (
    <>
      {(step === "confirm" || step === "releasing") && (
        <ReleaseConfirmModal
          {...confirm}
          busy={step === "releasing"}
          onConfirm={handleConfirm}
          onCancel={() => setStep("idle")}
        />
      )}
      {step === "keepOrDelete" && (
        <KeepOrDeleteChatModal busy={deleting} onKeep={finish} onDelete={handleDelete} />
      )}
    </>
  );

  const begin = useCallback(() => setStep("confirm"), []);

  return { begin, active: step !== "idle", modals };
}
