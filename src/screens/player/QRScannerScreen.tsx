import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PlayerStackParamList } from '../../navigation/PlayerNavigator';
import { PartyService } from '../../services/partyService';

type Navigation = StackNavigationProp<PlayerStackParamList, 'QRScanner'>;

export default function QRScannerScreen() {
  const navigation = useNavigation<Navigation>();
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a party code');
      return;
    }

    try {
      setLoading(true);

      const joinCode = manualCode.trim().toUpperCase();

      if (joinCode.length !== 6) {
        Alert.alert(
          'Invalid Code',
          'Party codes must be exactly 6 characters.'
        );
        return;
      }

      const party = await PartyService.getPartyByJoinCode(joinCode);

      if (!party) {
        Alert.alert('Party Not Found', 'No party found with this code.');
        return;
      }

      if (party.status !== 'draft' && party.status !== 'active') {
        Alert.alert(
          'Party Unavailable',
          'This party is no longer available to join.'
        );
        return;
      }

      navigation.navigate('TeamSelection', { partyId: party.id });
    } catch (error: any) {
      console.error('Error processing manual entry:', error);
      Alert.alert('Error', error.message || 'Failed to join party');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Join Party
        </Text>
        <Text variant="bodyLarge" style={styles.headerSubtitle}>
          Enter the party code provided by your host
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              QR Scanner Coming Soon
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              QR code scanning requires a native build. For now, please enter
              the party code manually below.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              Enter Party Code
            </Text>

            <TextInput
              label="6-Character Code"
              value={manualCode}
              onChangeText={(text) => setManualCode(text.toUpperCase())}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Button
              mode="contained"
              onPress={handleManualEntry}
              loading={loading}
              disabled={loading || !manualCode.trim()}
              style={styles.button}
            >
              Join Party
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              Need the QR Scanner?
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              To enable QR code scanning, you&apos;ll need to create a development
              build with: npx expo run:ios (or run:android)
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleGoBack}
          style={styles.backButton}
          disabled={loading}
        >
          Back to Home
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    color: '#6b7280',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    elevation: 1,
  },
  infoTitle: {
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    color: '#92400e',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
});
