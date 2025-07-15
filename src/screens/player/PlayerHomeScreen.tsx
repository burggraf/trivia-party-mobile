import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PlayerStackParamList } from '../../navigation/PlayerNavigator';
import { PartyService } from '../../services/partyService';

// QR Scanner temporarily disabled
let isQRScannerAvailable = false;

type Navigation = StackNavigationProp<PlayerStackParamList, 'PlayerHome'>;

export default function PlayerHomeScreen() {
  const navigation = useNavigation<Navigation>();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinParty = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a party code');
      return;
    }

    try {
      setLoading(true);

      const party = await PartyService.getPartyByJoinCode(
        joinCode.trim().toUpperCase()
      );

      if (!party) {
        Alert.alert(
          'Error',
          'Party not found. Please check the code and try again.'
        );
        return;
      }

      if (party.status !== 'draft' && party.status !== 'active') {
        Alert.alert('Error', 'This party is no longer available to join.');
        return;
      }

      navigation.navigate('TeamSelection', { partyId: party.id });
    } catch (error: any) {
      console.error('Error joining party:', error);
      Alert.alert('Error', error.message || 'Failed to join party');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Join Trivia Party
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Enter a party code or scan a QR code to join the fun!
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Enter Party Code
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Ask your host for the 6-character party code
          </Text>

          <TextInput
            label="Party Code"
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., ABC123"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Button
            mode="contained"
            onPress={handleJoinParty}
            loading={loading}
            disabled={loading || !joinCode.trim()}
            style={styles.joinButton}
          >
            Join Party
          </Button>
        </Card.Content>
      </Card>

      {isQRScannerAvailable && (
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.orText}>
            OR
          </Text>
          <Divider style={styles.divider} />
        </View>
      )}

      {isQRScannerAvailable ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Scan QR Code
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Scan the QR code displayed by your host
            </Text>

            <Button
              mode="outlined"
              onPress={handleScanQR}
              icon="qrcode-scan"
              style={styles.scanButton}
            >
              Scan QR Code
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.devBuildCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.devBuildTitle}>
              QR Scanner Unavailable in Expo Go
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              QR code scanning requires camera access that's not available in Expo Go. Use manual entry below to join parties.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>
            How it works
          </Text>
          <View style={styles.steps}>
            <Text variant="bodyMedium" style={styles.step}>
              1. Join a party using the code or QR scan
            </Text>
            <Text variant="bodyMedium" style={styles.step}>
              2. Create or join a team with your friends
            </Text>
            <Text variant="bodyMedium" style={styles.step}>
              3. Answer trivia questions as a team
            </Text>
            <Text variant="bodyMedium" style={styles.step}>
              4. Compete for the top spot on the leaderboard!
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    color: '#6b7280',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  joinButton: {
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  orText: {
    marginHorizontal: 16,
    color: '#9ca3af',
  },
  scanButton: {
    paddingVertical: 8,
  },
  devBuildCard: {
    backgroundColor: '#fef3c7',
    elevation: 2,
    marginBottom: 16,
  },
  devBuildTitle: {
    color: '#92400e',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#f3f4f6',
    elevation: 1,
  },
  infoTitle: {
    color: '#1f2937',
    marginBottom: 12,
  },
  steps: {
    gap: 8,
  },
  step: {
    color: '#6b7280',
    lineHeight: 20,
  },
});
