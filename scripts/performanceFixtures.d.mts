export type PerformanceProfileName =
  | "new-account"
  | "empty"
  | "small"
  | "large-character"
  | "large-dm"
  | "long-thread";

export interface PerformanceFixtureWrite {
  path: string;
  data: Record<string, unknown>;
}

export interface PerformanceProfile {
  writes: PerformanceFixtureWrite[];
  route: string;
  campaignId?: string;
  characterId?: string;
}

export const PERFORMANCE_PROFILE_NAMES: PerformanceProfileName[];
export function buildPerformanceProfile(
  profileName: PerformanceProfileName,
  uid: string
): PerformanceProfile;
export function characterDocumentFromProfile(
  profile: PerformanceProfile,
  campaignId: string,
  characterId: string
): Record<string, unknown> | undefined;
export function serialisedBytes(value: unknown): number;
