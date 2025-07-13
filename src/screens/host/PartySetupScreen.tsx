import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, FAB, Chip, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HostStackParamList } from '../../navigation/HostNavigator';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import SimpleAddRoundModal from '../../components/host/SimpleAddRoundModal';

type Party = Database['public']['Tables']['parties']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];
type Navigation = StackNavigationProp<HostStackParamList, 'PartySetup'>;

export default function PartySetupScreen() {
  const route = useRoute();
  const navigation = useNavigation<Navigation>();
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<Party | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [roundQuestionCounts, setRoundQuestionCounts] = useState<Record<string, number>>({});

  const handleShowModal = () => {
    setShowAddRoundModal(true);
  };

  const handleHideModal = () => {
    setShowAddRoundModal(false);
  };

  const loadPartyData = async () => {
    try {
      const [currentParty, roundsData] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyRounds(partyId),
      ]);

      setParty(currentParty);
      setRounds(roundsData);

      // Load question counts for each round
      const questionCounts: Record<string, number> = {};
      for (const round of roundsData) {
        try {
          const questions = await PartyService.getRoundQuestions(round.id);
          questionCounts[round.id] = questions.length;
        } catch (error) {
          console.error(`Error loading questions for round ${round.id}:`, error);
          questionCounts[round.id] = 0;
        }
      }
      setRoundQuestionCounts(questionCounts);
    } catch (error) {
      console.error('Error loading party data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartyData();
  }, [partyId]);

  const handleAddRound = async (roundData: any) => {
    try {
      const insertData = {
        party_id: partyId,
        round_number: rounds.length + 1,
        ...roundData,
      };
      
      const newRound = await PartyService.addRound(insertData);
      
      // Automatically select questions for the new round
      try {
        await PartyService.selectQuestionsForRound(
          newRound.id,
          roundData.categories || [],
          roundData.difficulty,
          roundData.question_count
        );
      } catch (questionError) {
        console.error('Error selecting questions:', questionError);
        alert('Round created but failed to select questions. You can select them manually later.');
      }
      
      setRounds([...rounds, newRound]);
      // Update question count for the new round
      setRoundQuestionCounts(prev => ({
        ...prev,
        [newRound.id]: roundData.question_count
      }));
      handleHideModal();
    } catch (error) {
      console.error('Error adding round:', error);
      alert(`Error adding round: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSelectQuestions = async (round: Round) => {
    try {
      await PartyService.selectQuestionsForRound(
        round.id,
        round.categories || [],
        round.difficulty,
        round.question_count
      );
      // Update the question count
      const questions = await PartyService.getRoundQuestions(round.id);
      setRoundQuestionCounts(prev => ({
        ...prev,
        [round.id]: questions.length
      }));
      alert(`Successfully selected ${questions.length} questions for "${round.name}"`);
    } catch (error) {
      console.error('Error selecting questions:', error);
      alert(`Error selecting questions: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStartParty = async () => {
    if (rounds.length === 0) {
      alert('Please add at least one round before starting the party');
      return;
    }

    try {
      await PartyService.updatePartyStatus(partyId, 'active');
      navigation.navigate('HostParty', { partyId });
    } catch (error) {
      console.error('Error starting party:', error);
    }
  };

  const renderRoundCard = ({ item }: { item: Round }) => (
    <Card style={styles.roundCard}>
      <Card.Content>
        <View style={styles.roundHeader}>
          <Text variant="titleMedium">
            Round {item.round_number}: {item.name}
          </Text>
          <Chip mode="outlined" style={getStatusChipStyle(item.status)}>
            {item.status}
          </Chip>
        </View>

        <View style={styles.roundDetails}>
          <Text variant="bodyMedium">
            Questions: {roundQuestionCounts[item.id] || 0} / {item.question_count}
            {roundQuestionCounts[item.id] === item.question_count && ' ✓'}
          </Text>
          <Text variant="bodyMedium">
            Categories:{' '}
            {item.categories.length > 0 ? item.categories.join(', ') : 'All'}
          </Text>
          {item.difficulty && (
            <Text variant="bodyMedium">Difficulty: {item.difficulty}</Text>
          )}
        </View>

        {party?.status === 'draft' && (
          <View style={styles.roundActions}>
            <Button
              mode="outlined"
              onPress={() => handleSelectQuestions(item)}
              style={styles.selectQuestionsButton}
              icon="refresh"
            >
              Select Questions
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#10b981' };
      case 'completed':
        return { backgroundColor: '#6b7280' };
      default:
        return { backgroundColor: '#6366f1' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Loading party setup...</Text>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Party not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.partyInfoCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.partyName}>
              {party.name}
            </Text>
            <Text variant="bodyLarge" style={styles.joinCode}>
              Join Code: {party.join_code}
            </Text>
            {party.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {party.description}
              </Text>
            )}
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.partyDetails}>
              Scheduled: {new Date(party.scheduled_date).toLocaleString()}
            </Text>
            <Text variant="bodySmall" style={styles.partyDetails}>
              Max Teams: {party.max_teams || 'Unlimited'}
            </Text>
            <Text variant="bodySmall" style={styles.partyDetails}>
              Status: {party.status}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.roundsSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Rounds ({rounds.length})
          </Text>

          {rounds.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No rounds added yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  Add rounds to organize your trivia questions by topic or
                  difficulty
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={rounds}
              keyExtractor={(item) => item.id}
              renderItem={renderRoundCard}
              scrollEnabled={false}
            />
          )}
        </View>

        {party.status === 'draft' && rounds.length > 0 && (
          <Button
            mode="contained"
            style={styles.startButton}
            onPress={handleStartParty}
          >
            Start Party
          </Button>
        )}
      </ScrollView>

      {party.status === 'draft' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleShowModal}
        />
      )}

      <SimpleAddRoundModal
        visible={showAddRoundModal}
        onDismiss={handleHideModal}
        onAdd={handleAddRound}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    padding: 16,
  },
  partyInfoCard: {
    marginBottom: 24,
    elevation: 2,
  },
  partyName: {
    color: '#1f2937',
    marginBottom: 8,
  },
  joinCode: {
    color: '#6366f1',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#6b7280',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  partyDetails: {
    color: '#9ca3af',
    marginBottom: 4,
  },
  roundsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1f2937',
    marginBottom: 16,
  },
  roundCard: {
    marginBottom: 12,
    elevation: 1,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundDetails: {
    gap: 4,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyTitle: {
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6b7280',
  },
  startButton: {
    paddingVertical: 8,
    backgroundColor: '#10b981',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
  roundActions: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectQuestionsButton: {
    backgroundColor: '#f3f4f6',
  },
});
