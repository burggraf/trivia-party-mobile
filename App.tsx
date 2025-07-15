import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { initialize } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      console.log('🚀 App starting...');
      
      // Initialize auth in background - don't await it, just fire and forget
      initialize().catch(error => {
        console.warn('Auth initialization failed, app continues in offline mode:', error);
      });
      
      // Show app immediately after a short delay for splash screen
      setTimeout(() => {
        console.log('✅ App ready - showing UI');
        setAppIsReady(true);
      }, 1000);
    }

    prepare();
  }, [initialize]);

  useEffect(() => {
    async function hideSplash() {
      if (appIsReady) {
        try {
          console.log('🎨 Hiding splash screen...');
          await SplashScreen.hideAsync();
          console.log('✅ Splash screen hidden');
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    }
    hideSplash();
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
