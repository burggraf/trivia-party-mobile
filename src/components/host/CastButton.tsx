import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, Menu, IconButton, Text } from 'react-native-paper';
import CastingService, { CastDevice } from '../../services/castingService';

interface CastButtonProps {
  onCastingStatusChange?: (isCasting: boolean) => void;
  disabled?: boolean;
  style?: any;
}

export default function CastButton({ onCastingStatusChange, disabled, style }: CastButtonProps) {
  const [availableDevices, setAvailableDevices] = useState<CastDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<CastDevice | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeCasting();
    
    // Subscribe to casting events
    const unsubscribeDevices = CastingService.onDevicesChanged(setAvailableDevices);
    const unsubscribeConnection = CastingService.onConnectionChanged(handleConnectionChange);
    
    return () => {
      unsubscribeDevices();
      unsubscribeConnection();
    };
  }, []);

  const initializeCasting = async () => {
    try {
      await CastingService.initialize();
      const devices = await CastingService.getAvailableDevices();
      setAvailableDevices(devices);
      setConnectedDevice(CastingService.getConnectedDevice());
    } catch (error) {
      console.error('Error initializing casting:', error);
    }
  };

  const handleConnectionChange = (device: CastDevice | null) => {
    setConnectedDevice(device);
    onCastingStatusChange?.(device?.isConnected || false);
  };

  const handleDeviceSelect = async (device: CastDevice) => {
    setShowMenu(false);
    setLoading(true);
    
    try {
      const success = await CastingService.connectToDevice(device.id);
      if (!success) {
        Alert.alert(
          'Connection Failed',
          `Could not connect to ${device.name}. Please make sure the device is available and try again.`
        );
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      Alert.alert(
        'Connection Error', 
        'An error occurred while connecting to the casting device.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await CastingService.disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCastIcon = () => {
    if (connectedDevice?.isConnected) {
      return connectedDevice.type === 'airplay' ? 'airplay' : 'cast';
    }
    return Platform.OS === 'ios' ? 'airplay' : 'cast';
  };

  const getCastLabel = () => {
    if (connectedDevice?.isConnected) {
      return `Casting to ${connectedDevice.name}`;
    }
    return Platform.OS === 'ios' ? 'AirPlay' : 'Cast to TV';
  };

  if (!CastingService.isCastingAvailable()) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {connectedDevice?.isConnected ? (
        <View style={styles.connectedContainer}>
          <View style={styles.connectedInfo}>
            <IconButton
              icon={getCastIcon()}
              iconColor="#10b981"
              size={24}
            />
            <Text variant="bodyMedium" style={styles.connectedText}>
              {getCastLabel()}
            </Text>
          </View>
          <Button
            mode="outlined"
            onPress={handleDisconnect}
            loading={loading}
            disabled={disabled || loading}
            style={styles.disconnectButton}
            textColor="#ef4444"
          >
            Disconnect
          </Button>
        </View>
      ) : (
        <Menu
          visible={showMenu}
          onDismiss={() => setShowMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowMenu(true)}
              loading={loading}
              disabled={disabled || loading || availableDevices.length === 0}
              icon={getCastIcon()}
              style={styles.castButton}
            >
              {getCastLabel()}
            </Button>
          }
        >
          {availableDevices.map((device) => (
            <Menu.Item
              key={device.id}
              onPress={() => handleDeviceSelect(device)}
              title={device.name}
              leadingIcon={device.type === 'airplay' ? 'airplay' : 'cast'}
            />
          ))}
          {availableDevices.length === 0 && (
            <Menu.Item
              title="No devices available"
              disabled
              leadingIcon="information"
            />
          )}
        </Menu>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 160,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectedText: {
    color: '#059669',
    fontWeight: '500',
    marginLeft: 4,
  },
  disconnectButton: {
    borderColor: '#ef4444',
  },
  castButton: {
    borderColor: '#6366f1',
  },
});