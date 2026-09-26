import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDGzlMUpL9oHWS1H7NwmU_JZGw_2z1EisM",
  authDomain: "the-champ-t.firebaseapp.com",
  projectId: "the-champ-t",
  storageBucket: "the-champ-t.firebasestorage.app",
  messagingSenderId: "960233930038",
  appId: "1:960233930038:web:53038c29146c6732164797",
  measurementId: "G-CVV29QC12W",
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;