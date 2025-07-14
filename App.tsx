import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: string) => void },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('Error caught by boundary:', error, errorInfo);
    this.props.onError(`Error: ${error.message}\nStack: ${error.stack}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Crashed</Text>
          <Text style={styles.errorText}>Error: {this.state.error}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [debugInfo, setDebugInfo] = useState<string[]>(['App.tsx started']);
  const [showDebug, setShowDebug] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const addDebug = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `${timestamp}: ${msg}`]);
  };

  useEffect(() => {
    addDebug('App.tsx useEffect started');
    
    // Check environment
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    addDebug(`Env - Supabase URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
    addDebug(`Env - Supabase Key: ${supabaseKey ? 'SET' : 'MISSING'}`);
    
    // Auto-show debug after 3 seconds
    const timeout = setTimeout(() => {
      addDebug('Auto-showing debug after 3 seconds');
      setShowDebug(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const handleAuthStoreError = (error: string) => {
    addDebug(`Auth store error: ${error}`);
    setAppError(error);
    setShowDebug(true);
  };

  if (showDebug || appError) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>
          {appError ? 'App Error Debug' : 'App Debug Info'}
        </Text>
        <View style={styles.debugContent}>
          {debugInfo.map((info, i) => (
            <Text key={i} style={styles.debugLine}>{info}</Text>
          ))}
          {appError && (
            <Text style={styles.errorDetail}>{appError}</Text>
          )}
        </View>
        <Text style={styles.debugButton} onPress={() => setShowDebug(false)}>
          {appError ? 'ERROR - TAP TO DISMISS' : 'TAP TO CONTINUE'}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary onError={handleAuthStoreError}>
      <PaperProvider>
        <SafeAppNavigator onError={handleAuthStoreError} onDebug={addDebug} />
        <StatusBar style="auto" />
        <Text style={styles.tapDebug} onPress={() => setShowDebug(true)}>
          DEBUG
        </Text>
      </PaperProvider>
    </ErrorBoundary>
  );
}

// Safe wrapper for AppNavigator
function SafeAppNavigator({ onError, onDebug }: { onError: (error: string) => void; onDebug: (msg: string) => void }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    onDebug('SafeAppNavigator: Starting initialization');
    
    try {
      // Try to initialize auth store manually
      const { initialize } = useAuthStore.getState();
      onDebug('SafeAppNavigator: Got auth store');
      
      initialize()
        .then(() => {
          onDebug('SafeAppNavigator: Auth initialized successfully');
          setInitialized(true);
        })
        .catch((error) => {
          onDebug(`SafeAppNavigator: Auth init failed: ${error.message}`);
          onError(`Auth initialization failed: ${error.message}`);
        });
    } catch (error: any) {
      onDebug(`SafeAppNavigator: Error getting auth store: ${error.message}`);
      onError(`Failed to access auth store: ${error.message}`);
    }
  }, [onError, onDebug]);

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#ff0000',
    padding: 20,
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
  },
  debugContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 60,
  },
  debugTitle: {
    fontSize: 18,
    color: '#00ff00',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugContent: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 10,
  },
  debugLine: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: 'Courier',
  },
  errorDetail: {
    fontSize: 12,
    color: '#ff0000',
    marginTop: 10,
  },
  debugButton: {
    fontSize: 16,
    color: '#00ff00',
    backgroundColor: '#333333',
    padding: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 18,
    color: '#333333',
  },
  tapDebug: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 10,
    fontSize: 12,
  },
});
