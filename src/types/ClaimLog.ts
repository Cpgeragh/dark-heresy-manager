export interface ClaimLog {
  id?: string;
  actorUid: string;
  action: "claim" | "release";
  timestamp: number;
}
