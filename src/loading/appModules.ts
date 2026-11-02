import { cachedImport } from "../utils/prepareCode";

export const loadCharacterSheet = cachedImport(() => import("../pages/CharacterSheet"));
export const loadSettings = cachedImport(() => import("../pages/Settings"));
export const loadChatInbox = cachedImport(() =>
  import("../components/chat/ChatInboxModal").then(({ ChatInboxModal }) => ({
    default: ChatInboxModal,
  }))
);
