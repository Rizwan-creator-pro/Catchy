import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
	apiKey: "AIzaSyAXqUsH-scbD32hl_8HfdTgkI-bUGO6os8",
	authDomain: "instagram-1f0c3.firebaseapp.com",
	projectId: "instagram-1f0c3",
	storageBucket: "instagram-1f0c3.firebasestorage.app",
	messagingSenderId: "569177560937",
	appId: "1:569177560937:web:de6fff5542726adace0ff8"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
