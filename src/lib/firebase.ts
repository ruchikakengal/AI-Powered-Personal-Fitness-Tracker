import type { FirebaseApp } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

type FirebaseEnv = {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
};

function getEnv(): FirebaseEnv {
  type ImportMetaEnv = { readonly env?: Partial<FirebaseEnv> };
  const meta = import.meta as unknown as ImportMetaEnv;
  return (meta.env ?? {}) as FirebaseEnv;
}

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  // initializeApp is safe even if called multiple times, but we still guard with `getApps()`.
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  const env = getEnv();
  const apiKey = env.VITE_FIREBASE_API_KEY ?? "";
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId = env.VITE_FIREBASE_PROJECT_ID ?? "";
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = env.VITE_FIREBASE_APP_ID ?? "";

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Missing Firebase env vars. Add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` to your `.env`.",
    );
  }

  app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });

  return app;
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

