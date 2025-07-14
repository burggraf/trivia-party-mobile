import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/shared/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, initialized } = useAuthStore();
  const [hasError, setHasError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>(['App started']);
  const [showDebug, setShowDebug] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('AppNavigator mounted');
    
    // Check environment variables
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    addDebugInfo(`Supabase URL: ${supabaseUrl ? 'configured' : 'missing'}`);
    addDebugInfo(`Supabase Key: ${supabaseKey ? 'configured' : 'missing'}`);
    addDebugInfo(`User: ${user ? 'logged in' : 'not logged in'}`);
    addDebugInfo(`Initialized: ${initialized}`);

    // Add a timeout to catch stuck initialization
    const timeout = setTimeout(() => {
      if (!initialized) {
        addDebugInfo('App initialization timeout after 5 seconds');
        setHasError(true);
        setShowDebug(true);
      }
    }, 5000); // 5 second timeout (reduced from 10)

    return () => clearTimeout(timeout);
  }, [initialized, user]);

  // Show debug info on triple tap
  const handlePress = () => {
    setShowDebug(!showDebug);
  };

  if (hasError || showDebug) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information</Text>
        <ScrollView style={styles.debugScroll}>
          {debugInfo.map((info, index) => (
            <Text key={index} style={styles.debugText}>
              {info}
            </Text>
          ))}
        </ScrollView>
        <Text style={styles.debugInstruction}>
          {hasError ? 'App failed to initialize' : 'Tap here to continue'}
        </Text>
        <Text 
          style={styles.continueButton}
          onPress={() => !hasError && setShowDebug(false)}
        >
          {hasError ? 'ERROR' : 'CONTINUE'}
        </Text>
      </View>
    );
  }

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
        <Text style={styles.tapHint} onPress={handlePress}>
          Tap here if stuck loading
        </Text>
      </View>
    );
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
  debugContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 60,
  },
  debugTitle: {
    fontSize: 20,
    color: '#00ff00',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  debugScroll: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Courier',
    marginBottom: 2,
  },
  debugInstruction: {
    fontSize: 16,
    color: '#ffff00',
    marginTop: 20,
    textAlign: 'center',
  },
  continueButton: {
    fontSize: 18,
    color: '#00ff00',
    backgroundColor: '#333333',
    padding: 15,
    textAlign: 'center',
    marginTop: 10,
    borderRadius: 5,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tapHint: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
    padding: 20,
  },
});
