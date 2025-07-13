import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CreatePartyScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Create Party</Text>
      <Text>Set up a new trivia party</Text>
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
