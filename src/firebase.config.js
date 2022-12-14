import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_CONFIG_API_KEY,
  authDomain: "robust-muse-148116.firebaseapp.com",
  projectId: "robust-muse-148116",
  storageBucket: "robust-muse-148116.appspot.com",
  messagingSenderId: "119476845925",
  appId: "1:119476845925:web:7a26cd9dd6696b905bf58c",
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
