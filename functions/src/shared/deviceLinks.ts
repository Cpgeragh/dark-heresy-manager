import { HttpsError } from "firebase-functions/v2/https";

export const MAX_DEVICE_NAME_CHARACTERS = 50;

export function validateDeviceName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Device name must be a string.");
  }
  const name = value.trim();
  if (name.length < 1 || name.length > MAX_DEVICE_NAME_CHARACTERS) {
    throw new HttpsError(
      "invalid-argument",
      `Device name must be between 1 and ${MAX_DEVICE_NAME_CHARACTERS} characters.`
    );
  }
  return name;
}

export function validateDeviceUid(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 128 || value.includes("/")) {
    throw new HttpsError("invalid-argument", "Device id is invalid.");
  }
  return value;
}
