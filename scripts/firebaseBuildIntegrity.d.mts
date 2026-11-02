import type { Plugin } from "vite";
export const buildRecordName: string;
export function hash(value: string | Uint8Array): string;
export function configurationFingerprint(environment: Record<string, string | undefined>): string;
export function firebaseBuildIntegrityPlugin(): Plugin;
export function verifyBuildEnvironment(
  buildDirectory: string,
  project: string,
  targets: Record<string, { mode: string; fingerprint: string }>
): { project: string; mode: string };
