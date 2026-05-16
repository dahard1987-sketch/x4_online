import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfigKeys = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const;

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing Firebase environment variable: ${name}. Add it to .env.local with the NEXT_PUBLIC_ prefix.`,
    );
  }

  return value;
}

const firebaseConfig = {
  apiKey: readRequiredEnv(firebaseConfigKeys.apiKey),
  authDomain: readRequiredEnv(firebaseConfigKeys.authDomain),
  projectId: readRequiredEnv(firebaseConfigKeys.projectId),
  storageBucket: readRequiredEnv(firebaseConfigKeys.storageBucket),
  messagingSenderId: readRequiredEnv(firebaseConfigKeys.messagingSenderId),
  appId: readRequiredEnv(firebaseConfigKeys.appId),
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
