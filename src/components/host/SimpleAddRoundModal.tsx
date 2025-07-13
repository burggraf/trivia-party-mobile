import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Card,
} from 'react-native-paper';

interface SimpleAddRoundModalProps {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (roundData: any) => void;
}

export default function SimpleAddRoundModal({
  visible,
  onDismiss,
  onAdd,
}: SimpleAddRoundModalProps) {
  const [roundName, setRoundName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddRound = async () => {
    if (!roundName.trim()) {
      alert('Please enter a round name');
      return;
    }

    try {
      setLoading(true);
      
      await onAdd({
        name: roundName.trim(),
        question_count: 10,
        categories: [],
        difficulty: 'medium',
      });
      
      setRoundName('');
    } catch (error) {
      console.error('Error adding round:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Add Simple Round
            </Text>

            <TextInput
              label="Round Name"
              value={roundName}
              onChangeText={setRoundName}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.button}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddRound}
                style={styles.button}
                loading={loading}
                disabled={loading || !roundName.trim()}
              >
                Add Round
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});