import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "dark-heresy-manager.firebaseapp.com",
  projectId: "dark-heresy-manager",
  storageBucket: "dark-heresy-manager.firebasestorage.app",
  messagingSenderId: "628100439548",
  appId: "1:628100439548:web:cb04ccaba23aa03441e679"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
