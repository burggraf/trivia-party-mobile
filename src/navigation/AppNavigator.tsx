import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../stores/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Disable react-native-screens to prevent crashes in TestFlight
import { enableScreens } from 'react-native-screens';
enableScreens(false);

export default function AppNavigator() {
  const { user } = useAuthStore();

  // Configure deep linking
  const linking = {
    prefixes: ['trivia-party-mobile://'],
    config: {
      screens: {
        Auth: {
          screens: {
            ResetPassword: 'reset-password',
          },
        },
      },
    },
  };

  // Handle deep link URLs with fragment hash issue
  const getInitialURL = async () => {
    const url = await Linking.getInitialURL();
    if (url && url.includes('#')) {
      // Replace # with ? to handle Supabase auth fragment
      return url.replace('#', '?');
    }
    return url;
  };

  const subscribe = (listener: (url: string) => void) => {
    const onReceiveURL = ({ url }: { url: string }) => {
      if (url.includes('#')) {
        // Replace # with ? to handle Supabase auth fragment
        listener(url.replace('#', '?'));
      } else {
        listener(url);
      }
    };

    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => subscription?.remove();
  };

  return (
    <NavigationContainer 
      linking={{
        ...linking,
        getInitialURL,
        subscribe,
      }}
    >
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
