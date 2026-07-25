// src/firebase.js
// Central Firebase setup. Config values come from Vite env vars (VITE_FIREBASE_*)
// so nothing sensitive is hardcoded here -- see .env.example / deployment docs.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Shared logout helper -- clears both the Firebase session and the
// localStorage flags the rest of the app (ProtectedRoute, navbars) checks.
export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } finally {
    localStorage.clear();
  }
};

// Friendly text for the Firebase Auth error codes users actually hit.
export const getAuthErrorMessage = (error) => {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please login instead.";
    case "auth/invalid-email":
      return "That email address doesn't look valid.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "No account found with that email and password.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
};