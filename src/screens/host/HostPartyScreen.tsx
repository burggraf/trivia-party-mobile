import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HostStackParamList } from '../../navigation/HostNavigator';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import { shuffleQuestionAnswers, ShuffledQuestion } from '../../utils/questionUtils';
import LiveLeaderboard from '../../components/host/LiveLeaderboard';

type Party = Database['public']['Tables']['parties']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

enum GamePhase {
  ROUND_INTRO = 'ROUND_INTRO',
  QUESTION_DISPLAY = 'QUESTION_DISPLAY', 
  QUESTION_RESULTS = 'QUESTION_RESULTS',
  ROUND_COMPLETE = 'ROUND_COMPLETE',
  GAME_COMPLETE = 'GAME_COMPLETE',
  GAME_THANKS = 'GAME_THANKS'
}

interface GameState {
  currentRound: number;
  currentQuestion: number;
  totalQuestions: number;
  gamePhase: GamePhase;
  currentRoundData: {
    name: string;
    id: string;
    questionCount: number;
  } | null;
}


export default function HostPartyScreen({ navigation, route, onGameProgression }: { navigation: any; route: any; onGameProgression?: (handler: (() => void) | null) => void }) {
  const insets = useSafeAreaInsets();
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<Party | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    currentQuestion: 1,
    totalQuestions: 0,
    gamePhase: GamePhase.ROUND_INTRO,
    currentRoundData: null,
  });
  const gameStateRef = useRef<GameState>(gameState);
  
  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [shuffledQuestion, setShuffledQuestion] = useState<ShuffledQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadGameData();
  }, [partyId]);

  const handleGameProgression = async () => {
    const currentGameState = gameStateRef.current;
    console.log('🚨 BUTTON PRESSED: handleGameProgression called with gameState:', currentGameState);
    console.log('🚨 BUTTON PRESSED: Current phase:', currentGameState.gamePhase);
    console.log('🚨 BUTTON PRESSED: This should only happen when user presses the arrow button');
    console.log('🚨 BUTTON PRESSED: isInitialLoad:', isInitialLoadRef.current);
    
    // Don't progress if this is during initial load
    if (isInitialLoadRef.current) {
      console.log('🚨 BUTTON PRESSED: Ignoring progression during initial load');
      return;
    }
    
    // Don't progress if we don't have proper game state set up
    if (rounds.length === 0 || !currentGameState.currentRoundData) {
      console.log('HostPartyScreen: Game not properly initialized, ignoring progression');
      return;
    }
    
    switch (currentGameState.gamePhase) {
      case GamePhase.ROUND_INTRO:
        console.log('🚨 BUTTON PRESSED: ✅ CASE ROUND_INTRO - Moving to QUESTION_DISPLAY');
        await handleRoundIntroToQuestion();
        break;
        
      case GamePhase.QUESTION_DISPLAY:
        console.log('🚨 BUTTON PRESSED: ✅ CASE QUESTION_DISPLAY - Moving to QUESTION_RESULTS');
        await handleQuestionToResults();
        break;
        
      case GamePhase.QUESTION_RESULTS:
        console.log('🚨 BUTTON PRESSED: ✅ CASE QUESTION_RESULTS - Moving to next phase');
        await handleResultsToNext();
        break;
        
      case GamePhase.ROUND_COMPLETE:
        console.log('🚨 BUTTON PRESSED: ✅ CASE ROUND_COMPLETE - Moving to next round or game complete');
        await handleRoundCompleteToNext();
        break;
        
      case GamePhase.GAME_COMPLETE:
        console.log('🚨 BUTTON PRESSED: ✅ CASE GAME_COMPLETE - Moving to GAME_THANKS');
        setGameState(prev => ({ ...prev, gamePhase: GamePhase.GAME_THANKS }));
        break;
        
      case GamePhase.GAME_THANKS:
        console.log('🚨 BUTTON PRESSED: ✅ CASE GAME_THANKS - Navigating back to party list');
        navigation.goBack();
        break;
        
      default:
        console.log('🚨 BUTTON PRESSED: ❌ UNKNOWN CASE - Unknown game phase:', gameState.gamePhase);
        break;
    }
  };

  // Phase transition functions
  const handleRoundIntroToQuestion = async () => {
    console.log('🚨 ROUND INTRO TO QUESTION: Called!');
    console.log('🚨 ROUND INTRO TO QUESTION: Current phase before change:', gameState.gamePhase);
    
    // Load and display the first question of the current round
    const currentRoundData = gameState.currentRoundData;
    if (!currentRoundData) {
      console.log('🚨 ROUND INTRO TO QUESTION: No current round data!');
      return;
    }
    
    const questionData = await loadCurrentQuestion(currentRoundData.id, gameState.currentQuestion);
    if (questionData) {
      console.log('🚨 ROUND INTRO TO QUESTION: Got question data, broadcasting and setting phase');
      await broadcastQuestionAndSetDisplay(questionData, currentRoundData.name);
      
      setGameState(prev => {
        console.log('🚨 ROUND INTRO TO QUESTION: Previous gameState:', prev);
        const newState = { ...prev, gamePhase: GamePhase.QUESTION_DISPLAY };
        console.log('🚨 ROUND INTRO TO QUESTION: New gameState:', newState);
        return newState;
      });
      
      console.log('🚨 ROUND INTRO TO QUESTION: State update called');
    } else {
      console.log('🚨 ROUND INTRO TO QUESTION: No question data found!');
    }
  };

  const handleQuestionToResults = async () => {
    console.log('🚨 QUESTION TO RESULTS: Called! Setting phase to QUESTION_RESULTS');
    console.log('🚨 QUESTION TO RESULTS: Current phase before change:', gameState.gamePhase);
    
    // Show results for current question
    setGameState(prev => {
      console.log('🚨 QUESTION TO RESULTS: Previous gameState:', prev);
      const newState = { ...prev, gamePhase: GamePhase.QUESTION_RESULTS };
      console.log('🚨 QUESTION TO RESULTS: New gameState:', newState);
      return newState;
    });
    
    console.log('🚨 QUESTION TO RESULTS: State updated, now broadcasting results');
    
    // Broadcast results to players
    if (currentQuestion && shuffledQuestion) {
      await PartyService.broadcastQuestionResults(partyId, currentQuestion, shuffledQuestion);
      console.log('🚨 QUESTION TO RESULTS: Results broadcasted successfully');
    } else {
      console.log('🚨 QUESTION TO RESULTS: No current question or shuffled question to broadcast');
    }
  };

  const handleResultsToNext = async () => {
    const currentGameState = gameStateRef.current;
    console.log('🚨 RESULTS TO NEXT: Current gameState:', currentGameState);
    console.log('🚨 RESULTS TO NEXT: Current question:', currentGameState.currentQuestion, 'Total questions:', currentGameState.totalQuestions);
    
    const isLastQuestion = currentGameState.currentQuestion >= currentGameState.totalQuestions;
    const isLastRound = currentGameState.currentRound >= rounds.length;
    
    console.log('🚨 RESULTS TO NEXT: isLastQuestion:', isLastQuestion, 'isLastRound:', isLastRound);
    
    if (isLastQuestion && isLastRound) {
      // Game complete
      console.log('🚨 RESULTS TO NEXT: Game complete!');
      
      // Broadcast game complete to players
      try {
        await PartyService.broadcastGameComplete(partyId);
      } catch (error) {
        console.error('Error broadcasting game complete:', error);
      }
      
      setGameState(prev => ({ ...prev, gamePhase: GamePhase.GAME_COMPLETE }));
    } else if (isLastQuestion) {
      // Round complete
      console.log('🚨 RESULTS TO NEXT: Round complete!');
      
      // Broadcast round complete to players
      try {
        await PartyService.broadcastRoundComplete(partyId, {
          roundNumber: currentGameState.currentRound,
          roundName: currentGameState.currentRoundData!.name
        });
      } catch (error) {
        console.error('Error broadcasting round complete:', error);
      }
      
      setGameState(prev => ({ ...prev, gamePhase: GamePhase.ROUND_COMPLETE }));
    } else {
      // Next question
      const nextQuestionNumber = currentGameState.currentQuestion + 1;
      console.log('🚨 RESULTS TO NEXT: Loading next question:', nextQuestionNumber);
      
      const questionData = await loadCurrentQuestion(currentGameState.currentRoundData!.id, nextQuestionNumber);
      
      if (questionData) {
        console.log('🚨 RESULTS TO NEXT: Got question data for question:', nextQuestionNumber);
        await broadcastQuestionAndSetDisplay(questionData, currentGameState.currentRoundData!.name);
        
        console.log('🚨 RESULTS TO NEXT: Updating game state to question:', nextQuestionNumber);
        setGameState(prev => ({ 
          ...prev, 
          currentQuestion: nextQuestionNumber,
          gamePhase: GamePhase.QUESTION_DISPLAY 
        }));
      } else {
        console.error('🚨 RESULTS TO NEXT: No question data found for question:', nextQuestionNumber);
      }
    }
  };

  const handleRoundCompleteToNext = async () => {
    const currentGameState = gameStateRef.current;
    const nextRoundNumber = currentGameState.currentRound + 1;
    const nextRound = rounds[nextRoundNumber - 1];
    
    if (nextRound) {
      // Broadcast next round intro to players
      try {
        await PartyService.broadcastRoundIntro(partyId, {
          roundNumber: nextRoundNumber,
          roundName: nextRound.name,
          questionCount: nextRound.question_count
        });
      } catch (error) {
        console.error('Error broadcasting round intro:', error);
      }
      
      // Start next round
      setGameState({
        currentRound: nextRoundNumber,
        currentQuestion: 1,
        totalQuestions: nextRound.question_count,
        gamePhase: GamePhase.ROUND_INTRO,
        currentRoundData: {
          name: nextRound.name,
          id: nextRound.id,
          questionCount: nextRound.question_count,
        },
      });
    } else {
      // No more rounds, game complete
      try {
        await PartyService.broadcastGameComplete(partyId);
      } catch (error) {
        console.error('Error broadcasting game complete:', error);
      }
      
      setGameState(prev => ({ ...prev, gamePhase: GamePhase.GAME_COMPLETE }));
    }
  };

  // Set up navigation header right button for game progression
  useEffect(() => {
    const shouldShowButton = party && (party.status === 'active') && gameState.currentRoundData;
    
    console.log('HostPartyScreen: Setting up right button. shouldShow:', shouldShowButton);
    console.log('HostPartyScreen: onGameProgression prop exists:', !!onGameProgression);
    console.log('HostPartyScreen: party status:', party?.status);
    console.log('HostPartyScreen: current phase:', gameState.gamePhase);
    
    if (shouldShowButton && onGameProgression) {
      console.log('HostPartyScreen: Calling onGameProgression with handler');
      onGameProgression(handleGameProgression);
    } else if (onGameProgression) {
      console.log('HostPartyScreen: Clearing right button');
      onGameProgression(null);
    } else {
      console.log('HostPartyScreen: onGameProgression prop not available');
    }
  }, [party?.status, gameState.currentRoundData, onGameProgression]);

  // Clean up button on unmount
  useEffect(() => {
    return () => {
      if (onGameProgression) {
        console.log('HostPartyScreen: Cleanup - clearing right button on unmount');
        onGameProgression(null);
      }
    };
  }, []);

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

      // Initialize game state if party is active
      console.log('HostPartyScreen: Checking party status:', currentParty?.status, 'rounds:', roundsData.length);
      if (currentParty?.status === 'active' && roundsData.length > 0) {
        try {
          console.log('HostPartyScreen: Party is active, initializing game state');
          
          // Always start fresh game with round intro
          const firstRound = roundsData[0];
          console.log('HostPartyScreen: Starting fresh game with round intro');
          
          setGameState({
            currentRound: 1,
            currentQuestion: 1,
            totalQuestions: firstRound.question_count,
            gamePhase: GamePhase.ROUND_INTRO,
            currentRoundData: {
              name: firstRound.name,
              id: firstRound.id,
              questionCount: firstRound.question_count,
            },
          });
          
          // Update game state in database
          await PartyService.updateGameState(partyId, firstRound.id, 1);
          
          // Broadcast initial round intro to players
          try {
            await PartyService.broadcastRoundIntro(partyId, {
              roundNumber: 1,
              roundName: firstRound.name,
              questionCount: firstRound.question_count
            });
          } catch (error) {
            console.error('Error broadcasting initial round intro:', error);
          }
          
          console.log('HostPartyScreen: Game initialized with round intro phase');
          
          // Enable button progression after game state is set
          console.log('HostPartyScreen: Setting isInitialLoad to false');
          isInitialLoadRef.current = false;
        } catch (error) {
          console.error('HostPartyScreen: Error initializing game:', error);
        }
      } else {
        console.log('HostPartyScreen: Party not active or no rounds, setting isInitialLoad to false anyway');
        isInitialLoadRef.current = false;
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
    
    // Always create a shuffled question for the host display
    const shuffled = shuffleQuestionAnswers({
      question: questionData.questions.question,
      a: questionData.questions.a,
      b: questionData.questions.b,
      c: questionData.questions.c,
      d: questionData.questions.d,
    });
    
    console.log('HostPartyScreen: Created shuffled question for host:', shuffled.originalQuestion);
    setShuffledQuestion(shuffled);
    
    // Try to broadcast to players (but don't fail if broadcast fails)
    try {
      const broadcastResult = await PartyService.broadcastQuestionToPlayers(partyId, {
        ...questionData,
        round_name: roundName
      }, shuffled);
      
      if (broadcastResult) {
        console.log('HostPartyScreen: Successfully broadcasted to players');
      } else {
        console.log('HostPartyScreen: Broadcast failed, but host can continue');
      }
    } catch (error) {
      console.error('HostPartyScreen: Broadcast error (continuing anyway):', error);
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


  const getCurrentRound = () => rounds[gameState.currentRound - 1];

  // State-based render functions
  const renderRoundIntro = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.compactHeader}>
        <Text variant="headlineSmall" style={styles.partyTitle}>
          {party?.name}
        </Text>
        <View style={styles.compactStatusRow}>
          <Text variant="bodyMedium" style={styles.gameCodeText}>
            Code: <Text style={styles.gameCodeValue}>{party?.join_code}</Text>
          </Text>
        </View>
      </View>

      <Card style={styles.roundIntroCard}>
        <Card.Content style={styles.roundIntroContent}>
          <Text variant="displayMedium" style={styles.roundIntroTitle}>
            Round {gameState.currentRound}
          </Text>
          <Text variant="headlineMedium" style={styles.roundIntroName}>
            {gameState.currentRoundData?.name}
          </Text>
          <Text variant="bodyLarge" style={styles.roundIntroQuestions}>
            {gameState.currentRoundData?.questionCount} Questions
          </Text>
          <Text variant="bodyMedium" style={styles.roundIntroInstructions}>
            Tap the arrow to start this round
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderQuestionDisplay = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.compactHeader}>
        <Text variant="headlineSmall" style={styles.partyTitle}>
          {party?.name}
        </Text>
        <View style={styles.compactStatusRow}>
          <Text variant="bodyMedium" style={styles.gameCodeText}>
            Code: <Text style={styles.gameCodeValue}>{party?.join_code}</Text>
          </Text>
          <Text variant="bodyMedium" style={styles.statusText}>
            Round {gameState.currentRound}/{rounds.length} • Question {gameState.currentQuestion}/{gameState.totalQuestions}
          </Text>
          <Text variant="bodySmall" style={styles.compactRoundName}>
            {gameState.currentRoundData?.name}
          </Text>
        </View>
      </View>

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
              <View key={answer.letter} style={styles.answerOption}>
                <Text variant="bodyMedium" style={styles.optionLabel}>
                  {answer.letter}.
                </Text>
                <Text variant="bodyMedium" style={styles.answerText}>
                  {answer.text}
                </Text>
              </View>
            ))}

            <View style={styles.hiddenAnswerNotice}>
              <Text variant="bodyMedium" style={styles.hiddenAnswerText}>
                Players are answering... Tap arrow to show results
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  const renderQuestionResults = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.compactHeader}>
        <Text variant="headlineSmall" style={styles.partyTitle}>
          {party?.name}
        </Text>
        <View style={styles.compactStatusRow}>
          <Text variant="bodyMedium" style={styles.gameCodeText}>
            Code: <Text style={styles.gameCodeValue}>{party?.join_code}</Text>
          </Text>
          <Text variant="bodyMedium" style={styles.statusText}>
            Round {gameState.currentRound}/{rounds.length} • Question {gameState.currentQuestion}/{gameState.totalQuestions}
          </Text>
          <Text variant="bodySmall" style={styles.compactRoundName}>
            {gameState.currentRoundData?.name}
          </Text>
        </View>
      </View>

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
              Correct Answer:
            </Text>
            
            {shuffledQuestion.shuffledAnswers.map((answer) => (
              <View key={answer.letter} style={[
                styles.answerOption,
                answer.isCorrect && styles.correctAnswerOption
              ]}>
                <Text variant="bodyMedium" style={styles.optionLabel}>
                  {answer.letter}.
                </Text>
                <Text variant="bodyMedium" style={[
                  styles.answerText,
                  answer.isCorrect && styles.correctAnswerText
                ]}>
                  {answer.text}
                </Text>
                {answer.isCorrect && (
                  <Text variant="bodyMedium" style={styles.correctIndicator}>
                    ✓ CORRECT
                  </Text>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <LiveLeaderboard partyId={partyId} maxTeams={5} compact={false} />
    </ScrollView>
  );

  const renderRoundComplete = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.compactHeader}>
        <Text variant="headlineSmall" style={styles.partyTitle}>
          {party?.name}
        </Text>
      </View>

      <Card style={styles.roundCompleteCard}>
        <Card.Content style={styles.roundCompleteContent}>
          <Text variant="displaySmall" style={styles.roundCompleteTitle}>
            Round {gameState.currentRound} Complete!
          </Text>
          <Text variant="headlineSmall" style={styles.roundCompleteName}>
            {gameState.currentRoundData?.name}
          </Text>
        </Card.Content>
      </Card>

      <LiveLeaderboard partyId={partyId} maxTeams={10} compact={false} />
    </ScrollView>
  );

  const renderGameComplete = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.compactHeader}>
        <Text variant="headlineSmall" style={styles.partyTitle}>
          {party?.name}
        </Text>
      </View>

      <Card style={styles.gameCompleteCard}>
        <Card.Content style={styles.gameCompleteContent}>
          <Text variant="displaySmall" style={styles.gameCompleteTitle}>
            🎉 Game Complete! 🎉
          </Text>
          <Text variant="headlineSmall" style={styles.gameCompleteSubtitle}>
            Final Results
          </Text>
        </Card.Content>
      </Card>

      <LiveLeaderboard partyId={partyId} maxTeams={10} compact={false} />
    </ScrollView>
  );

  const renderGameThanks = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <Card style={styles.thanksCard}>
        <Card.Content style={styles.thanksContent}>
          <Text variant="displayMedium" style={styles.thanksTitle}>
            Thanks for Playing! 🎊
          </Text>
          <Text variant="bodyLarge" style={styles.thanksMessage}>
            Hope you had a great time at {party?.name}!
          </Text>
          <Text variant="bodyMedium" style={styles.thanksInstructions}>
            Tap the arrow to return to your parties
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );

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

  // Render based on current game phase
  switch (gameState.gamePhase) {
    case GamePhase.ROUND_INTRO:
      return renderRoundIntro();
    case GamePhase.QUESTION_DISPLAY:
      return renderQuestionDisplay();
    case GamePhase.QUESTION_RESULTS:
      return renderQuestionResults();
    case GamePhase.ROUND_COMPLETE:
      return renderRoundComplete();
    case GamePhase.GAME_COMPLETE:
      return renderGameComplete();
    case GamePhase.GAME_THANKS:
      return renderGameThanks();
    default:
      return renderRoundIntro();
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
    alignItems: 'center',
    padding: 16,
  },
  compactHeader: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  partyTitle: {
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  compactStatusRow: {
    alignItems: 'center',
    gap: 4,
  },
  gameCodeText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  gameCodeValue: {
    color: '#1e40af',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  statusText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  compactRoundName: {
    color: '#6366f1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  analyticsCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#f0f9ff',
  },
  analyticsDescription: {
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
  // Round intro styles
  roundIntroCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#f0f9ff',
  },
  roundIntroContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  roundIntroTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roundIntroName: {
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  roundIntroQuestions: {
    color: '#6b7280',
    marginBottom: 16,
  },
  roundIntroInstructions: {
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Round complete styles
  roundCompleteCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#ecfdf5',
  },
  roundCompleteContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  roundCompleteTitle: {
    color: '#059669',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  roundCompleteName: {
    color: '#1f2937',
    textAlign: 'center',
  },
  // Game complete styles
  gameCompleteCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fef3c7',
  },
  gameCompleteContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  gameCompleteTitle: {
    color: '#d97706',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameCompleteSubtitle: {
    color: '#1f2937',
    textAlign: 'center',
  },
  // Thanks styles
  thanksCard: {
    elevation: 2,
    backgroundColor: '#fdf2f8',
  },
  thanksContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  thanksTitle: {
    color: '#be185d',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  thanksMessage: {
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  thanksInstructions: {
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
