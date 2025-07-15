import React, { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { Button, IconButton } from 'react-native-paper';

interface SimpleAirPlayButtonProps {
  disabled?: boolean;
  style?: any;
}

export default function SimpleAirPlayButton({ disabled, style }: SimpleAirPlayButtonProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  // Only show on iOS since this is AirPlay-specific
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleAirPlayPress = () => {
    Alert.alert(
      '📺 Cast to TV',
      'To display this trivia game on your TV:\n\n' +
      '1. Swipe down from the top-right corner of your iPhone/iPad\n' +
      '2. Tap "Screen Mirroring" in Control Center\n' +
      '3. Select your Apple TV or AirPlay-compatible device\n' +
      '4. Your entire screen will appear on the TV\n\n' +
      'The trivia questions and answers will be visible to all players!',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <IconButton
      icon="airplay"
      iconColor="#60a5fa"
      size={24}
      onPress={handleAirPlayPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          borderRadius: 8,
        },
        style
      ]}
    />
  );
}