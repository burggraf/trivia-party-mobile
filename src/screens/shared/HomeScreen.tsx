import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome to Trivia Party!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Host amazing trivia nights or join existing parties
          </Text>
          <Text style={styles.userInfo}>Signed in as: {user?.email}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          style={[styles.button, styles.hostButton]}
          onPress={() => navigation.navigate('Host' as never)}
        >
          Host a Party
        </Button>

        <Button
          mode="contained"
          style={[styles.button, styles.playerButton]}
          onPress={() => navigation.navigate('Player' as never)}
        >
          Join a Party
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  card: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  userInfo: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 8,
  },
  hostButton: {
    backgroundColor: '#6366f1',
  },
  playerButton: {
    backgroundColor: '#10b981',
  },
});
