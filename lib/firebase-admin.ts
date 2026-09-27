import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getAuth,
  type Auth,
} from "firebase-admin/auth";

import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

let adminApp: App | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  const existingApp = getApps()[0];

  adminApp =
    existingApp ||
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

  return adminApp;
}

function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getAdminApp());
  }

  return authInstance;
}

function getDbInstance(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getAdminApp());
  }

  return dbInstance;
}

export const adminAuth = new Proxy(
  {} as Auth,
  {
    get(_target, property) {
      const target =
        getAuthInstance();

      const value =
        (target as any)[property];

      if (typeof value === "function") {
        return value.bind(target);
      }

      return value;
    },
  }
);

export const adminDb = new Proxy(
  {} as Firestore,
  {
    get(_target, property) {
      const target =
        getDbInstance();

      const value =
        (target as any)[property];

      if (typeof value === "function") {
        return value.bind(target);
      }

      return value;
    },
  }
);