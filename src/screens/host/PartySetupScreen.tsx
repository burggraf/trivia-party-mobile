import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, FAB, Chip, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { HostStackParamList } from '../../navigation/HostNavigator';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import SimpleAddRoundModal from '../../components/host/SimpleAddRoundModal';

type Party = Database['public']['Tables']['parties']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];
type Navigation = StackNavigationProp<HostStackParamList, 'PartySetup'>;

export default function PartySetupScreen({ navigation, route }: { navigation: any; route: any }) {
  const { partyId } = route.params as { partyId: string };
  const insets = useSafeAreaInsets();

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
      await PartyService.broadcastGameStarted(partyId);
      
      // Give players time to receive game_started and set up for questions
      setTimeout(async () => {
        try {
          // Get and broadcast the first question
          const firstQuestion = await PartyService.getCurrentQuestion(rounds[0].id, 1);
          if (firstQuestion) {
            const questionWithRoundName = {
              ...firstQuestion,
              round_name: rounds[0].name
            };
            console.log('PartySetupScreen: Broadcasting first question after delay:', questionWithRoundName);
            // Don't pass pre-shuffled question, let the service generate the shuffle
            await PartyService.broadcastQuestionToPlayers(partyId, questionWithRoundName);
          }
        } catch (error) {
          console.error('Error broadcasting first question:', error);
        }
      }, 2000); // 2 second delay to ensure player subscriptions are ready
      
      navigation.navigate('HostParty', { partyId });
    } catch (error) {
      console.error('Error starting party:', error);
    }
  };

  const handleResumeParty = async () => {
    try {
      // Navigate directly to host party controls
      // HostPartyScreen will handle finding and broadcasting the next question
      navigation.navigate('HostParty', { partyId });
    } catch (error) {
      console.error('Error resuming party:', error);
    }
  };


  const handleOpenEnhancedLeaderboard = () => {
    navigation.navigate('EnhancedLeaderboard', { partyId });
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
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text variant="bodyLarge">Loading party setup...</Text>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text variant="bodyLarge">Party not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.partyInfoCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.partyName}>
              {party.name}
            </Text>
            
            <View style={styles.joinCodeSection}>
              <View style={styles.joinCodeInfo}>
                <Text variant="bodyLarge" style={styles.joinCode}>
                  Join Code: {party.join_code}
                </Text>
                <Text variant="bodySmall" style={styles.joinCodeHint}>
                  Players can scan the QR code or enter this code manually
                </Text>
              </View>
              
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={party.join_code}
                  size={80}
                  color="#1f2937"
                  backgroundColor="#ffffff"
                />
              </View>
            </View>
            
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
            
            <Divider style={styles.divider} />
            
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleOpenEnhancedLeaderboard}
                style={[styles.actionButton, styles.leaderboardButton]}
                icon="trophy"
              >
                Leaderboard
              </Button>
            </View>
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

        {party.status === 'active' && (
          <Button
            mode="contained"
            style={[styles.startButton, styles.resumeButton]}
            onPress={handleResumeParty}
            icon="play"
          >
            Resume Game
          </Button>
        )}
      </ScrollView>

      {party.status === 'draft' && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + 16 }]}
          onPress={handleShowModal}
          label="Add Round"
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
  joinCodeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  joinCodeInfo: {
    flex: 1,
    marginRight: 16,
  },
  joinCode: {
    color: '#6366f1',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  joinCodeHint: {
    color: '#6b7280',
    fontSize: 12,
  },
  qrCodeContainer: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  resumeButton: {
    backgroundColor: '#f59e0b',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  leaderboardButton: {
    borderColor: '#059669',
  },
});
