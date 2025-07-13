import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Profile
          </Text>

          <View style={styles.infoRow}>
            <Text variant="labelLarge">Email:</Text>
            <Text variant="bodyLarge">{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge">Display Name:</Text>
            <Text variant="bodyLarge">
              {user?.user_metadata?.display_name || 'Not set'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge">Member since:</Text>
            <Text variant="bodyLarge">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        Sign Out
      </Button>
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
    marginBottom: 16,
    color: '#1f2937',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
  },
});
