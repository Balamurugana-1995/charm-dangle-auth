import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Firebase Web App configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCzf-EFGsugbnkH0rQeG185tn4H-gmEILs",
  authDomain: "charm-dangle.firebaseapp.com",
  projectId: "charm-dangle",
  storageBucket: "charm-dangle.firebasestorage.app",
  messagingSenderId: "42093156652",
  appId: "1:42093156652:web:f6e35506a71561fb753489"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Login provider
export const googleProvider = new GoogleAuthProvider();

export default app;