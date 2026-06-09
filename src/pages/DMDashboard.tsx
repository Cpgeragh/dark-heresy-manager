// src/pages/DMDashboard.tsx

import { useState } from "react";
import type { User } from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { useCampaigns } from "../hooks/useCampaigns";
import CampaignSection from "./DMDashboard/CampaignSection";

const APP_URL = "https://dark-heresy-manager.web.app";

interface Props {
  user: User;
}

export default function DMDashboard({ user }: Props) {
  const { campaigns, loading } = useCampaigns(user.uid);
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="text-slate-100">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-4xl font-bold">DM Dashboard</h1>
        <button
          onClick={() => setShowQR((v) => !v)}
          className="px-3 py-1.5 text-sm rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
        >
          {showQR ? "Hide QR" : "Player Install"}
        </button>
      </div>

      {showQR && (
        <div className="mb-8 flex flex-col items-center gap-3 border border-slate-700 rounded-lg p-6 bg-slate-900/60 max-w-xs">
          <p className="text-sm text-slate-400 text-center">
            Show this to your players — scan to install the app, then claim a character.
          </p>
          <div className="p-3 bg-white rounded-lg">
            <QRCodeSVG value={APP_URL} size={192} />
          </div>
          <p className="text-xs text-slate-600 font-mono break-all text-center">{APP_URL}</p>
        </div>
      )}

      <CampaignSection
        userUid={user.uid}
        campaigns={campaigns}
        loading={loading}
      />
    </div>
  );
}
