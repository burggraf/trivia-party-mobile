import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, RadioButton } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';

type Party = Database['public']['Tables']['parties']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

interface CurrentQuestion {
  id: string;
  party_question_id: string;
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  category: string;
  difficulty: string;
}

export default function PlayerPartyScreen() {
  const route = useRoute();
  const { partyId, teamId } = route.params as {
    partyId: string;
    teamId: string;
  };

  const [party, setParty] = useState<Party | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<
    'a' | 'b' | 'c' | 'd' | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gameStatus, setGameStatus] = useState<
    'waiting' | 'active' | 'completed'
  >('waiting');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('connecting');

  useEffect(() => {
    loadGameData();
    
    console.log('PlayerPartyScreen: Setting up broadcast subscription for party:', partyId);
    
    // Set up Realtime broadcast subscriptions
    const partySubscription = supabase
      .channel(`party-${partyId}`)
      .on('broadcast', { event: 'game_started' }, (payload) => {
        console.log('PlayerPartyScreen: Game started broadcast received:', payload);
        handleGameStarted();
      })
      .on('broadcast', { event: 'new_question' }, (payload) => {
        console.log('PlayerPartyScreen: New question broadcast received:', payload);
        handleNewQuestionBroadcast(payload.payload);
      })
      .on('broadcast', { event: 'game_ended' }, (payload) => {
        console.log('PlayerPartyScreen: Game ended broadcast received:', payload);
        handleGameEnded();
      })
      .on('broadcast', { event: 'team_score_updated' }, (payload) => {
        console.log('PlayerPartyScreen: Team score updated broadcast received:', payload);
        handleTeamScoreUpdate(payload.payload);
      })
      .subscribe((status) => {
        console.log('PlayerPartyScreen: Subscription status:', status);
        setSubscriptionStatus(status);
      });

    return () => {
      supabase.removeChannel(partySubscription);
    };
  }, [partyId, teamId]);

  const loadGameData = async () => {
    try {
      const [currentParty, teams] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyTeams(partyId),
      ]);

      const currentTeam = teams.find((t) => t.id === teamId);

      setParty(currentParty);
      setTeam(currentTeam || null);

      if (currentParty?.status === 'active') {
        setGameStatus('active');
        await loadCurrentQuestion();
      } else if (currentParty?.status === 'completed') {
        setGameStatus('completed');
        loadLeaderboard();
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert('Error', 'Failed to load game information');
    } finally {
      setLoading(false);
    }
  };

  // Broadcast event handlers
  const handleGameStarted = async () => {
    if (gameStatus === 'waiting') {
      setGameStatus('active');
      await loadCurrentQuestion();
      // Refresh team data
      const teams = await PartyService.getPartyTeams(partyId);
      const currentTeam = teams.find((t) => t.id === teamId);
      setTeam(currentTeam || null);
    }
  };

  const handleNewQuestionBroadcast = async (questionData: any) => {
    const { roundId, questionOrder } = questionData;
    const newQuestionId = `${roundId}-${questionOrder}`;
    
    if (newQuestionId !== currentQuestionId) {
      console.log('PlayerPartyScreen: Loading new question from broadcast:', newQuestionId);
      await loadSpecificQuestion(roundId, questionOrder);
    }
  };

  const handleGameEnded = () => {
    setGameStatus('completed');
    loadLeaderboard();
  };

  const handleTeamScoreUpdate = (teamData: any) => {
    if (teamData.id === team?.id) {
      setTeam(teamData);
    }
  };

  const refreshSubscription = async () => {
    console.log('PlayerPartyScreen: Refreshing subscription manually');
    setSubscriptionStatus('refreshing');
    
    try {
      // Check current party status
      const currentParty = await PartyService.getPartyById(partyId);
      console.log('PlayerPartyScreen: Current party status:', currentParty?.status);
      
      if (currentParty?.status === 'active' && gameStatus === 'waiting') {
        console.log('PlayerPartyScreen: Manual refresh detected game started');
        await handleGameStarted();
      } else if (currentParty?.status === 'completed') {
        console.log('PlayerPartyScreen: Manual refresh detected game ended');
        handleGameEnded();
      } else if (currentParty?.status === 'active' && gameStatus === 'active') {
        // Since all questions exist in DB, we need a different way to find the "current" question
        // For now, let's just try to load the next logical question
        console.log('PlayerPartyScreen: Trying to find next question...');
        
        if (currentQuestionId) {
          const [roundId, questionOrderStr] = currentQuestionId.split('-');
          const currentOrder = parseInt(questionOrderStr);
          const rounds = await PartyService.getPartyRounds(partyId);
          const currentRound = rounds.find(r => r.id === roundId);
          
          if (currentRound) {
            console.log('PlayerPartyScreen: Current round:', currentRound.name, 'question:', currentOrder, 'of', currentRound.question_count);
            
            // Try next question in current round
            if (currentOrder < currentRound.question_count) {
              const nextOrder = currentOrder + 1;
              console.log('PlayerPartyScreen: Trying next question in round:', nextOrder);
              try {
                await loadSpecificQuestion(roundId, nextOrder);
                console.log('PlayerPartyScreen: Loaded next question successfully');
              } catch (error) {
                console.log('PlayerPartyScreen: Next question not available yet');
              }
            } else {
              // Try first question of next round
              const currentRoundIndex = rounds.findIndex(r => r.id === roundId);
              if (currentRoundIndex >= 0 && currentRoundIndex < rounds.length - 1) {
                const nextRound = rounds[currentRoundIndex + 1];
                console.log('PlayerPartyScreen: Trying first question of next round:', nextRound.name);
                try {
                  await loadSpecificQuestion(nextRound.id, 1);
                  console.log('PlayerPartyScreen: Loaded next round successfully');
                } catch (error) {
                  console.log('PlayerPartyScreen: Next round not available yet');
                }
              } else {
                console.log('PlayerPartyScreen: No more questions available');
              }
            }
          }
        }
      }
      
      // Refresh team data
      const teams = await PartyService.getPartyTeams(partyId);
      const currentTeam = teams.find((t) => t.id === teamId);
      if (currentTeam) {
        setTeam(currentTeam);
        console.log('PlayerPartyScreen: Updated team score:', currentTeam.score);
      }
      
      setSubscriptionStatus('subscribed');
    } catch (error) {
      console.error('PlayerPartyScreen: Error refreshing subscription:', error);
      setSubscriptionStatus('error');
    }
  };

  const loadCurrentQuestion = async () => {
    await loadSpecificQuestion();
  };

  const loadSpecificQuestion = async (roundId?: string, questionOrder?: number) => {
    try {
      let targetRoundId = roundId;
      let targetQuestionOrder = questionOrder || 1;
      
      if (!targetRoundId) {
        // Load first question of first round by default
        const rounds = await PartyService.getPartyRounds(partyId);
        if (rounds.length === 0) return;
        targetRoundId = rounds[0].id;
      }

      const question = await PartyService.getCurrentQuestion(targetRoundId, targetQuestionOrder);
      
      if (question && question.questions) {
        console.log('PlayerPartyScreen: Loading question:', question.id);
        setCurrentQuestion({
          id: question.questions.id,
          party_question_id: question.id,
          question: question.questions.question,
          a: question.questions.a,
          b: question.questions.b,
          c: question.questions.c,
          d: question.questions.d,
          category: question.questions.category,
          difficulty: question.questions.difficulty,
        });
        setCurrentQuestionId(`${targetRoundId}-${targetQuestionOrder}`);
        // Reset answer state for new question
        setSelectedAnswer(null);
        setHasAnswered(false);
      }
    } catch (error) {
      console.error('Error loading specific question:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await PartyService.getPartyLeaderboard(partyId);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || !team) {
      Alert.alert('Error', 'Please select an answer');
      return;
    }

    try {
      setSubmitting(true);

      const isCorrect = await PartyService.submitAnswer(
        currentQuestion.party_question_id, 
        team.id, 
        selectedAnswer
      );

      setHasAnswered(true);
      
      const resultMessage = isCorrect 
        ? "Correct! Your team earned points." 
        : "Answer submitted. Wait for results!";
        
      Alert.alert('Answer Submitted!', resultMessage);
      
      // Refresh team score
      const updatedTeams = await PartyService.getPartyTeams(partyId);
      const updatedTeam = updatedTeams.find(t => t.id === team.id);
      if (updatedTeam) {
        setTeam(updatedTeam);
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', error.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const renderWaitingScreen = () => (
    <View style={styles.centerContainer}>
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.statusTitle}>
            Waiting for Game to Start
          </Text>
          <Text variant="bodyLarge" style={styles.statusSubtitle}>
            Your team &quot;{team?.name}&quot; is ready!
          </Text>
          <Text variant="bodyMedium" style={styles.statusDescription}>
            The host will start the game when all teams are ready. Get
            comfortable and prepare for some trivia fun!
          </Text>
          <Text variant="bodySmall" style={styles.statusHint}>
            ⚡ Connected ({subscriptionStatus}) - you'll be notified instantly when the game starts!
          </Text>
          
          <Button
            mode="outlined"
            onPress={refreshSubscription}
            style={styles.refreshButton}
            icon="refresh"
            loading={subscriptionStatus === 'refreshing'}
            disabled={subscriptionStatus === 'refreshing'}
          >
            Refresh Connection
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.teamInfoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.teamTitle}>
            Team Information
          </Text>
          <View style={styles.teamInfo}>
            <View
              style={[styles.colorIndicator, { backgroundColor: team?.color }]}
            />
            <Text variant="bodyLarge" style={styles.teamName}>
              {team?.name}
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.teamScore}>
            Current Score: {team?.score || 0} points
          </Text>
        </Card.Content>
      </Card>
    </View>
  );

  const renderQuestionScreen = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.questionCard}>
        <Card.Content>
          <View style={styles.questionHeader}>
            <Text variant="labelLarge" style={styles.category}>
              {currentQuestion?.category}
            </Text>
            <Text variant="labelMedium" style={styles.difficulty}>
              {currentQuestion?.difficulty}
            </Text>
          </View>

          <Text variant="headlineSmall" style={styles.question}>
            {currentQuestion?.question}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.answersCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.answersTitle}>
            Select your answer:
          </Text>

          <RadioButton.Group
            onValueChange={(value) =>
              setSelectedAnswer(value as 'a' | 'b' | 'c' | 'd')
            }
            value={selectedAnswer || ''}
          >
            {['a', 'b', 'c', 'd'].map((option) => (
              <View key={option} style={styles.answerOption}>
                <RadioButton
                  value={option}
                  disabled={hasAnswered}
                  color="#6366f1"
                />
                <Text variant="bodyLarge" style={styles.answerText}>
                  {currentQuestion?.[option as keyof CurrentQuestion] || `Option ${option.toUpperCase()} text missing`}
                </Text>
              </View>
            ))}
          </RadioButton.Group>

          {!hasAnswered && (
            <Button
              mode="contained"
              onPress={handleSubmitAnswer}
              loading={submitting}
              disabled={submitting || !selectedAnswer}
              style={styles.submitButton}
            >
              Submit Answer
            </Button>
          )}

          {hasAnswered && (
            <Card style={styles.submittedCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.submittedText}>
                  ✓ Answer submitted! Waiting for next question...
                </Text>
                <Text variant="bodySmall" style={styles.submittedHint}>
                  ⚡ You'll be notified instantly when the next question appears!
                </Text>
                
                <Button
                  mode="text"
                  onPress={refreshSubscription}
                  style={styles.refreshButtonSmall}
                  icon="refresh"
                  loading={subscriptionStatus === 'refreshing'}
                  disabled={subscriptionStatus === 'refreshing'}
                >
                  Refresh
                </Button>
              </Card.Content>
            </Card>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderCompletedScreen = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.statusTitle}>
            Game Complete!
          </Text>
          <Text variant="bodyLarge" style={styles.statusSubtitle}>
            Thanks for playing!
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.leaderboardCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.leaderboardTitle}>
            Final Leaderboard
          </Text>

          {leaderboard.map((team, index) => (
            <View key={team.id} style={styles.leaderboardItem}>
              <Text variant="titleMedium" style={styles.rank}>
                #{index + 1}
              </Text>
              <View style={styles.teamLeaderboardInfo}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: team.color },
                  ]}
                />
                <Text variant="bodyLarge" style={styles.leaderboardTeamName}>
                  {team.name}
                </Text>
              </View>
              <Text variant="titleMedium" style={styles.leaderboardScore}>
                {team.score}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Loading game...</Text>
      </View>
    );
  }

  if (!party || !team) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Game not found</Text>
      </View>
    );
  }

  switch (gameStatus) {
    case 'waiting':
      return renderWaitingScreen();
    case 'active':
      return renderQuestionScreen();
    case 'completed':
      return renderCompletedScreen();
    default:
      return renderWaitingScreen();
  }
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
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  statusCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statusTitle: {
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    color: '#6366f1',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusDescription: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusHint: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  refreshButton: {
    marginTop: 16,
    borderColor: '#6366f1',
  },
  refreshButtonSmall: {
    marginTop: 8,
  },
  teamInfoCard: {
    elevation: 2,
  },
  teamTitle: {
    color: '#1f2937',
    marginBottom: 12,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  teamName: {
    color: '#1f2937',
    fontWeight: 'bold',
  },
  teamScore: {
    color: '#6b7280',
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
  },
  answersCard: {
    elevation: 2,
  },
  answersTitle: {
    color: '#1f2937',
    marginBottom: 16,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  answerText: {
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  submittedCard: {
    marginTop: 16,
    backgroundColor: '#ecfdf5',
    elevation: 1,
  },
  submittedText: {
    color: '#059669',
    textAlign: 'center',
  },
  submittedHint: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    fontSize: 12,
  },
  leaderboardCard: {
    elevation: 2,
  },
  leaderboardTitle: {
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rank: {
    color: '#6366f1',
    width: 40,
    fontWeight: 'bold',
  },
  teamLeaderboardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaderboardTeamName: {
    color: '#1f2937',
  },
  leaderboardScore: {
    color: '#059669',
    fontWeight: 'bold',
  },
});
