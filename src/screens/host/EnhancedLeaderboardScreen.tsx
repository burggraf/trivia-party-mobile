import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, DataTable } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';

type Party = Database['public']['Tables']['parties']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];

interface EnhancedTeamData {
  team_id: string;
  team_name: string;
  team_color: string;
  total_score: number;
  round_scores: any;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  rank: number;
}

interface RoundTeamData {
  team_id: string;
  team_name: string;
  team_color: string;
  round_score: number;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  rank: number;
}

export default function EnhancedLeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<Party | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [enhancedLeaderboard, setEnhancedLeaderboard] = useState<EnhancedTeamData[]>([]);
  const [roundLeaderboard, setRoundLeaderboard] = useState<RoundTeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overall' | 'round'>('overall');
  const [selectedRound, setSelectedRound] = useState(1);

  useEffect(() => {
    loadLeaderboardData();
  }, [partyId]);

  useEffect(() => {
    if (viewMode === 'round') {
      loadRoundLeaderboard();
    }
  }, [viewMode, selectedRound]);

  const loadLeaderboardData = async () => {
    try {
      const [currentParty, roundsData, enhancedData] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyRounds(partyId),
        PartyService.getEnhancedPartyLeaderboard(partyId),
      ]);

      setParty(currentParty);
      setRounds(roundsData);
      setEnhancedLeaderboard(enhancedData);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundLeaderboard = async () => {
    try {
      const roundData = await PartyService.getRoundLeaderboard(partyId, selectedRound);
      setRoundLeaderboard(roundData);
    } catch (error) {
      console.error('Error loading round leaderboard:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return styles.firstPlace;
      case 2: return styles.secondPlace;
      case 3: return styles.thirdPlace;
      default: return styles.defaultPlace;
    }
  };

  const renderOverallLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      <Text variant="headlineMedium" style={styles.sectionTitle}>
        Overall Leaderboard
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title style={styles.rankColumn}>Rank</DataTable.Title>
            <DataTable.Title style={styles.teamColumn}>Team</DataTable.Title>
            <DataTable.Title style={styles.scoreColumn} numeric>Score</DataTable.Title>
            <DataTable.Title style={styles.accuracyColumn} numeric>Accuracy</DataTable.Title>
            <DataTable.Title style={styles.questionsColumn} numeric>Questions</DataTable.Title>
            {rounds.map((round) => (
              <DataTable.Title key={round.id} style={styles.roundColumn} numeric>
                {round.name}
              </DataTable.Title>
            ))}
          </DataTable.Header>

          {enhancedLeaderboard.map((team) => (
            <DataTable.Row key={team.team_id} style={getRankStyle(team.rank)}>
              <DataTable.Cell style={styles.rankColumn}>
                <Text variant="titleMedium" style={styles.rankText}>
                  {getRankIcon(team.rank)}
                </Text>
              </DataTable.Cell>
              
              <DataTable.Cell style={styles.teamColumn}>
                <View style={styles.teamInfo}>
                  <View style={[styles.teamColor, { backgroundColor: team.team_color || '#6366f1' }]} />
                  <Text variant="bodyLarge" style={styles.teamName}>
                    {team.team_name}
                  </Text>
                </View>
              </DataTable.Cell>
              
              <DataTable.Cell style={styles.scoreColumn} numeric>
                <Text variant="titleMedium" style={styles.scoreText}>
                  {team.total_score}
                </Text>
              </DataTable.Cell>
              
              <DataTable.Cell style={styles.accuracyColumn} numeric>
                <Text variant="bodyMedium">
                  {team.accuracy.toFixed(1)}%
                </Text>
              </DataTable.Cell>
              
              <DataTable.Cell style={styles.questionsColumn} numeric>
                <Text variant="bodyMedium">
                  {team.correct_answers}/{team.total_questions}
                </Text>
              </DataTable.Cell>

              {rounds.map((round) => {
                const roundData = team.round_scores?.[round.round_number.toString()];
                return (
                  <DataTable.Cell key={round.id} style={styles.roundColumn} numeric>
                    <Text variant="bodyMedium">
                      {roundData?.score || 0}
                    </Text>
                  </DataTable.Cell>
                );
              })}
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>
    </View>
  );

  const renderRoundLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      <View style={styles.roundSelector}>
        <Text variant="headlineMedium" style={styles.sectionTitle}>
          Round {selectedRound} Leaderboard
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roundChips}>
          {rounds.map((round) => (
            <Chip
              key={round.id}
              mode={selectedRound === round.round_number ? 'flat' : 'outlined'}
              selected={selectedRound === round.round_number}
              onPress={() => setSelectedRound(round.round_number)}
              style={[
                styles.roundChip,
                selectedRound === round.round_number && styles.selectedRoundChip
              ]}
            >
              Round {round.round_number}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.roundLeaderboardCards}>
        {roundLeaderboard.map((team) => (
          <Card key={team.team_id} style={[styles.teamCard, getRankStyle(team.rank)]}>
            <Card.Content>
              <View style={styles.teamCardHeader}>
                <View style={styles.teamInfo}>
                  <Text variant="headlineSmall" style={styles.rankText}>
                    {getRankIcon(team.rank)}
                  </Text>
                  <View style={[styles.teamColor, { backgroundColor: team.team_color || '#6366f1' }]} />
                  <Text variant="titleLarge" style={styles.teamName}>
                    {team.team_name}
                  </Text>
                </View>
                
                <View style={styles.teamStats}>
                  <Text variant="displaySmall" style={styles.scoreText}>
                    {team.round_score}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    points
                  </Text>
                </View>
              </View>

              <View style={styles.teamMetrics}>
                <View style={styles.metric}>
                  <Text variant="titleMedium" style={styles.metricValue}>
                    {team.accuracy.toFixed(1)}%
                  </Text>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Accuracy
                  </Text>
                </View>
                
                <View style={styles.metric}>
                  <Text variant="titleMedium" style={styles.metricValue}>
                    {team.correct_answers}/{team.total_questions}
                  </Text>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Correct
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Loading leaderboard...</Text>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {party.name} - Leaderboard
        </Text>
        
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'overall' | 'round')}
          buttons={[
            { value: 'overall', label: 'Overall' },
            { value: 'round', label: 'By Round' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView style={styles.content}>
        {viewMode === 'overall' ? renderOverallLeaderboard() : renderRoundLeaderboard()}
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

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
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  leaderboardContainer: {
    padding: 16,
  },
  sectionTitle: {
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  horizontalScroll: {
    maxHeight: 400,
  },
  dataTable: {
    minWidth: width * 1.5, // Allow horizontal scrolling
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
  },
  rankColumn: { minWidth: 80 },
  teamColumn: { minWidth: 150 },
  scoreColumn: { minWidth: 80 },
  accuracyColumn: { minWidth: 90 },
  questionsColumn: { minWidth: 100 },
  roundColumn: { minWidth: 80 },
  firstPlace: {
    backgroundColor: '#fbbf24',
  },
  secondPlace: {
    backgroundColor: '#d1d5db',
  },
  thirdPlace: {
    backgroundColor: '#cd7c2f',
  },
  defaultPlace: {
    backgroundColor: '#ffffff',
  },
  rankText: {
    fontWeight: 'bold',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  teamName: {
    color: '#1f2937',
  },
  scoreText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  roundSelector: {
    marginBottom: 24,
  },
  roundChips: {
    marginTop: 16,
  },
  roundChip: {
    marginRight: 8,
  },
  selectedRoundChip: {
    backgroundColor: '#6366f1',
  },
  roundLeaderboardCards: {
    gap: 12,
  },
  teamCard: {
    elevation: 2,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamStats: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#6b7280',
  },
  teamMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#059669',
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#6b7280',
    marginTop: 4,
  },
});