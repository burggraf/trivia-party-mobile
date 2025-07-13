import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
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
  console.log('AddRoundModal: Component rendering, visible =', visible);
  
  const [roundName, setRoundName] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddRound = async () => {
    console.log('AddRoundModal: Starting handleAddRound');
    
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
      console.log('AddRoundModal: Setting loading to true');
      setLoading(true);

      const roundData = {
        name: roundName.trim(),
        question_count: count,
        categories: selectedCategories,
        difficulty: difficulty,
      };
      
      console.log('AddRoundModal: Round data:', roundData);
      console.log('AddRoundModal: Calling onAdd...');
      
      // Add timeout to prevent freezing
      const addRoundPromise = onAdd(roundData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out after 10 seconds')), 10000)
      );
      
      await Promise.race([addRoundPromise, timeoutPromise]);
      
      console.log('AddRoundModal: onAdd completed successfully');

      // Reset form
      setRoundName('');
      setQuestionCount('10');
      setDifficulty('medium');
      setSelectedCategories([]);
      
      console.log('AddRoundModal: Form reset completed');
    } catch (error) {
      console.error('AddRoundModal: Error adding round:', error);
      alert(`Failed to add round: ${error.message || 'Unknown error'}`);
    } finally {
      console.log('AddRoundModal: Setting loading to false');
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
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <Card style={styles.card}>
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
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
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />

                    <TextInput
                      label="Number of Questions *"
                      value={questionCount}
                      onChangeText={setQuestionCount}
                      mode="outlined"
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="10"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
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
                </ScrollView>
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    margin: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginTop: 16,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
  },
});
