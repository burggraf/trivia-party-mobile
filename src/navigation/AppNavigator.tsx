import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/shared/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, initialized } = useAuthStore();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Add a timeout to catch stuck initialization
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.error('App initialization timeout');
        setHasError(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [initialized]);

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Unable to initialize app. Please check your connection and try again.
        </Text>
      </View>
    );
  }

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});
