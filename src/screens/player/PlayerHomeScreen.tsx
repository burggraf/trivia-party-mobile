import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function PlayerHomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Join Game</Text>
      <Text>Scan QR code or enter party code</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
});
