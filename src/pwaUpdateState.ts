// src/pwaUpdateState.ts
// Tiny module-level flag bridging the pre-React service-worker registration
// (main.tsx) and the in-app toast system (App.tsx). Set when an update started
// downloading but stalled, so the app can warn the user once it mounts.

let stalled = false;
let postUpgrade = false;

export const markUpdateStalled = () => {
  stalled = true;
};

export const consumeUpdateStalled = () => {
  const value = stalled;
  stalled = false;
  return value;
};

export const markPostUpgrade = () => {
  postUpgrade = true;
};

export const consumePostUpgrade = () => {
  const value = postUpgrade;
  postUpgrade = false;
  return value;
};
