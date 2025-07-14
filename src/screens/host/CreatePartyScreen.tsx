import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput, Button, Card, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HostStackParamList } from '../../navigation/HostNavigator';
import { PartyService } from '../../services/partyService';
import { useAuthStore } from '../../stores/authStore';
import DateTimePicker from '@react-native-community/datetimepicker';

type Navigation = StackNavigationProp<HostStackParamList, 'CreateParty'>;

export default function CreatePartyScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form state
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [maxTeams, setMaxTeams] = useState('8');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCreateParty = async () => {
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter a party name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a party');
      return;
    }

    try {
      setLoading(true);

      const party = await PartyService.createParty({
        host_id: user.id,
        name: partyName.trim(),
        description: description.trim() || null,
        scheduled_date: scheduledDate.toISOString(),
        max_teams: maxTeams ? parseInt(maxTeams) : null,
      });

      Alert.alert(
        'Party Created!',
        `Your party "${party.name}" has been created with join code: ${party.join_code}`,
        [
          {
            text: 'Set Up Rounds',
            onPress: () =>
              navigation.replace('PartySetup', { partyId: party.id }),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating party:', error);
      Alert.alert('Error', error.message || 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      ' at ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Text variant="headlineSmall" style={styles.title}>
        Create New Party
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Set up your trivia party details
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Party Information
          </Text>

          {/* Test native TextInput first */}
          <View style={styles.testInputContainer}>
            <Text style={styles.testLabel}>Test Input (Native RN):</Text>
            <RNTextInput
              style={styles.testInput}
              placeholder="Tap here to test keyboard..."
              value={partyName}
              onChangeText={setPartyName}
              autoFocus={true}
            />
          </View>

          <TextInput
            label="Party Name *"
            value={partyName}
            onChangeText={setPartyName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Friday Night Trivia"
            autoFocus={true}
            autoCapitalize="words"
            autoCorrect={true}
            selectTextOnFocus={true}
          />

          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Tell players what to expect..."
            autoCapitalize="sentences"
            autoCorrect={true}
            selectTextOnFocus={true}
          />

          <Text variant="labelLarge" style={styles.label}>
            Scheduled Date & Time
          </Text>
          <Chip
            mode="outlined"
            style={styles.dateChip}
            onPress={() => setShowDatePicker(true)}
            icon="calendar"
          >
            {formatDate(scheduledDate)}
          </Chip>

          <TextInput
            label="Maximum Teams (Optional)"
            value={maxTeams}
            onChangeText={setMaxTeams}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="Leave empty for unlimited"
            selectTextOnFocus={true}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            What happens next?
          </Text>
          <View style={styles.nextSteps}>
            <Text variant="bodyMedium" style={styles.step}>
              1. Your party will be created with a unique join code
            </Text>
            <Text variant="bodyMedium" style={styles.step}>
              2. You&apos;ll set up rounds and select question categories
            </Text>
            <Text variant="bodyMedium" style={styles.step}>
              3. Players can join using the join code
            </Text>
            <Text variant="bodyMedium" style={styles.step}>
              4. You&apos;ll control the game flow from the host dashboard
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleCreateParty}
        loading={loading}
        disabled={loading || !partyName.trim()}
        style={styles.createButton}
      >
        Create Party
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="datetime"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  title: {
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: '#1f2937',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
  },
  dateChip: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  nextSteps: {
    gap: 8,
  },
  step: {
    color: '#6b7280',
    lineHeight: 20,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  testInputContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  testLabel: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  testInput: {
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
