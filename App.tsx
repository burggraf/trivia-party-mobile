import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import * as Updates from 'expo-updates';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth in background - don't block UI
    initialize().catch(error => {
      console.warn('Auth initialization failed, app continues in offline mode:', error);
    });

    // Check for over-the-air updates on startup
    const checkForUpdates = async () => {
      try {
        if (!__DEV__ && Updates.isEnabled) {
          console.log('Checking for updates...');
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            console.log('Update available, downloading...');
            await Updates.fetchUpdateAsync();
            console.log('Update downloaded, reloading...');
            await Updates.reloadAsync();
          } else {
            console.log('No updates available');
          }
        }
      } catch (error) {
        console.warn('Update check failed:', error);
      }
    };

    checkForUpdates();
  }, [initialize]);

  return (
    <PaperProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
