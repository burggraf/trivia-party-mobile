import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function JoinPartyScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Join Party</Text>
      <Text>Enter the party details</Text>
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
