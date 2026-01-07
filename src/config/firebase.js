import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAP-NMvBiE19-an2OC6Uke_icnkm_DVXGI",
    authDomain: "kids-138fe.firebaseapp.com",
    projectId: "kids-138fe",
    storageBucket: "kids-138fe.firebasestorage.app",
    messagingSenderId: "483987459546",
    appId: "1:483987459546:web:8cb41a6ddaec49885584e3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
