/* eslint-disable no-undef */
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ... rest deines Codes


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAx5EaagxsSRrVT7fJtRzthViXjR8Q7LS0",
    authDomain: "nutrition-coach-f9ce8.firebaseapp.com",
    projectId: "nutrition-coach-f9ce8",
    storageBucket: "nutrition-coach-f9ce8.appspot.com",
    messagingSenderId: "434213023999",
    appId: "1:434213023999:web:9130bb8258112ed08b1cca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('Firebase initialized:', app);