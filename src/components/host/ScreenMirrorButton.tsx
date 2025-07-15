import React from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { Button } from 'react-native-paper';

interface ScreenMirrorButtonProps {
  disabled?: boolean;
  style?: any;
}

export default function ScreenMirrorButton({ disabled, style }: ScreenMirrorButtonProps) {
  // Only show on iOS since AirPlay screen mirroring is iOS-specific
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleScreenMirror = () => {
    Alert.alert(
      'AirPlay Screen Mirroring',
      'To cast this screen to your TV:\n\n1. Swipe down from top-right corner to open Control Center\n2. Tap "Screen Mirroring"\n3. Select your Apple TV or AirPlay device\n4. The entire screen will appear on your TV',
      [
        {
          text: 'Open Control Center',
          onPress: () => {
            // This will open Control Center on iOS
            // Note: This requires the app to be in foreground
            if (Platform.OS === 'ios') {
              // We can't programmatically open Control Center, but we can provide clear instructions
              Alert.alert(
                'Instructions',
                'Swipe down from the top-right corner of your screen to access Control Center and Screen Mirroring.'
              );
            }
          }
        },
        {
          text: 'Got it',
          style: 'default'
        }
      ]
    );
  };

  return (
    <Button
      mode="outlined"
      onPress={handleScreenMirror}
      disabled={disabled}
      icon="airplay"
      style={[
        {
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          minWidth: 140
        },
        style
      ]}
      labelStyle={{ color: '#60a5fa' }}
    >
      Screen Mirror
    </Button>
  );
}