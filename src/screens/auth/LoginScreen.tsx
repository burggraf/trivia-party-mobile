import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, resetPassword, loading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required', 
        'Please enter your email address first, then tap "Forgot Password" again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(email.trim());
      Alert.alert(
        'Reset Email Sent',
        'Check your email for password reset instructions. The email may take a few minutes to arrive.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome Back
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Sign in to your account
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              loading={loading}
              disabled={loading || resetLoading}
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
              loading={resetLoading}
              disabled={loading || resetLoading}
            >
              Forgot Password?
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
            >
              Don&apos;t have an account? Sign up
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 16,
    paddingTop: 60,
  },
  card: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotPasswordButton: {
    marginTop: 4,
  },
  linkButton: {
    marginTop: 8,
  },
});
