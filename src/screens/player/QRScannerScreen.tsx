import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PlayerStackParamList } from '../../navigation/PlayerNavigator';
import { PartyService } from '../../services/partyService';

// Dynamic import to handle cases where BarCodeScanner isn't available
let BarCodeScanner: any = null;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (error) {
  // BarCodeScanner not available (expected in Expo Go)
  // Silently continue with manual entry fallback
}

type Navigation = StackNavigationProp<PlayerStackParamList, 'QRScanner'>;

export default function QRScannerScreen() {
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
    try {
      if (!BarCodeScanner) {
        // BarCodeScanner not available, default to manual entry
        setHasPermission(false);
        return;
      }
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Checking camera permissions...
        </Text>
      </View>
    );
  }

  // Show scanner if permission granted and scanner is active
  if (hasPermission && showScanner && BarCodeScanner) {
    return (
      <View style={styles.container}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scannerBox}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Card style={styles.instructionCard}>
              <Card.Content>
                <Text variant="bodyLarge" style={styles.instructionText}>
                  {scanned || loading ? 'Processing...' : 'Point your camera at the QR code'}
                </Text>
                {(scanned || loading) && <ActivityIndicator color="#ffffff" style={styles.loader} />}
              </Card.Content>
            </Card>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowScanner(false)}
                style={styles.switchToManualButton}
                buttonColor="rgba(255,255,255,0.1)"
                textColor="#ffffff"
                icon="keyboard"
              >
                Enter Code Manually
              </Button>
              
              {scanned && (
                <Button
                  mode="outlined"
                  onPress={() => setScanned(false)}
                  style={styles.retryButton}
                  buttonColor="rgba(255,255,255,0.1)"
                  textColor="#ffffff"
                >
                  Try Again
                </Button>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Join Party
        </Text>
        <Text variant="bodyLarge" style={styles.headerSubtitle}>
          Scan QR code or enter the party code manually
        </Text>
      </View>

      <View style={styles.content}>
        {hasPermission && BarCodeScanner && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.title}>
                QR Code Scanner
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                Use your camera to scan the QR code displayed by the party host for quick joining.
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowScanner(true)}
                style={styles.button}
                icon="qrcode-scan"
              >
                Open QR Scanner
              </Button>
            </Card.Content>
          </Card>
        )}

        {!BarCodeScanner && (
          <Card style={styles.devBuildCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.devBuildTitle}>
                QR Scanner Requires Development Build
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                QR code scanning requires a development build. To enable it, run:
              </Text>
              <Text variant="bodyMedium" style={styles.codeText}>
                npx expo run:ios or npx expo run:android
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                For now, please use manual entry below.
              </Text>
            </Card.Content>
          </Card>
        )}

        {!hasPermission && BarCodeScanner && (
          <Card style={styles.permissionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.permissionTitle}>
                Camera Permission Required
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                To use QR code scanning, please grant camera permissions in your device settings.
              </Text>
              <Button
                mode="outlined"
                onPress={requestCameraPermission}
                style={styles.button}
                icon="camera"
              >
                Request Permission
              </Button>
            </Card.Content>
          </Card>
        )}

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
              {!BarCodeScanner 
                ? "QR scanning requires a development build. Use manual entry for now."
                : hasPermission 
                  ? "Use the QR scanner above for quick joining, or enter the 6-character code manually."
                  : "Enter the 6-character party code provided by your host. Enable camera permissions to use QR scanning."}
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
    backgroundColor: '#fef3c7',
    elevation: 2,
  },
  devBuildTitle: {
    color: '#92400e',
    marginBottom: 8,
  },
  codeText: {
    color: '#92400e',
    fontFamily: 'monospace',
    backgroundColor: '#fbbf24',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
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
