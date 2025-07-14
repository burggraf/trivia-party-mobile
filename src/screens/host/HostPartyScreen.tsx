import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HostStackParamList } from '../../navigation/HostNavigator';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import { shuffleQuestionAnswers, ShuffledQuestion } from '../../utils/questionUtils';
import LiveLeaderboard from '../../components/host/LiveLeaderboard';

type Party = Database['public']['Tables']['parties']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

interface GameState {
  currentRound: number;
  currentQuestion: number;
  totalQuestions: number;
  isShowingResults: boolean;
}

type Navigation = StackNavigationProp<HostStackParamList, 'HostParty'>;

export default function HostPartyScreen() {
  const route = useRoute();
  const navigation = useNavigation<Navigation>();
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<Party | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    currentQuestion: 1,
    totalQuestions: 0,
    isShowingResults: false,
  });
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [shuffledQuestion, setShuffledQuestion] = useState<ShuffledQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
  }, [partyId]);

  // Refresh teams and party status when screen comes into focus (without disrupting question progression)
  useFocusEffect(
    React.useCallback(() => {
      if (party?.status === 'active') {
        console.log('HostPartyScreen: Screen focused, refreshing teams only');
        refreshTeamsOnly();
      }
    }, [party?.status])
  );

  const refreshTeamsOnly = async () => {
    try {
      const [currentParty, teamsData] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyTeams(partyId),
      ]);
      
      setParty(currentParty);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error refreshing teams:', error);
    }
  };

  const loadGameData = async () => {
    try {
      const [currentParty, roundsData, teamsData] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyRounds(partyId),
        PartyService.getPartyTeams(partyId),
      ]);

      setParty(currentParty);
      setRounds(roundsData);
      setTeams(teamsData);

      // Load current/next question if game is active
      if (currentParty?.status === 'active' && roundsData.length > 0) {
        try {
          // Check if there are teams - if not, this is a freshly started game
          if (teamsData.length === 0) {
            console.log('HostPartyScreen: Freshly started game with no teams yet, loading first question');
            // Start with the first question of the first round
            const firstQuestion = await loadCurrentQuestion(roundsData[0].id, 1);
            
            if (firstQuestion) {
              await broadcastQuestionAndSetDisplay(firstQuestion, roundsData[0].name);
              setGameState({
                currentRound: 1,
                currentQuestion: 1,
                totalQuestions: roundsData[0].question_count,
                isShowingResults: false,
              });
            }
          } else {
            // Find the next unanswered question for resuming
            const nextQuestion = await PartyService.findNextUnansweredQuestion(partyId);
            
            if (nextQuestion) {
              console.log('HostPartyScreen: Resuming game with next unanswered question:', nextQuestion);
              
              // Load the specific question
              const questionData = await loadCurrentQuestion(nextQuestion.round.id, nextQuestion.questionOrder);
              
              // Update game state to current position
              await PartyService.updateGameState(partyId, nextQuestion.round.id, nextQuestion.questionOrder);
              
              // Set the correct game state
              const currentRoundIndex = roundsData.findIndex(r => r.id === nextQuestion.round.id);
              setGameState({
                currentRound: currentRoundIndex + 1,
                currentQuestion: nextQuestion.questionOrder,
                totalQuestions: nextQuestion.round.question_count,
                isShowingResults: false,
              });
              
              // Broadcast the current question to players who are joining/rejoining
              if (questionData) {
                console.log('HostPartyScreen: Broadcasting resume question:', questionData);
                await broadcastQuestionAndSetDisplay(questionData, nextQuestion.round.name);
              }
            } else {
              // All questions answered - game should be completed
              console.log('HostPartyScreen: All questions answered, game should be completed');
              await PartyService.updatePartyStatus(partyId, 'completed');
              setGameState({
                currentRound: roundsData.length,
                currentQuestion: roundsData[roundsData.length - 1]?.question_count || 1,
                totalQuestions: roundsData[roundsData.length - 1]?.question_count || 1,
                isShowingResults: true,
              });
            }
          }
        } catch (error) {
          console.error('HostPartyScreen: Error resuming active game:', error);
          // Fallback to first question if resume fails
          const firstQuestion = await loadCurrentQuestion(roundsData[0].id, 1);
          if (firstQuestion) {
            await broadcastQuestionAndSetDisplay(firstQuestion, roundsData[0].name);
          }
          setGameState(prev => ({
            ...prev,
            totalQuestions: roundsData[0].question_count,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert('Error', 'Failed to load game information');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentQuestion = async (roundId: string, questionOrder: number) => {
    try {
      console.log(`HostPartyScreen: Loading question for roundId: ${roundId}, questionOrder: ${questionOrder}`);
      const question = await PartyService.getCurrentQuestion(roundId, questionOrder);
      console.log('HostPartyScreen: Loaded question:', question);
      setCurrentQuestion(question);
      return question;
    } catch (error) {
      console.error('Error loading current question:', error);
      return null;
    }
  };

  const broadcastQuestionAndSetDisplay = async (questionData: any, roundName: string) => {
    console.log('HostPartyScreen: broadcastQuestionAndSetDisplay called with:', {
      questionText: questionData.questions?.question,
      questionId: questionData.id,
      roundName: roundName
    });
    
    // Broadcast question to players and get the shuffled version used
    const shuffled = await PartyService.broadcastQuestionToPlayers(partyId, {
      ...questionData,
      round_name: roundName
    });
    
    console.log('HostPartyScreen: Received shuffled question back:', shuffled);
    
    // Use the same shuffle for host display
    if (shuffled) {
      console.log('HostPartyScreen: Setting new shuffled question:', shuffled.originalQuestion);
      setShuffledQuestion(shuffled);
    } else {
      console.error('HostPartyScreen: No shuffled question returned from broadcastQuestionToPlayers!');
    }
    
    return shuffled;
  };

  const handleNextQuestion = async () => {
    console.log('HostPartyScreen: handleNextQuestion called with gameState:', gameState);
    const currentRound = rounds[gameState.currentRound - 1];
    if (!currentRound) {
      console.log('HostPartyScreen: No current round found!');
      return;
    }

    const nextQuestionNum = gameState.currentQuestion + 1;
    console.log(`HostPartyScreen: Current question: ${gameState.currentQuestion}, Next question: ${nextQuestionNum}, Round has ${currentRound.question_count} questions`);
    
    if (nextQuestionNum <= currentRound.question_count) {
      // Move to next question in current round
      const nextQuestion = await loadCurrentQuestion(currentRound.id, nextQuestionNum);
      
      // Update game state first
      const newGameState = {
        ...gameState,
        currentQuestion: nextQuestionNum,
        isShowingResults: false,
      };
      console.log('HostPartyScreen: Setting new game state:', newGameState);
      setGameState(newGameState);
      
      // Then broadcast the full question data to players
      if (nextQuestion) {
        console.log('HostPartyScreen: Broadcasting next question:', nextQuestion);
        await broadcastQuestionAndSetDisplay(nextQuestion, currentRound.name);
      }
    } else {
      // Check if there's a next round
      if (gameState.currentRound < rounds.length) {
        const nextRound = rounds[gameState.currentRound];
        const nextQuestion = await loadCurrentQuestion(nextRound.id, 1);
        
        // Broadcast the full question data to players
        if (nextQuestion) {
          console.log('HostPartyScreen: Broadcasting next round question:', nextQuestion);
          await broadcastQuestionAndSetDisplay(nextQuestion, nextRound.name);
        }
        
        setGameState({
          currentRound: gameState.currentRound + 1,
          currentQuestion: 1,
          totalQuestions: nextRound.question_count,
          isShowingResults: false,
        });
      } else {
        // Game completed
        await handleEndGame();
      }
    }
  };

  const handleShowResults = async () => {
    setGameState(prev => ({ ...prev, isShowingResults: true }));
    
    // Broadcast question results to players with the same shuffled answers they saw
    if (currentQuestion && shuffledQuestion) {
      await PartyService.broadcastQuestionResults(partyId, currentQuestion, shuffledQuestion);
    }
  };

  const handleEndGame = async () => {
    try {
      await PartyService.updatePartyStatus(partyId, 'completed');
      await PartyService.broadcastGameEnded(partyId);
      Alert.alert('Game Complete!', 'The trivia party has ended. Final results are now available.', [
        {
          text: 'View Results',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error ending game:', error);
      Alert.alert('Error', 'Failed to end the game');
    }
  };

  const getCurrentRound = () => rounds[gameState.currentRound - 1];

  const handleOpenTVDisplay = () => {
    navigation.navigate('TVDisplay', { partyId });
  };

  const handleOpenEnhancedLeaderboard = () => {
    navigation.navigate('EnhancedLeaderboard', { partyId });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Loading game controls...</Text>
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

  const currentRound = getCurrentRound();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Game Status Card */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {party.name} - Host Controls
          </Text>
          
          <View style={styles.statusRow}>
            <Chip mode="flat" style={styles.statusChip}>
              Round {gameState.currentRound} of {rounds.length}
            </Chip>
            <Chip mode="outlined" style={styles.statusChip}>
              Question {gameState.currentQuestion} of {gameState.totalQuestions}
            </Chip>
          </View>

          {currentRound && (
            <Text variant="bodyMedium" style={styles.roundName}>
              Current Round: {currentRound.name}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Teams Status */}
      <Card style={styles.teamsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Teams ({teams.length})
          </Text>
          
          {teams.map((team) => (
            <View key={team.id} style={styles.teamItem}>
              <View style={styles.teamInfo}>
                <View style={[styles.colorIndicator, { backgroundColor: team.color }]} />
                <Text variant="bodyLarge" style={styles.teamName}>
                  {team.name}
                </Text>
              </View>
              <Text variant="bodyLarge" style={styles.teamScore}>
                {team.score} pts
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Live Leaderboard */}
      <LiveLeaderboard partyId={partyId} maxTeams={5} compact={true} />

      {/* TV Display Controls */}
      <Card style={styles.tvDisplayCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Display & Analytics
          </Text>
          <Text variant="bodyMedium" style={styles.tvDisplayDescription}>
            Access TV-optimized display and enhanced leaderboard with round-by-round analytics.
          </Text>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={handleOpenTVDisplay}
              style={[styles.actionButton, styles.tvDisplayButton]}
              icon="television"
            >
              TV Display
            </Button>
            
            <Button
              mode="contained"
              onPress={handleOpenEnhancedLeaderboard}
              style={[styles.actionButton, styles.leaderboardButton]}
              icon="trophy"
            >
              Leaderboard
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Current Question Display */}
      {shuffledQuestion && (
        <Card style={styles.questionCard}>
          <Card.Content>
            <View style={styles.questionHeader}>
              <Text variant="labelLarge" style={styles.category}>
                {currentQuestion?.questions?.category}
              </Text>
              <Text variant="labelMedium" style={styles.difficulty}>
                {currentQuestion?.questions?.difficulty}
              </Text>
            </View>

            <Text variant="headlineSmall" style={styles.question}>
              {shuffledQuestion.originalQuestion}
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.answersTitle}>
              Answer Options:
            </Text>
            
            {shuffledQuestion.shuffledAnswers.map((answer) => (
              <View key={answer.letter} style={[
                styles.answerOption,
                gameState.isShowingResults && answer.isCorrect && styles.correctAnswerOption
              ]}>
                <Text variant="bodyMedium" style={styles.optionLabel}>
                  {answer.letter}.
                </Text>
                <Text variant="bodyMedium" style={[
                  styles.answerText,
                  gameState.isShowingResults && answer.isCorrect && styles.correctAnswerText
                ]}>
                  {answer.text}
                </Text>
                {gameState.isShowingResults && answer.isCorrect && (
                  <Text variant="bodyMedium" style={styles.correctIndicator}>
                    ✓ CORRECT
                  </Text>
                )}
              </View>
            ))}

            {!gameState.isShowingResults && (
              <View style={styles.hiddenAnswerNotice}>
                <Text variant="bodyMedium" style={styles.hiddenAnswerText}>
                  Correct answer will be revealed when you show results
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Host Controls */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Game Controls
          </Text>

          {!gameState.isShowingResults ? (
            <Button
              mode="outlined"
              onPress={handleShowResults}
              style={styles.controlButton}
              icon="chart-bar"
            >
              Show Question Results
            </Button>
          ) : (
            <View style={styles.resultControls}>
              <Text variant="bodyMedium" style={styles.resultText}>
                Question results are now visible to all players
              </Text>
              
              {gameState.currentQuestion < gameState.totalQuestions || gameState.currentRound < rounds.length ? (
                <Button
                  mode="contained"
                  onPress={handleNextQuestion}
                  style={styles.controlButton}
                  icon="arrow-right"
                >
                  {gameState.currentQuestion < gameState.totalQuestions 
                    ? 'Next Question' 
                    : 'Next Round'}
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleEndGame}
                  style={[styles.controlButton, styles.endGameButton]}
                  icon="trophy"
                >
                  End Game
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statusChip: {
    backgroundColor: '#6366f1',
  },
  roundName: {
    color: '#6b7280',
    textAlign: 'center',
  },
  teamsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  tvDisplayCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#f0f9ff',
  },
  tvDisplayDescription: {
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  tvDisplayButton: {
    backgroundColor: '#6366f1',
  },
  leaderboardButton: {
    backgroundColor: '#059669',
  },
  sectionTitle: {
    color: '#1f2937',
    marginBottom: 12,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  teamName: {
    color: '#1f2937',
  },
  teamScore: {
    color: '#059669',
    fontWeight: 'bold',
  },
  questionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  category: {
    color: '#6366f1',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficulty: {
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  question: {
    color: '#1f2937',
    lineHeight: 28,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  answersTitle: {
    color: '#1f2937',
    marginBottom: 12,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  optionLabel: {
    color: '#6366f1',
    fontWeight: 'bold',
    width: 20,
  },
  answerText: {
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  correctAnswerOption: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  correctIndicator: {
    color: '#059669',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hiddenAnswerNotice: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  hiddenAnswerText: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsCard: {
    elevation: 2,
  },
  controlButton: {
    marginTop: 12,
  },
  resultControls: {
    gap: 12,
  },
  resultText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  endGameButton: {
    backgroundColor: '#059669',
  },
});
