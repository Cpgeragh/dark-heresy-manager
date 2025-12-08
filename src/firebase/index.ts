// src/firebase/index.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "dark-heresy-manager",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);