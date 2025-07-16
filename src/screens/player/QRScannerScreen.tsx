import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerStackParamList } from '../../navigation/PlayerNavigator';
import { PartyService } from '../../services/partyService';

// QR Scanner temporarily disabled - manual entry only

type Navigation = StackNavigationProp<PlayerStackParamList, 'QRScanner'>;

export default function QRScannerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    // QR Scanner temporarily disabled
    setHasPermission(false);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('QR Code scanned:', data);
    handleJoinCode(data);
  };

  const handleJoinCode = async (joinCode: string) => {
    try {
      setLoading(true);

      // Validate join code format
      if (!joinCode || joinCode.length !== 6) {
        Alert.alert(
          'Invalid Code',
          'Party codes must be exactly 6 characters.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      const party = await PartyService.getPartyByJoinCode(joinCode.toUpperCase());

      if (!party) {
        Alert.alert(
          'Party Not Found',
          'No party found with this code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      if (party.status !== 'draft' && party.status !== 'active') {
        Alert.alert(
          'Party Unavailable',
          'This party is no longer available to join.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }

      navigation.navigate('TeamSelection', { partyId: party.id });
    } catch (error: any) {
      console.error('Error processing join code:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to join party',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a party code');
      return;
    }

    await handleJoinCode(manualCode.trim());
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Show loading while checking permissions
  if (hasPermission === null) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Checking camera permissions...
        </Text>
      </View>
    );
  }

  // QR Scanner temporarily disabled - skip to manual entry

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Join Party
        </Text>
        <Text variant="bodyLarge" style={styles.headerSubtitle}>
          Scan QR code or enter the party code manually
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.devBuildCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.devBuildTitle}>
              🚨 TEST BUILD 207 - QR DISABLED 🚨
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              QR code scanning will be available in the next build. For now, please use manual code entry below.
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
              How to Join
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Enter the 6-character party code provided by your host. QR scanning will be enabled in the next app update.
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
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
  permissionCard: {
    backgroundColor: '#fef2f2',
    elevation: 2,
  },
  permissionTitle: {
    color: '#dc2626',
    marginBottom: 8,
  },
  devBuildCard: {
    backgroundColor: '#f0f9ff',
    elevation: 2,
  },
  devBuildTitle: {
    color: '#0369a1',
    marginBottom: 8,
  },
  title: {
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
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
  footer: {
    padding: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  // QR Scanner overlay styles
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerBox: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10b981',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10b981',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10b981',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10b981',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  instructionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  instructionText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  switchToManualButton: {
    borderColor: '#ffffff',
  },
  retryButton: {
    borderColor: '#ffffff',
  },
});
