import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

export type FirebaseBundle = { app: FirebaseApp; db: Firestore };

let cachedStorage: FirebaseStorage | null = null;
let storageInitPromise: Promise<FirebaseStorage> | null = null;

export function getFirebaseClient(): FirebaseBundle | null {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  } as const;

  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null;
  const app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  const db = getFirestore(app);
  return { app, db };
}

export async function getFirebaseStorage(): Promise<FirebaseStorage | null> {
  const bundle = getFirebaseClient();
  if (!bundle) return null;
  if (cachedStorage) return cachedStorage;
  if (!storageInitPromise) {
    storageInitPromise = import("firebase/storage")
      .then(({ getStorage }) => {
        const storage = getStorage(bundle.app);
        cachedStorage = storage;
        return storage;
      })
      .catch((err) => {
        storageInitPromise = null;
        throw err;
      });
  }
  return storageInitPromise;
}
