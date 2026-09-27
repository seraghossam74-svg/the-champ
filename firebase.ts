import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDGzlMUpL9oHWS1H7NwmU_JZGw_2z1EisM",
  authDomain: "the-champ-t.firebaseapp.com",
  projectId: "the-champ-t",
  storageBucket: "the-champ-t.firebasestorage.app",
  messagingSenderId: "960233930038",
  appId: "1:960233930038:web:53038c29146c6732164797",
};

const app = initializeApp(firebaseConfig);

export default app;