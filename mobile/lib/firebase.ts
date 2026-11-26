import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

if (!isFirebaseConfigured) {
  console.warn(
    '[S3T Mobile] Missing Firebase env vars. ' +
      'Add EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID to your .env file.'
  );
}

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

function initMobileAuth(): FirebaseAuth.Auth {
  if (!isNewApp || Platform.OS === 'web') {
    return FirebaseAuth.getAuth(app);
  }
  const getReactNativePersistence = (
    FirebaseAuth as unknown as {
      getReactNativePersistence?: (
        storage: typeof AsyncStorage
      ) => FirebaseAuth.Persistence;
    }
  ).getReactNativePersistence;

  if (typeof getReactNativePersistence === 'function') {
    try {
      return FirebaseAuth.initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      return FirebaseAuth.getAuth(app);
    }
  }
  return FirebaseAuth.getAuth(app);
}

export const auth = initMobileAuth();
export const db = getFirestore(app);
export default app;
