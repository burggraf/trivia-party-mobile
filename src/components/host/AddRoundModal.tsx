import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Card,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';

interface AddRoundModalProps {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (roundData: any) => void;
}

const COMMON_CATEGORIES = [
  'General Knowledge',
  'Sports',
  'History',
  'Science',
  'Entertainment',
  'Geography',
  'Literature',
  'Music',
  'Movies',
  'TV Shows',
  'Food & Drink',
  'Art',
  'Politics',
  'Technology',
  'Nature',
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function AddRoundModal({
  visible,
  onDismiss,
  onAdd,
}: AddRoundModalProps) {
  const [roundName, setRoundName] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddRound = async () => {
    if (!roundName.trim()) {
      alert('Please enter a round name');
      return;
    }

    const count = parseInt(questionCount);
    if (!count || count < 1 || count > 50) {
      alert('Please enter a valid question count (1-50)');
      return;
    }

    try {
      setLoading(true);

      await onAdd({
        name: roundName.trim(),
        question_count: count,
        categories: selectedCategories,
        difficulty: difficulty,
      });

      // Reset form
      setRoundName('');
      setQuestionCount('10');
      setDifficulty('medium');
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error adding round:', error);
      alert('Failed to add round');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
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
              Add New Round
            </Text>

            <TextInput
              label="Round Name *"
              value={roundName}
              onChangeText={setRoundName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Sports Round, Science & Nature"
            />

            <TextInput
              label="Number of Questions *"
              value={questionCount}
              onChangeText={setQuestionCount}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="10"
            />

            <Text variant="labelLarge" style={styles.label}>
              Difficulty Level
            </Text>
            <SegmentedButtons
              value={difficulty}
              onValueChange={setDifficulty}
              buttons={DIFFICULTIES}
              style={styles.segmentedButtons}
            />

            <Text variant="labelLarge" style={styles.label}>
              Categories (Optional)
            </Text>
            <Text variant="bodySmall" style={styles.hint}>
              Leave empty to include all categories, or select specific ones:
            </Text>

            <View style={styles.categoriesContainer}>
              {COMMON_CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  mode={
                    selectedCategories.includes(category) ? 'flat' : 'outlined'
                  }
                  selected={selectedCategories.includes(category)}
                  onPress={() => toggleCategory(category)}
                  style={styles.categoryChip}
                >
                  {category}
                </Chip>
              ))}
            </View>

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
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  hint: {
    color: '#6b7280',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
