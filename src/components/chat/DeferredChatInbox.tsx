import { lazy, Suspense, useState } from "react";
import { useChatInbox } from "../../context/useChatInbox";
import { loadChatInbox } from "../../loading/appModules";
import { AppPanelLoading } from "../AppPanelLoading";

const ChatInboxModal = lazy(loadChatInbox);

export function DeferredChatInbox({ accountId }: { accountId: string }) {
  const { view } = useChatInbox();
  const [requested, setRequested] = useState(false);
  if (!requested && view.kind !== "closed") setRequested(true);
  // Keep the loaded inbox mounted while closed, preserving its existing list state.
  if (!requested) return null;
  return (
    <Suspense fallback={view.kind === "closed" ? null : <AppPanelLoading />}>
      <ChatInboxModal accountId={accountId} />
    </Suspense>
  );
}
