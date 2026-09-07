export const PERFORMANCE_PROJECT_ID: "dh-test";
export const PERFORMANCE_PORTS: Readonly<{
  firestore: 8080;
  functions: 5001;
  auth: 9099;
}>;

export function verifyPerformanceConfiguration(rootDir: string): Promise<void>;

export function createPerformanceEnvironment(
  baseEnvironment?: Record<string, string | undefined>,
  revision?: string
): Record<string, string | undefined> & {
  VITE_FIREBASE_PROJECT_ID: "dh-test";
  GCLOUD_PROJECT: "dh-test";
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080";
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099";
};
