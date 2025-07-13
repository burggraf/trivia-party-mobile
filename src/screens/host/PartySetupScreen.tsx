import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function PartySetupScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Party Setup</Text>
      <Text>Configure rounds and questions</Text>
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
