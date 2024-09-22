// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPhbsQhgY7dlX0ecowhyCX4p-jlAvgRKU",
  authDomain: "votingsystemfingerprint.firebaseapp.com",
  projectId: "votingsystemfingerprint",
  storageBucket: "votingsystemfingerprint.appspot.com",
  messagingSenderId: "529155996580",
  appId: "1:529155996580:web:a45dc04dad0f62282c1f31"
};


  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
