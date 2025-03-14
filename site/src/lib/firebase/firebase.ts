import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration - replace with your actual config
const firebaseConfig = {
	apiKey: 'AIzaSyD6xBM__e4WoTG1sDCOlk3gw4sw4sRRzas',

	authDomain: 'cemcpractice.firebaseapp.com',

	projectId: 'cemcpractice',

	storageBucket: 'cemcpractice.firebasestorage.app',

	messagingSenderId: '729679619611',

	appId: '1:729679619611:web:23bf5228facb1981e6babe',

	measurementId: 'G-WR6LJTXVLH'
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
