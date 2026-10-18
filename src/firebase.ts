import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBMMT-XM_L5oQyT-aBZuUjKm-ngrlm-aPk",
  authDomain: "slutuppgift-js2-filip.firebaseapp.com",
  databaseURL: "https://slutuppgift-js2-filip-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "slutuppgift-js2-filip",
  storageBucket: "slutuppgift-js2-filip.firebasestorage.app",
  messagingSenderId: "27481026357",
  appId: "1:27481026357:web:25bb4ecdee31f3ade4e67c"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);