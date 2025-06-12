// src/firebase/config.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Añade esta línea

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGShuoToG6QYWBv6bhdYxVc4lRG4lilHc",
  authDomain: "prefectura-723a3.firebaseapp.com",
  projectId: "prefectura-723a3",
  storageBucket: "prefectura-723a3.firebasestorage.app",
  messagingSenderId: "518189112093",
  appId: "1:518189112093:web:391864f028d0c19f66dff4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- Añade esta línea para exportar la instancia de Firestore