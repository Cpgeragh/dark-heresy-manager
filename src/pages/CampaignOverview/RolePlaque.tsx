// src/pages/CampaignOverview/RolePlaque.tsx

import { colourDivider } from "../../ui/styles/colourTokens";
import { uiCell, uiRoleLabel, uiRoleName } from "../../ui/styles/editableStyles";

export function RolePlaque({ role, name }: { role: string; name: string }) {
  return (
    <div className={`${uiCell} px-4 py-3 text-center`}>
      <div className={uiRoleLabel}>{role}</div>
      <div className={`mx-auto my-2 w-12 border-t ${colourDivider}`} />
      <div className={uiRoleName}>{name}</div>
    </div>
  );
}
