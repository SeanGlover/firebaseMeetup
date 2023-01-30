// Import stylesheets
import './style.css';

import { initializeApp } from 'firebase/app';
// Import the functions you need from the SDKs you need
const firebaseConfig = {
  apiKey: "AIzaSyBSxg6mwQc4zoQ8VvRFyLg2Nwi8rTbXIXg",
  authDomain: "fir-web-codelab-a1.firebaseapp.com",
  projectId: "fir-web-codelab-a1",
  storageBucket: "fir-web-codelab-a1.appspot.com",
  messagingSenderId: "500408137603",
  appId: "1:500408137603:web:a9d8e512607d077ff5a8b6"
};
const app = initializeApp(firebaseConfig);

// Add the Firebase products and methods that you want to use
import { getAuth, EmailAuthProvider } from 'firebase/auth';
import {} from 'firebase/firestore';
import * as firebaseui from 'firebaseui';

auth = getAuth();