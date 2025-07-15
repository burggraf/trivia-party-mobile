import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

interface ExternalTVDisplayProps {
  party?: {
    name: string;
  } | null;
  currentQuestion?: {
    question: string;
    shuffled_answers: Array<{
      letter: 'A' | 'B' | 'C' | 'D';
      text: string;
      isCorrect: boolean;
    }>;
    category: string;
    difficulty: string;
  };
  gameState?: {
    currentRound: number;
    currentQuestion: number;
    roundName: string;
  };
  teams?: Array<{
    id: string;
    name: string;
    color: string | null;
    score: number;
  }>;
  showingResults?: boolean;
}

export default function ExternalTVDisplay({
  party,
  currentQuestion,
  gameState,
  teams = [],
  showingResults = false
}: ExternalTVDisplayProps) {
  
  if (!currentQuestion) {
    // Waiting state for TV
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="displayLarge" style={styles.title}>
            {party?.name || 'Trivia Party'}
          </Text>
          <Text variant="headlineMedium" style={styles.subtitle}>
            Get ready to play!
          </Text>
        </View>
        
        {teams.length > 0 && (
          <View style={styles.teamsSection}>
            <Text variant="headlineMedium" style={styles.teamsTitle}>
              Teams Playing
            </Text>
            <View style={styles.teamsGrid}>
              {teams.slice(0, 8).map((team) => (
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
  }

  // Active question display for TV
  return (
    <View style={styles.container}>
      {/* Header with round info */}
      <View style={styles.questionHeader}>
        <View style={styles.roundInfo}>
          <Text variant="headlineMedium" style={styles.roundText}>
            {gameState?.roundName} - Question {gameState?.currentQuestion}
          </Text>
          <View style={styles.categoryDifficulty}>
            <Text variant="titleMedium" style={styles.category}>
              {currentQuestion.category}
            </Text>
            <Text variant="titleMedium" style={styles.difficulty}>
              {currentQuestion.difficulty}
            </Text>
          </View>
        </View>

        {/* Mini leaderboard */}
        <View style={styles.miniLeaderboard}>
          <Text variant="titleLarge" style={styles.leaderboardTitle}>
            Leaderboard
          </Text>
          {teams.slice(0, 3).map((team, index) => (
            <View key={team.id} style={styles.leaderboardItem}>
              <Text variant="bodyLarge" style={styles.rank}>
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

      {/* Main question */}
      <View style={styles.questionSection}>
        <Text variant="displayMedium" style={styles.questionText}>
          {currentQuestion.question}
        </Text>
      </View>

      {/* Answer choices in 2x2 grid */}
      <View style={styles.answersGrid}>
        {currentQuestion.shuffled_answers.map((answer) => {
          const isCorrect = showingResults && answer.isCorrect;
          
          return (
            <View
              key={answer.letter}
              style={[
                styles.answerCard,
                isCorrect && styles.correctAnswerCard
              ]}
            >
              <View style={[styles.answerLetter, isCorrect && styles.correctAnswerLetter]}>
                <Text variant="displaySmall" style={[
                  styles.answerLetterText,
                  isCorrect && styles.correctAnswerLetterText
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
        <View style={styles.resultsPrompt}>
          <Text variant="headlineMedium" style={styles.resultsText}>
            Correct Answer Revealed!
          </Text>
        </View>
      )}
    </View>
  );
}

// Get landscape dimensions for TV display
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isLandscape = screenWidth > screenHeight;
const tvWidth = isLandscape ? screenWidth : screenHeight;
const tvHeight = isLandscape ? screenHeight : screenWidth;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 40,
    width: tvWidth,
    height: tvHeight,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    color: '#f1f5f9',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#60a5fa',
    textAlign: 'center',
  },
  teamsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  teamsTitle: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 40,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
  },
  teamCard: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 180,
    borderWidth: 2,
    borderColor: '#334155',
  },
  teamColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
  },
  teamName: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
  },
  teamScore: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  roundInfo: {
    flex: 1,
  },
  roundText: {
    color: '#60a5fa',
    marginBottom: 16,
  },
  categoryDifficulty: {
    flexDirection: 'row',
    gap: 20,
  },
  category: {
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  difficulty: {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  miniLeaderboard: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
    minWidth: 300,
    borderWidth: 2,
    borderColor: '#334155',
  },
  leaderboardTitle: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rank: {
    color: '#94a3b8',
    width: 40,
  },
  miniTeamColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 12,
  },
  miniTeamName: {
    color: '#f1f5f9',
    flex: 1,
  },
  miniTeamScore: {
    color: '#10b981',
    fontWeight: 'bold',
    width: 50,
    textAlign: 'right',
  },
  questionSection: {
    backgroundColor: '#1e293b',
    padding: 40,
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
  },
  questionText: {
    color: '#f1f5f9',
    textAlign: 'center',
    lineHeight: 60,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  answerCard: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    width: '48%',
    borderWidth: 2,
    borderColor: '#334155',
    minHeight: 120,
  },
  correctAnswerCard: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
    borderWidth: 3,
  },
  answerLetter: {
    backgroundColor: '#374151',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  correctAnswerLetter: {
    backgroundColor: '#10b981',
  },
  answerLetterText: {
    color: '#f1f5f9',
    fontWeight: 'bold',
  },
  correctAnswerLetterText: {
    color: '#ffffff',
  },
  answerText: {
    color: '#f1f5f9',
    flex: 1,
    lineHeight: 32,
    fontSize: 18,
  },
  correctAnswerText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  correctIndicator: {
    backgroundColor: '#10b981',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  correctIndicatorText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resultsPrompt: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  resultsText: {
    color: '#10b981',
    fontWeight: 'bold',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
  },
});