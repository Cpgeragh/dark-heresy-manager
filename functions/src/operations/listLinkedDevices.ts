import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export interface LinkedDeviceSummary {
  uid: string;
  name: string | null;
  linkedAt: number | null;
  isCurrentDevice: boolean;
}

export interface ListLinkedDevicesResult {
  devices: LinkedDeviceSummary[];
}

/** Returns every device connected to the caller's permanent account. */
export async function listLinkedDevices(callerUid: string): Promise<ListLinkedDevicesResult> {
  const db = getFirestore();
  const callerLink = await db.collection("userLinks").doc(callerUid).get();
  const accountId = callerLink.data()?.primaryUid;
  if (!callerLink.exists || typeof accountId !== "string" || accountId.length === 0) {
    throw new HttpsError("failed-precondition", "This device is not connected to an account.");
  }

  const links = await db.collection("userLinks").where("primaryUid", "==", accountId).get();
  const devices = links.docs.map((link) => {
    const data = link.data();
    const linkedAt = data.linkedAt instanceof Timestamp ? data.linkedAt.toMillis() : null;
    return {
      uid: link.id,
      name: typeof data.name === "string" && data.name.trim() ? data.name : null,
      linkedAt,
      isCurrentDevice: link.id === callerUid,
    };
  });
  devices.sort(
    (left, right) =>
      Number(right.isCurrentDevice) - Number(left.isCurrentDevice) ||
      (right.linkedAt ?? 0) - (left.linkedAt ?? 0) ||
      left.uid.localeCompare(right.uid)
  );
  return { devices };
}
