// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "real-chat-8393b.firebaseapp.com",
  projectId: "real-chat-8393b",
  storageBucket: "real-chat-8393b.appspot.com",
  messagingSenderId: "76457067438",
  appId: "1:76457067438:web:5c99e8c2a2d002c29efe3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()