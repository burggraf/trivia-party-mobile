import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth in background, don't block UI
    initialize().catch(error => {
      console.warn('Auth initialization failed, continuing in offline mode:', error);
    });
  }, [initialize]);

  return (
    <PaperProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
