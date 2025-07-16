import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { convertShuffledAnswerToOriginal, shuffleQuestionAnswers } from '../../utils/questionUtils';

type Party = Database['public']['Tables']['parties']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

interface CurrentQuestion {
  party_question_id: string;
  question: string;
  shuffled_answers: Array<{
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
    isCorrect: boolean;
  }>;
  category: string;
  difficulty: string;
  round_name: string;
  question_number: number;
}

export default function PlayerPartyScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { partyId, teamId } = route.params || {};

  // Handle missing params - redirect to home if no party/team data
  useEffect(() => {
    if (!partyId || !teamId) {
      console.warn('PlayerPartyScreen: Missing partyId or teamId, redirecting to home');
      navigation.navigate('PlayerHome');
    }
  }, [partyId, teamId, navigation]);

  const [party, setParty] = useState<Party | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<
    'A' | 'B' | 'C' | 'D' | null
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
  const [showingResults, setShowingResults] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [roundIntroData, setRoundIntroData] = useState<{roundNumber: number; roundName: string; questionCount: number} | null>(null);
  const [roundCompleteData, setRoundCompleteData] = useState<{roundNumber: number; roundName: string} | null>(null);

  useEffect(() => {
    loadGameData();
    
    // Set up custom back handler to show Leave Game dialog instead of navigating back
    navigation.setBackHandler(() => {
      handleLeaveGame();
    });
    
    console.log('PlayerPartyScreen: Setting up broadcast subscription for party:', partyId);
    
    // Set up Realtime broadcast subscriptions
    const partySubscription = supabase
      .channel(`party-${partyId}`)
      .on('broadcast', { event: 'game_started' }, (payload) => {
        console.log('PlayerPartyScreen: Game started broadcast received:', payload);
        handleGameStarted();
      })
      .on('broadcast', { event: 'round_intro' }, (payload) => {
        console.log('PlayerPartyScreen: Round intro broadcast received:', payload);
        handleRoundIntro(payload.payload);
      })
      .on('broadcast', { event: 'question_data' }, (payload) => {
        console.log('PlayerPartyScreen: Question data broadcast received:', payload);
        handleQuestionDataBroadcast(payload.payload);
      })
      .on('broadcast', { event: 'question_results' }, (payload) => {
        console.log('PlayerPartyScreen: Question results broadcast received:', payload);
        handleQuestionResults(payload.payload);
      })
      .on('broadcast', { event: 'round_complete' }, (payload) => {
        console.log('PlayerPartyScreen: Round complete broadcast received:', payload);
        handleRoundComplete(payload.payload);
      })
      .on('broadcast', { event: 'game_complete' }, (payload) => {
        console.log('PlayerPartyScreen: Game complete broadcast received:', payload);
        handleGameComplete();
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
      // Clean up custom back handler
      navigation.setBackHandler(null);
      supabase.removeChannel(partySubscription);
    };
  }, [partyId, teamId]);

  const loadGameData = async () => {
    try {
      const [currentParty, teams] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyTeams(partyId),
      ]);

      let currentTeam = teams.find((t) => t.id === teamId);
      
      // If team not found immediately (possible race condition with new team creation),
      // retry once after a short delay
      if (!currentTeam && teamId) {
        console.log('PlayerPartyScreen: Team not found in initial load, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const retryTeams = await PartyService.getPartyTeams(partyId);
        currentTeam = retryTeams.find((t) => t.id === teamId);
        
        if (currentTeam) {
          console.log('PlayerPartyScreen: Team found on retry:', currentTeam.name);
        } else {
          console.warn('PlayerPartyScreen: Team still not found after retry, teamId:', teamId);
        }
      }

      setParty(currentParty);
      setTeam(currentTeam || null);

      if (currentParty?.status === 'active') {
        console.log('PlayerPartyScreen: Party is active, loading current question...');
        setGameStatus('active');
        
        // Load current active question when joining game in progress
        try {
          console.log('PlayerPartyScreen: Loading current active question for game in progress');
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Question loading timeout')), 5000);
          });
          
          const gameStatePromise = PartyService.getCurrentGameState(partyId);
          const gameState = await Promise.race([gameStatePromise, timeoutPromise]);
          console.log('PlayerPartyScreen: Current game state:', gameState);
          
          if (gameState?.current_round_id && gameState?.current_question_order) {
            console.log('PlayerPartyScreen: Found valid game state, loading question...');
            const questionPromise = PartyService.getCurrentQuestion(
              gameState.current_round_id, 
              gameState.current_question_order
            );
            const currentQuestion = await Promise.race([questionPromise, timeoutPromise]);
            console.log('PlayerPartyScreen: getCurrentQuestion result:', currentQuestion);
            
            if (currentQuestion && currentQuestion.questions) {
              console.log('PlayerPartyScreen: Found current active question:', currentQuestion.questions.question);
              
              // Shuffle the answers for display
              const shuffledData = shuffleQuestionAnswers({
                question: currentQuestion.questions.question,
                a: currentQuestion.questions.a,
                b: currentQuestion.questions.b,
                c: currentQuestion.questions.c,
                d: currentQuestion.questions.d,
              });
              
              // Convert to the format expected by the player screen
              const questionData = {
                party_question_id: currentQuestion.id,
                question: shuffledData.originalQuestion,
                shuffled_answers: shuffledData.shuffledAnswers,
                category: currentQuestion.questions.category,
                difficulty: currentQuestion.questions.difficulty,
                round_name: 'Current Round',
                question_number: currentQuestion.question_order
              };
              
              setCurrentQuestion(questionData);
              setCurrentQuestionId(currentQuestion.id);
              console.log('PlayerPartyScreen: Successfully set current question for mid-game join');
            } else {
              console.log('PlayerPartyScreen: No current question data found, trying fallback method');
              await tryFallbackQuestionLoad();
            }
          } else {
            console.log('PlayerPartyScreen: No active game state found, trying fallback method');
            await tryFallbackQuestionLoad();
          }
        } catch (error) {
          console.error('PlayerPartyScreen: Error loading current active question:', error);
          console.log('PlayerPartyScreen: Trying fallback method due to error');
          await tryFallbackQuestionLoad();
        }
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
      // Refresh team data - question will come via broadcast
      const teams = await PartyService.getPartyTeams(partyId);
      const currentTeam = teams.find((t) => t.id === teamId);
      setTeam(currentTeam || null);
    }
  };

  const handleRoundIntro = (roundData: {roundNumber: number; roundName: string; questionCount: number}) => {
    console.log('PlayerPartyScreen: Showing round intro:', roundData);
    setRoundIntroData(roundData);
    setCurrentQuestion(null);
    setShowingResults(false);
    setCorrectAnswer(null);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setRoundCompleteData(null);
  };

  const handleRoundComplete = (roundData: {roundNumber: number; roundName: string}) => {
    console.log('PlayerPartyScreen: Showing round complete:', roundData);
    setRoundCompleteData(roundData);
    setCurrentQuestion(null);
    setShowingResults(false);
    setCorrectAnswer(null);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setRoundIntroData(null);
    
    // Load updated leaderboard
    loadLeaderboard();
  };

  const handleGameComplete = () => {
    console.log('PlayerPartyScreen: Game complete!');
    setGameStatus('completed');
    setCurrentQuestion(null);
    setShowingResults(false);
    setCorrectAnswer(null);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setRoundIntroData(null);
    setRoundCompleteData(null);
    
    // Load final leaderboard
    loadLeaderboard();
  };

  const handleQuestionDataBroadcast = (questionData: any) => {
    console.log('PlayerPartyScreen: Setting question data from broadcast:', questionData);
    
    // Validate question data
    if (!questionData || !questionData.party_question_id || !questionData.question || !questionData.shuffled_answers) {
      console.error('PlayerPartyScreen: Invalid question data received:', questionData);
      return;
    }
    
    setCurrentQuestion(questionData);
    setCurrentQuestionId(questionData.party_question_id);
    // Reset answer state for new question
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowingResults(false);
    setCorrectAnswer(null);
    // Clear round intro/complete screens
    setRoundIntroData(null);
    setRoundCompleteData(null);
    
    console.log('PlayerPartyScreen: Question set successfully:', {
      party_question_id: questionData.party_question_id,
      question: questionData.question,
      shuffled_answers: questionData.shuffled_answers
    });
  };

  const handleQuestionResults = (resultsData: any) => {
    console.log('PlayerPartyScreen: Showing question results:', resultsData);
    setCorrectAnswer(resultsData.correct_answer_letter);
    setShowingResults(true);
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

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await PartyService.getPartyLeaderboard(partyId);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleAnswerSelect = async (answer: 'A' | 'B' | 'C' | 'D') => {
    console.log('PlayerPartyScreen: Answer selected:', answer);
    
    if (hasAnswered || submitting) {
      return; // Prevent double submission
    }
    
    if (!currentQuestion || !currentQuestion.party_question_id) {
      Alert.alert('Error', 'No question available');
      return;
    }
    
    if (!team) {
      Alert.alert('Error', 'Team not found');
      return;
    }

    try {
      setSubmitting(true);
      setSelectedAnswer(answer);

      // Convert the shuffled answer letter back to the original database format
      const originalAnswer = convertShuffledAnswerToOriginal(
        { 
          shuffledAnswers: currentQuestion.shuffled_answers,
          correctAnswerLetter: currentQuestion.shuffled_answers.find(a => a.isCorrect)?.letter || 'A',
          originalQuestion: currentQuestion.question
        },
        answer
      );

      const isCorrect = await PartyService.submitAnswer(
        currentQuestion.party_question_id, 
        team.id, 
        originalAnswer
      );

      setHasAnswered(true);
      
      // Refresh team score
      const updatedTeams = await PartyService.getPartyTeams(partyId);
      const updatedTeam = updatedTeams.find(t => t.id === team.id);
      if (updatedTeam) {
        setTeam(updatedTeam);
        // Broadcast the score update to other clients (including LiveLeaderboard)
        await PartyService.broadcastTeamScoreUpdate(partyId, updatedTeam);
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', error.message || 'Failed to submit answer');
      // Reset state on error
      setSelectedAnswer(null);
    } finally {
      setSubmitting(false);
    }
  };

  const tryFallbackQuestionLoad = async () => {
    try {
      console.log('PlayerPartyScreen: Trying fallback method to find current question...');
      
      // Use findNextUnansweredQuestion as fallback
      const nextUnanswered = await PartyService.findNextUnansweredQuestion(partyId);
      console.log('PlayerPartyScreen: Fallback found:', nextUnanswered);
      
      if (nextUnanswered && nextUnanswered.question) {
        const questionData = nextUnanswered.question;
        
        // Shuffle the answers for display
        const shuffledData = shuffleQuestionAnswers({
          question: questionData.questions.question,
          a: questionData.questions.a,
          b: questionData.questions.b,
          c: questionData.questions.c,
          d: questionData.questions.d,
        });
        
        // Convert to the format expected by the player screen
        const formattedQuestionData = {
          party_question_id: questionData.id,
          question: shuffledData.originalQuestion,
          shuffled_answers: shuffledData.shuffledAnswers,
          category: questionData.questions.category,
          difficulty: questionData.questions.difficulty,
          round_name: nextUnanswered.round.name,
          question_number: questionData.question_order
        };
        
        setCurrentQuestion(formattedQuestionData);
        setCurrentQuestionId(questionData.id);
        console.log('PlayerPartyScreen: Successfully loaded question via fallback method');
      } else {
        console.log('PlayerPartyScreen: No unanswered questions found, switching to waiting state');
        setGameStatus('waiting');
      }
    } catch (fallbackError) {
      console.error('PlayerPartyScreen: Fallback method also failed:', fallbackError);
      console.log('PlayerPartyScreen: All methods failed, switching to waiting state');
      setGameStatus('waiting');
    }
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            // Navigate back to home and clear the navigation stack
            navigation.navigate('PlayerHome');
          }
        }
      ]
    );
  };

  const renderRoundIntroScreen = () => (
    <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.statusTitle}>
            Round {roundIntroData?.roundNumber}
          </Text>
          <Text variant="bodyLarge" style={styles.statusSubtitle}>
            {roundIntroData?.roundName}
          </Text>
          <Text variant="bodyMedium" style={styles.statusDescription}>
            {roundIntroData?.questionCount} questions coming up!
          </Text>
          <Text variant="bodySmall" style={styles.statusHint}>
            Get ready - the host will start the questions shortly!
          </Text>
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

  const renderRoundCompleteScreen = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.statusTitle}>
            Round {roundCompleteData?.roundNumber} Complete!
          </Text>
          <Text variant="bodyLarge" style={styles.statusSubtitle}>
            {roundCompleteData?.roundName}
          </Text>
          <Text variant="bodyMedium" style={styles.statusDescription}>
            Great job! Check out the current standings below.
          </Text>
          <Text variant="bodySmall" style={styles.statusHint}>
            ⚡ The host will start the next round when ready!
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.leaderboardCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.leaderboardTitle}>
            Current Leaderboard
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

  const renderWaitingScreen = () => (
    <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
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
          
          <Button
            mode="text"
            onPress={handleLeaveGame}
            style={styles.leaveButton}
            icon="exit-to-app"
            textColor="#dc2626"
          >
            Leave Game
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
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
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

          <View style={styles.answerButtonsContainer}>
            {currentQuestion?.shuffled_answers?.map((answer) => {
              const isCorrect = showingResults && correctAnswer === answer.letter;
              const isSelected = selectedAnswer === answer.letter;
              const isWrong = showingResults && isSelected && !isCorrect;
              
              let buttonStyle = styles.answerButton;
              let textStyle = styles.answerButtonText;
              
              if (isSelected && !showingResults) {
                buttonStyle = [styles.answerButton, styles.selectedAnswerButton];
                textStyle = [styles.answerButtonText, styles.selectedAnswerButtonText];
              } else if (isCorrect) {
                buttonStyle = [styles.answerButton, styles.correctAnswerButton];
                textStyle = [styles.answerButtonText, styles.correctAnswerButtonText];
              } else if (isWrong) {
                buttonStyle = [styles.answerButton, styles.wrongAnswerButton];
                textStyle = [styles.answerButtonText, styles.wrongAnswerButtonText];
              }
              
              return (
                <Button
                  key={answer.letter}
                  mode="outlined"
                  onPress={() => handleAnswerSelect(answer.letter)}
                  disabled={hasAnswered || showingResults || submitting}
                  style={buttonStyle}
                  labelStyle={textStyle}
                  loading={submitting && selectedAnswer === answer.letter}
                >
                  {answer.letter}. {answer.text}
                </Button>
              );
            })}
          </View>

          {hasAnswered && (
            <Card style={styles.submittedCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.submittedText}>
                  {showingResults 
                    ? "✓ Results shown! Waiting for next question..." 
                    : "✓ Answer submitted! Waiting for results..."}
                </Text>
                <Text variant="bodySmall" style={styles.submittedHint}>
                  {showingResults 
                    ? "⚡ You'll be notified instantly when the next question appears!"
                    : "⚡ The host will show results shortly!"}
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
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
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
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text variant="bodyLarge">Loading game...</Text>
      </View>
    );
  }

  if (!party || !team) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text variant="bodyLarge">Game not found</Text>
      </View>
    );
  }

  // Show round intro screen if we have round intro data
  if (roundIntroData) {
    return renderRoundIntroScreen();
  }

  // Show round complete screen if we have round complete data
  if (roundCompleteData) {
    return renderRoundCompleteScreen();
  }

  switch (gameStatus) {
    case 'waiting':
      return renderWaitingScreen();
    case 'active':
      // Show loading if game is active but no question loaded yet (e.g., new team joining mid-game)
      if (!currentQuestion) {
        return (
          <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
            <Text variant="bodyLarge">Loading current question...</Text>
          </View>
        );
      }
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
  leaveButton: {
    marginTop: 8,
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
  answerButtonsContainer: {
    gap: 12,
  },
  answerButton: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    paddingVertical: 8,
  },
  answerButtonText: {
    color: '#1f2937',
    fontSize: 16,
    textAlign: 'left',
    paddingVertical: 4,
  },
  selectedAnswerButton: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  selectedAnswerButtonText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  correctAnswerButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
    borderWidth: 2,
  },
  correctAnswerButtonText: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  wrongAnswerButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  wrongAnswerButtonText: {
    color: '#dc2626',
    fontWeight: 'bold',
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
