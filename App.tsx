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
      try {
        console.log('🚀 App starting...');
        
        // Add a failsafe timeout to prevent getting stuck
        const initPromise = initialize().catch(error => {
          console.warn('Auth initialization failed, continuing in offline mode:', error);
        });
        
        // Maximum wait time of 3 seconds before showing app
        const timeoutPromise = new Promise(resolve => {
          setTimeout(() => {
            console.log('⚠️ App initialization timeout, showing app anyway');
            resolve(undefined);
          }, 3000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
        
        console.log('✅ App ready');
      } catch (e) {
        console.warn('App preparation error:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
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
