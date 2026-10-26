import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBX1KtWk6XcqfR-ZuwoCkMIu7oTvItokro',
  authDomain: 'cha-da-ayla-ebaf5.firebaseapp.com',
  projectId: 'cha-da-ayla-ebaf5',
  storageBucket: 'cha-da-ayla-ebaf5.firebasestorage.app',
  messagingSenderId: '375621179265',
  appId: '1:375621179265:web:c73e44aedaa47ed649ba80',
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
