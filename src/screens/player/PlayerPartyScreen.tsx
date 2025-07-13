import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function PlayerPartyScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Playing</Text>
      <Text>Answer questions and compete!</Text>
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
