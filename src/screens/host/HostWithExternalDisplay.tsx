import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExternalDisplay from 'react-native-external-display';

// Type definitions for react-native-external-display
interface ExternalDisplayType {
  onScreenConnect: (callback: () => void) => void;
  onScreenDisconnect: (callback: () => void) => void;
  startPresenting: (component: React.ReactElement, options: { backgroundColor: string; initialProps: any }) => void;
  stopPresenting: () => void;
  isPresenting: () => boolean;
}

const ExternalDisplayInstance = ExternalDisplay as any as ExternalDisplayType;
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';
import ExternalTVDisplay from '../../components/host/ExternalTVDisplay';

type Party = Database['public']['Tables']['parties']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];

interface HostWithExternalDisplayProps {
  navigation: any;
  route: any;
}

export default function HostWithExternalDisplay({ navigation, route }: HostWithExternalDisplayProps) {
  const { partyId } = route.params as { partyId: string };
  const insets = useSafeAreaInsets();

  const [party, setParty] = useState<Party | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [shuffledQuestion, setShuffledQuestion] = useState<any>(null);
  const [showingResults, setShowingResults] = useState(false);
  const [gameState, setGameState] = useState<{
    currentRound: number;
    currentQuestion: number;
    totalQuestions: number;
    roundName: string;
  }>({
    currentRound: 1,
    currentQuestion: 1,
    totalQuestions: 0,
    roundName: '',
  });
  const [externalDisplayConnected, setExternalDisplayConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
    setupBroadcastSubscription();
    
    // Listen for external display connection
    ExternalDisplayInstance.onScreenConnect(() => {
      console.log('External display connected!');
      setExternalDisplayConnected(true);
    });
    
    ExternalDisplayInstance.onScreenDisconnect(() => {
      console.log('External display disconnected!');
      setExternalDisplayConnected(false);
    });

    return () => {
      ExternalDisplayInstance.stopPresenting();
    };
  }, [partyId]);

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

      // Load current question if game is active
      if (currentParty?.status === 'active' && roundsData.length > 0) {
        try {
          const nextQuestion = await PartyService.findNextUnansweredQuestion(partyId);
          if (nextQuestion) {
            const questionData = await loadCurrentQuestion(nextQuestion.round.id, nextQuestion.questionOrder);
            if (questionData) {
              const currentRoundIndex = roundsData.findIndex(r => r.id === nextQuestion.round.id);
              setGameState({
                currentRound: currentRoundIndex + 1,
                currentQuestion: nextQuestion.questionOrder,
                totalQuestions: nextQuestion.round.question_count,
                roundName: nextQuestion.round.name,
              });
            }
          }
        } catch (error) {
          console.error('Error loading current question:', error);
        }
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert('Error', 'Failed to load game information');
    } finally {
      setLoading(false);
    }
  };

  const setupBroadcastSubscription = () => {
    const partySubscription = supabase
      .channel(`party-${partyId}`)
      .on('broadcast', { event: 'question_data' }, (payload) => {
        handleQuestionData(payload.payload);
      })
      .on('broadcast', { event: 'question_results' }, (payload) => {
        handleQuestionResults(payload.payload);
      })
      .on('broadcast', { event: 'team_score_updated' }, (payload) => {
        handleTeamScoreUpdate(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(partySubscription);
    };
  };

  const loadCurrentQuestion = async (roundId: string, questionOrder: number) => {
    try {
      const question = await PartyService.getCurrentQuestion(roundId, questionOrder);
      setCurrentQuestion(question);
      return question;
    } catch (error) {
      console.error('Error loading current question:', error);
      return null;
    }
  };

  const handleQuestionData = (questionData: any) => {
    setCurrentQuestion(questionData);
    setShuffledQuestion(questionData);
    setShowingResults(false);
    
    setGameState(prev => ({
      ...prev,
      currentQuestion: questionData.question_number || 1,
      roundName: questionData.round_name || '',
    }));
  };

  const handleQuestionResults = (resultsData: any) => {
    setShowingResults(true);
  };

  const handleTeamScoreUpdate = (teamData: any) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamData.id ? { ...team, score: teamData.score } : team
      )
    );
  };

  const handleNextQuestion = async () => {
    const currentRound = rounds[gameState.currentRound - 1];
    if (!currentRound) return;

    const nextQuestionNum = gameState.currentQuestion + 1;
    
    if (nextQuestionNum <= currentRound.question_count) {
      // Move to next question in current round
      const nextQuestion = await loadCurrentQuestion(currentRound.id, nextQuestionNum);
      
      const newGameState = {
        ...gameState,
        currentQuestion: nextQuestionNum,
      };
      setGameState(newGameState);
      setShowingResults(false);
      
      if (nextQuestion) {
        await broadcastQuestionAndSetDisplay(nextQuestion, currentRound.name);
      }
    } else {
      // Check if there's a next round
      if (gameState.currentRound < rounds.length) {
        const nextRound = rounds[gameState.currentRound];
        const nextQuestion = await loadCurrentQuestion(nextRound.id, 1);
        
        if (nextQuestion) {
          await broadcastQuestionAndSetDisplay(nextQuestion, nextRound.name);
        }
        
        setGameState({
          currentRound: gameState.currentRound + 1,
          currentQuestion: 1,
          totalQuestions: nextRound.question_count,
          roundName: nextRound.name,
        });
        setShowingResults(false);
      } else {
        // Game completed
        await handleEndGame();
      }
    }
  };

  const broadcastQuestionAndSetDisplay = async (questionData: any, roundName: string) => {
    const shuffled = await PartyService.broadcastQuestionToPlayers(partyId, {
      ...questionData,
      round_name: roundName
    });
    
    if (shuffled) {
      setShuffledQuestion(shuffled);
    }
  };

  const handleShowResults = async () => {
    setShowingResults(true);
    
    if (currentQuestion && shuffledQuestion) {
      await PartyService.broadcastQuestionResults(partyId, currentQuestion, shuffledQuestion);
    }
  };

  const handleEndGame = async () => {
    try {
      await PartyService.updatePartyStatus(partyId, 'completed');
      await PartyService.broadcastGameEnded(partyId);
      Alert.alert('Game Complete!', 'The trivia party has ended.');
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const startExternalDisplay = () => {
    if (!externalDisplayConnected) {
      Alert.alert(
        'Connect to TV',
        'To display trivia content on your TV:\n\n1. Connect your device to Apple TV via AirPlay\n2. Enable "Screen Mirroring"\n3. Tap "Start TV Display" again',
        [{ text: 'OK' }]
      );
      return;
    }

    // Start presenting to external display
    ExternalDisplayInstance.startPresenting(
      <ExternalTVDisplay
        party={party}
        currentQuestion={shuffledQuestion}
        gameState={gameState}
        teams={teams}
        showingResults={showingResults}
      />,
      { 
        backgroundColor: '#0f172a',
        initialProps: {} 
      }
    );
  };

  const stopExternalDisplay = () => {
    ExternalDisplayInstance.stopPresenting();
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text variant="bodyLarge">Loading game controls...</Text>
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
      {/* External Display Controls */}
      <View style={styles.tvControls}>
        <View style={styles.tvStatus}>
          <Text variant="titleMedium" style={styles.tvStatusText}>
            TV Display: {externalDisplayConnected ? 'Connected' : 'Not Connected'}
          </Text>
          {ExternalDisplayInstance.isPresenting() && (
            <Chip mode="flat" style={styles.presentingChip}>
              Presenting to TV
            </Chip>
          )}
        </View>
        
        <View style={styles.tvButtons}>
          {externalDisplayConnected && !ExternalDisplayInstance.isPresenting() && (
            <Button
              mode="contained"
              onPress={startExternalDisplay}
              icon="television"
              style={styles.tvButton}
            >
              Start TV Display
            </Button>
          )}
          
          {ExternalDisplayInstance.isPresenting() && (
            <Button
              mode="outlined"
              onPress={stopExternalDisplay}
              icon="television-off"
              style={styles.tvButton}
            >
              Stop TV Display
            </Button>
          )}
          
          {!externalDisplayConnected && (
            <Button
              mode="outlined"
              onPress={startExternalDisplay}
              icon="airplay"
              style={styles.tvButton}
            >
              Connect to TV
            </Button>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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

            {gameState.roundName && (
              <Text variant="bodyMedium" style={styles.roundName}>
                Current Round: {gameState.roundName}
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

        {/* Current Question Info (for host) */}
        {shuffledQuestion && (
          <Card style={styles.questionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Current Question
              </Text>
              <Text variant="bodyMedium" style={styles.questionPreview}>
                {shuffledQuestion.originalQuestion}
              </Text>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.questionMeta}>
                Category: {shuffledQuestion.questions?.category} | 
                Difficulty: {shuffledQuestion.questions?.difficulty}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Host Controls */}
        <Card style={styles.controlsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Game Controls
            </Text>

            {!showingResults ? (
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
  tvControls: {
    backgroundColor: '#1e293b',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tvStatus: {
    flex: 1,
  },
  tvStatusText: {
    color: '#f1f5f9',
    marginBottom: 4,
  },
  presentingChip: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-start',
  },
  tvButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tvButton: {
    minWidth: 120,
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
  questionPreview: {
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  questionMeta: {
    color: '#6b7280',
  },
  controlsCard: {
    elevation: 2,
    marginBottom: 16,
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