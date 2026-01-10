// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHY1jsIzEBwyJTQ6RRUiVDXRQ9CYEXqNU",
  authDomain: "manofcave-v1.firebaseapp.com",
  projectId: "manofcave-v1",
  storageBucket: "manofcave-v1.firebasestorage.app",
  messagingSenderId: "886275055938",
  appId: "1:886275055938:web:15926c5f0c5d967e04e8db",
  measurementId: "G-5EBK1WG97T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (optional, only if you need it)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export analytics if needed
export { analytics };