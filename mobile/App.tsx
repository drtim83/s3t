import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './lib/firebase';
import { getProfile, upsertProfile } from './lib/firestoreService';
import { useAuthStore } from './store';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import { Colors } from './theme/tokens';

export default function App() {
  const { user, setUser, setLoading, clearAuth, isLoading } = useAuthStore();

  // ── Bootstrap: listen for Firebase auth state changes ───────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          let profile = await getProfile(fbUser.uid);
          if (!profile) {
            profile = await upsertProfile({
              id: fbUser.uid,
              email: fbUser.email?.toLowerCase() ?? null,
              full_name:
                fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              avatar_url: null,
              job_title: 'Solution Architect',
            });
          }
          setUser(profile);
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error('[S3T Mobile] Failed to load profile:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Splash / loading gate ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <View style={styles.logoMark}>
          <ActivityIndicator size="large" color={Colors.primaryFg} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});
