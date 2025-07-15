import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';
import SimpleAirPlayButton from '../../components/host/SimpleAirPlayButton';

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

interface TVDisplayScreenWithCastProps {
  navigation: any;
  route: any;
}

export default function TVDisplayScreenWithCast({ navigation, route }: TVDisplayScreenWithCastProps) {
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<Party | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [showingResults, setShowingResults] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
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

  useEffect(() => {
    loadPartyData();
    const cleanup = setupBroadcastSubscription();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [partyId]);

  const loadPartyData = async () => {
    try {
      const [currentParty, teamsData] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyTeams(partyId),
      ]);

      setParty(currentParty);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading party data:', error);
    }
  };

  const setupBroadcastSubscription = () => {
    console.log('TV Display: Setting up broadcast subscription for party:', partyId);
    const partySubscription = supabase
      .channel(`party-${partyId}`)
      .on('broadcast', { event: 'question_data' }, (payload) => {
        console.log('TV: Question data received:', payload);
        handleQuestionData(payload.payload);
      })
      .on('broadcast', { event: 'question_results' }, (payload) => {
        console.log('TV: Question results received:', payload);
        handleQuestionResults(payload.payload);
      })
      .on('broadcast', { event: 'game_ended' }, (payload) => {
        console.log('TV: Game ended received:', payload);
        handleGameEnded();
      })
      .on('broadcast', { event: 'team_score_updated' }, (payload) => {
        console.log('TV: Team score updated:', payload);
        handleTeamScoreUpdate(payload.payload);
      })
      .subscribe((status) => {
        console.log('TV Display subscription status:', status);
      });

    return () => {
      console.log('TV Display: Cleaning up broadcast subscription for party:', partyId);
      supabase.removeChannel(partySubscription);
    };
  };

  const handleQuestionData = (questionData: any) => {
    setCurrentQuestion(questionData);
    setShowingResults(false);
    setCorrectAnswer(null);
    
    setGameState({
      currentRound: 1,
      currentQuestion: questionData.question_number || 1,
      totalQuestions: 10,
      roundName: questionData.round_name || '',
    });
  };

  const handleQuestionResults = (resultsData: any) => {
    setShowingResults(true);
    setCorrectAnswer(resultsData.correct_answer_letter);
  };

  const handleGameEnded = () => {
    setCurrentQuestion(null);
    setShowingResults(false);
    loadPartyData();
  };

  const handleTeamScoreUpdate = (teamData: any) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamData.id ? { ...team, score: teamData.score } : team
      )
    );
  };

  const handleExitTVDisplay = () => {
    console.log('TV Display: User tapping to exit, cleaning up subscriptions');
    navigation.goBack();
  };

  const renderContent = () => {
    if (!party) {
      return (
        <View style={styles.centerContainer}>
          <Text variant="displayMedium" style={styles.errorText}>
            Party not found
          </Text>
        </View>
      );
    }

    if (party.status === 'completed') {
      return (
        <View style={styles.leaderboardContainer}>
          <Text variant="displayMedium" style={styles.leaderboardTitle}>
            Final Results
          </Text>
          
          <View style={styles.leaderboardList}>
            {teams.map((team, index) => (
              <View key={team.id} style={[
                styles.leaderboardItem,
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace
              ]}>
                <View style={styles.rankContainer}>
                  <Text variant="displaySmall" style={[
                    styles.rank,
                    index < 3 && styles.topRank
                  ]}>
                    #{index + 1}
                  </Text>
                  {index === 0 && <Text style={styles.trophy}>🏆</Text>}
                  {index === 1 && <Text style={styles.trophy}>🥈</Text>}
                  {index === 2 && <Text style={styles.trophy}>🥉</Text>}
                </View>
                
                <View style={styles.teamInfo}>
                  <View style={[styles.teamColorLarge, { backgroundColor: team.color || '#6366f1' }]} />
                  <Text variant="displaySmall" style={styles.teamNameLarge}>
                    {team.name}
                  </Text>
                </View>
                
                <Text variant="displaySmall" style={[
                  styles.teamScoreLarge,
                  index < 3 && styles.topScore
                ]}>
                  {team.score}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (currentQuestion) {
      return (
        <View style={styles.questionContainer}>
          {/* Header */}
          <View style={styles.questionHeader}>
            <View style={styles.gameInfo}>
              <Text variant="headlineMedium" style={styles.roundInfo}>
                {gameState.roundName} - Question {gameState.currentQuestion}
              </Text>
              <View style={styles.categoryDifficulty}>
                <Text variant="titleMedium" style={styles.category}>
                  {currentQuestion?.category}
                </Text>
                <Text variant="titleMedium" style={styles.difficulty}>
                  {currentQuestion?.difficulty}
                </Text>
              </View>
            </View>
            
            <View style={styles.scoreboardMini}>
              <Text variant="titleMedium" style={styles.scoreboardTitle}>
                Leaderboard
              </Text>
              {teams.slice(0, 3).map((team, index) => (
                <View key={team.id} style={styles.miniTeamRow}>
                  <Text variant="bodyLarge" style={styles.miniRank}>
                    #{index + 1}
                  </Text>
                  <View style={[styles.miniTeamColor, { backgroundColor: team.color || '#6366f1' }]} />
                  <Text variant="bodyLarge" style={styles.miniTeamName}>
                    {team.name}
                  </Text>
                  <Text variant="bodyLarge" style={styles.miniTeamScore}>
                    {team.score}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionContent}>
            <Text variant="displaySmall" style={styles.questionText}>
              {currentQuestion?.question}
            </Text>
          </View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQuestion?.shuffled_answers?.map((answer) => {
              const isCorrect = showingResults && answer.isCorrect;
              
              return (
                <View
                  key={answer.letter}
                  style={[
                    styles.answerOption,
                    isCorrect && styles.correctAnswerOption
                  ]}
                >
                  <View style={styles.answerLetter}>
                    <Text variant="headlineMedium" style={[
                      styles.answerLetterText,
                      isCorrect && styles.correctAnswerText
                    ]}>
                      {answer.letter}
                    </Text>
                  </View>
                  <Text variant="headlineSmall" style={[
                    styles.answerText,
                    isCorrect && styles.correctAnswerText
                  ]}>
                    {answer.text}
                  </Text>
                  {isCorrect && (
                    <View style={styles.correctIndicator}>
                      <Text variant="headlineMedium" style={styles.correctIndicatorText}>
                        ✓
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {showingResults && (
            <View style={styles.resultsOverlay}>
              <Text variant="displayMedium" style={styles.resultsText}>
                Correct Answer: {correctAnswer}
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Waiting state
    return (
      <View style={styles.centerContainer}>
        <View style={styles.logoContainer}>
          <Text variant="displayLarge" style={styles.logo}>
            🎯 Trivia Party
          </Text>
          <Text variant="headlineMedium" style={styles.partyName}>
            {party?.name}
          </Text>
          <Text variant="titleLarge" style={styles.waitingText}>
            Waiting for game to start...
          </Text>
        </View>
        
        {teams.length > 0 && (
          <View style={styles.teamsContainer}>
            <Text variant="headlineMedium" style={styles.teamsTitle}>
              Teams Ready
            </Text>
            <View style={styles.teamsGrid}>
              {teams.map((team) => (
                <View key={team.id} style={styles.teamCard}>
                  <View style={[styles.teamColor, { backgroundColor: team.color || '#6366f1' }]} />
                  <Text variant="titleLarge" style={styles.teamName}>
                    {team.name}
                  </Text>
                  <Text variant="titleMedium" style={styles.teamScore}>
                    {team.score} pts
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cast Button */}
      <View style={styles.castHeader}>
        <SimpleAirPlayButton 
          style={styles.castButton}
        />
      </View>

      {/* Main Content */}
      <TouchableOpacity 
        style={styles.contentWrapper}
        onPress={handleExitTVDisplay}
        activeOpacity={1}
      >
        {renderContent()}
        
        {/* Status Hint */}
        <View style={styles.hintContainer}>
          <Text variant="bodyMedium" style={styles.tapHint}>
            Tap anywhere to return to host controls
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  castHeader: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  castButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contentWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    color: '#f1f5f9',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  partyName: {
    color: '#60a5fa',
    marginBottom: 30,
    textAlign: 'center',
  },
  waitingText: {
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  teamsContainer: {
    width: '100%',
    maxWidth: 800,
  },
  teamsTitle: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 30,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  teamCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150,
    borderWidth: 2,
    borderColor: '#334155',
  },
  teamColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
  },
  teamName: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 5,
  },
  teamScore: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  questionContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 40,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  gameInfo: {
    flex: 1,
  },
  roundInfo: {
    color: '#60a5fa',
    marginBottom: 10,
  },
  categoryDifficulty: {
    flexDirection: 'row',
    gap: 20,
  },
  category: {
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  difficulty: {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreboardMini: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    minWidth: 250,
    borderWidth: 2,
    borderColor: '#334155',
  },
  scoreboardTitle: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 15,
  },
  miniTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniRank: {
    color: '#94a3b8',
    width: 30,
  },
  miniTeamColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  miniTeamName: {
    color: '#f1f5f9',
    flex: 1,
  },
  miniTeamScore: {
    color: '#10b981',
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  questionContent: {
    backgroundColor: '#1e293b',
    padding: 40,
    borderRadius: 16,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#334155',
  },
  questionText: {
    color: '#f1f5f9',
    textAlign: 'center',
    lineHeight: 50,
  },
  answersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  answerOption: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    minWidth: isLandscape ? '45%' : '100%',
    borderWidth: 2,
    borderColor: '#334155',
  },
  correctAnswerOption: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
    borderWidth: 3,
  },
  answerLetter: {
    backgroundColor: '#374151',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  answerLetterText: {
    color: '#f1f5f9',
    fontWeight: 'bold',
  },
  answerText: {
    color: '#f1f5f9',
    flex: 1,
    lineHeight: 32,
  },
  correctAnswerText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  correctIndicator: {
    backgroundColor: '#10b981',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  correctIndicatorText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resultsOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    marginTop: -50,
  },
  resultsText: {
    color: '#10b981',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  leaderboardContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 40,
    justifyContent: 'center',
  },
  leaderboardTitle: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 60,
  },
  leaderboardList: {
    gap: 20,
  },
  leaderboardItem: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  firstPlace: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  secondPlace: {
    backgroundColor: '#6b7280',
    borderColor: '#9ca3af',
  },
  thirdPlace: {
    backgroundColor: '#cd7c2f',
    borderColor: '#d97706',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  rank: {
    color: '#94a3b8',
    fontWeight: 'bold',
    width: 60,
  },
  topRank: {
    color: '#0f172a',
  },
  trophy: {
    fontSize: 40,
    marginLeft: 10,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamColorLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 20,
  },
  teamNameLarge: {
    color: '#f1f5f9',
    flex: 1,
  },
  teamScoreLarge: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 40,
    minWidth: 100,
    textAlign: 'right',
  },
  topScore: {
    color: '#0f172a',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHint: {
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});