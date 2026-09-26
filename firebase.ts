import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGzlMUp9L9oHWS1H7NwmU_JZGw_2z1EisM",
  authDomain: "the-champ-t.firebaseapp.com",
  projectId: "the-champ-t",
  storageBucket: "the-champ-t.firebasestorage.app",
  messagingSenderId: "960233930038",
  appId: "1:960233930038:web:53038c29146c6732164797",
  measurementId: "G-CVV29QC12W",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;