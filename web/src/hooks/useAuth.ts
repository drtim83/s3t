import { useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getProfile, upsertProfile } from '../lib/firestoreService';
import { useAuthStore } from '../store';

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clearAuth } = useAuthStore();

  async function loadProfile(userId: string, email?: string | null, displayName?: string | null) {
    try {
      let profile = await getProfile(userId);
      if (!profile) {
        // Automatically bootstrap user profile in Firestore
        profile = await upsertProfile({
          id: userId,
          full_name: displayName || email?.split('@')[0] || 'User',
          avatar_url: null,
          job_title: 'Solution Architect',
        });
      }
      setUser(profile);
    } catch (err) {
      console.error('Unexpected profile error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await loadProfile(fbUser.uid, fbUser.email, fbUser.displayName);
      } else {
        clearAuth();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(credential.user.uid, credential.user.email, credential.user.displayName);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) {
      await firebaseUpdateProfile(credential.user, { displayName: fullName });
    }
    const profile = await upsertProfile({
      id: credential.user.uid,
      full_name: fullName,
      avatar_url: null,
      job_title: 'Solution Architect',
    });
    setUser(profile);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    clearAuth();
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return { user, isLoading, signIn, signUp, signOut, resetPassword };
}
