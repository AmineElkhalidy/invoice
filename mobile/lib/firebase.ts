import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxC0RAafaNeIj9eT4g0n66ZvCnkaa8j9E",
  authDomain: "benkhaled-station.firebaseapp.com",
  projectId: "benkhaled-station",
  storageBucket: "benkhaled-station.firebasestorage.app",
  messagingSenderId: "655193833148",
  appId: "1:655193833148:web:b364dfd46752e5f5755ab9",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
