// src/components/chat/ChatAvatar.tsx

import { useState } from "react";
import { colourControlRaised, colourTextMuted } from "../../ui/styles/colourTokens";
import { getInitials } from "../../utils/chatInitials";

export type ChatAvatarPicture =
  | { status: "loading" }
  | { status: "none" }
  | { status: "ready"; url: string };

interface ImageResult {
  url: string;
  state: "loaded" | "failed";
}

export function ChatAvatar({ name, picture }: { name: string; picture: ChatAvatarPicture }) {
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);

  const url = picture.status === "ready" ? picture.url : null;
  const result = url !== null && imageResult?.url === url ? imageResult.state : "pending";
  const showInitials = picture.status === "none" || result === "failed";

  return (
    <div
      aria-hidden="true"
      className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden border flex items-center justify-center ${colourControlRaised}`}
    >
      {showInitials && (
        <span className={`text-sm lg:text-base font-semibold ${colourTextMuted}`}>
          {getInitials(name)}
        </span>
      )}
      {url !== null && result !== "failed" && (
        <img
          src={url}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-200 motion-reduce:transition-none ${
            result === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageResult({ url, state: "loaded" })}
          onError={() => setImageResult({ url, state: "failed" })}
        />
      )}
    </div>
  );
}
