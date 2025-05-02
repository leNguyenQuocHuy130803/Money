// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDA-XnYhxAja23HVtwO-tWwvgYgXDI4Ihw",
    authDomain: "stupid-money.firebaseapp.com",
    projectId: "stupid-money",
    storageBucket: "stupid-money.firebasestorage.app",
    messagingSenderId: "530998829871",
    appId: "1:530998829871:web:a4a03ad686481331e3b7da",
    measurementId: "G-56GN70HT50"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
