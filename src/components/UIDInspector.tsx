// src/components/UIDInspector.tsx

export default function UIDInspector({
  uid,
  role,
  campaign,
}: {
  uid: string;
  role: string;
  campaign: string | null;
}) {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-2 right-2 bg-black/70 text-xs text-amber-300 p-3 border border-amber-600 rounded shadow-lg pointer-events-none">
      <div>
        UID: <span className="text-white">{uid}</span>
      </div>
      <div>
        Role: <span className="text-white">{role}</span>
      </div>
      <div>
        Campaign: <span className="text-white">{campaign ?? "None"}</span>
      </div>
    </div>
  );
}
