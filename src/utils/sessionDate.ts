import type { Timestamp } from "firebase/firestore";
import type { SessionListDocument } from "../types/Firestore";

export function toSessionDate(value: SessionListDocument["date"]): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as Timestamp).toDate === "function")
    return (value as Timestamp).toDate();
  return new Date();
}

export function toSessionInputDate(value: SessionListDocument["date"]): string {
  return toSessionDate(value).toISOString().split("T")[0];
}
