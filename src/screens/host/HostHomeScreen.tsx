import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function HostHomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Host Dashboard</Text>
      <Text>Create and manage your trivia parties</Text>
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
