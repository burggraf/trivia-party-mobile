import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PlayerStackParamList } from '../../navigation/PlayerNavigator';
import { PartyService } from '../../services/partyService';

type Navigation = StackNavigationProp<PlayerStackParamList, 'JoinParty'>;

export default function JoinPartyScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const { joinCode: scannedCode } = (route.params as { joinCode?: string }) || {};
  
  const [joinCode, setJoinCode] = useState(scannedCode || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have a scanned code, automatically attempt to join
    if (scannedCode) {
      handleJoinParty();
    }
  }, [scannedCode]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text variant="headlineSmall" style={styles.title}>
        🚨 TEST BUILD 207 - JOIN PARTY 🚨
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        {scannedCode 
          ? 'Connecting to party...'
          : 'Enter the 6-character party code to join'}
      </Text>

      <Card style={styles.card}>
        <Card.Content>
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
            editable={!scannedCode}
          />

          <Button
            mode="contained"
            onPress={handleJoinParty}
            loading={loading}
            disabled={loading || !joinCode.trim()}
            style={styles.joinButton}
          >
            {loading ? 'Joining...' : 'Join Party'}
          </Button>

          {!scannedCode && (
            <Button
              mode="outlined"
              onPress={handleScanQR}
              icon="qrcode-scan"
              style={styles.scanButton}
            >
              Scan QR Code Instead
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>
            Need Help?
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Ask your host for the 6-character party code or use the QR scanner to join quickly.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
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
  input: {
    marginBottom: 16,
  },
  joinButton: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  scanButton: {
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    elevation: 1,
  },
  infoTitle: {
    color: '#0369a1',
    marginBottom: 8,
  },
  infoText: {
    color: '#0369a1',
    lineHeight: 20,
  },
});
