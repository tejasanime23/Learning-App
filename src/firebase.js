// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8O3XSNriC4oT8hghrs13PstzPR5pxY1s",
  authDomain: "learningapp-459fa.firebaseapp.com",
  projectId: "learningapp-459fa",
  storageBucket: "learningapp-459fa.firebasestorage.app",
  messagingSenderId: "694675035307",
  appId: "1:694675035307:web:60c89e1e92df650e8253ee",
  measurementId: "G-47G56L18EQ"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
