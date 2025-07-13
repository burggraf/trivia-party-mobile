import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, TextInput, FAB, Chip } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PlayerStackParamList } from '../../navigation/PlayerNavigator';
import { PartyService } from '../../services/partyService';
import { useAuthStore } from '../../stores/authStore';
import { Database } from '../../types/database';

type Party = Database['public']['Tables']['parties']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Navigation = StackNavigationProp<PlayerStackParamList, 'TeamSelection'>;

const TEAM_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export default function TeamSelectionScreen() {
  const route = useRoute();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuthStore();
  const { partyId } = route.params as { partyId: string };

  const [party, setParty] = useState<Party | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    loadData();
  }, [partyId]);

  const loadData = async () => {
    try {
      const [currentParty, teamsData] = await Promise.all([
        PartyService.getPartyById(partyId),
        PartyService.getPartyTeams(partyId),
      ]);

      setParty(currentParty);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load party information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (team: Team) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a team');
      return;
    }

    try {
      setJoining(true);

      // First join the party as a player
      const player = await PartyService.joinParty(
        partyId,
        user.user_metadata?.display_name || user.email || 'Player',
        user.id
      );

      // Then join the selected team
      await PartyService.createOrJoinTeam(
        partyId,
        team.name,
        player.id,
        team.color
      );

      navigation.navigate('PlayerGame', { partyId, teamId: team.id });
    } catch (error: any) {
      console.error('Error joining team:', error);
      Alert.alert('Error', error.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a team');
      return;
    }

    try {
      setJoining(true);

      // First join the party as a player
      const player = await PartyService.joinParty(
        partyId,
        user.user_metadata?.display_name || user.email || 'Player',
        user.id
      );

      // Create new team with a random color
      const randomColor =
        TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
      const team = await PartyService.createOrJoinTeam(
        partyId,
        newTeamName.trim(),
        player.id,
        randomColor
      );

      navigation.navigate('PlayerGame', { partyId, teamId: team.id });
    } catch (error: any) {
      console.error('Error creating team:', error);
      Alert.alert('Error', error.message || 'Failed to create team');
    } finally {
      setJoining(false);
    }
  };

  const renderTeamCard = ({ item }: { item: Team }) => (
    <Card style={styles.teamCard} onPress={() => handleJoinTeam(item)}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <View style={styles.teamInfo}>
            <View
              style={[styles.colorIndicator, { backgroundColor: item.color }]}
            />
            <Text variant="titleMedium" style={styles.teamName}>
              {item.name}
            </Text>
          </View>
          <Chip mode="outlined" style={styles.scoreChip}>
            {item.score} pts
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.teamDetails}>
          Members: {item.member_count || 0}
        </Text>

        {party?.max_teams && teams.length >= party.max_teams && (
          <Text variant="bodySmall" style={styles.limitReached}>
            Team limit reached
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Loading teams...</Text>
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
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Join a Team
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {party.name}
        </Text>
        <Text variant="bodyMedium" style={styles.partyCode}>
          Party Code: {party.join_code}
        </Text>
      </View>

      {teams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No teams yet!
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Be the first to create a team for this party
          </Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={renderTeamCard}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {showCreateTeam && (
        <Card style={styles.createTeamCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.createTeamTitle}>
              Create New Team
            </Text>

            <TextInput
              label="Team Name"
              value={newTeamName}
              onChangeText={setNewTeamName}
              mode="outlined"
              style={styles.teamNameInput}
              placeholder="e.g., Quiz Masters"
              maxLength={30}
            />

            <View style={styles.createTeamButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowCreateTeam(false);
                  setNewTeamName('');
                }}
                style={styles.cancelButton}
                disabled={joining}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateTeam}
                loading={joining}
                disabled={joining || !newTeamName.trim()}
                style={styles.createButton}
              >
                Create Team
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreateTeam(true)}
        disabled={joining}
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 4,
  },
  partyCode: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  teamCard: {
    marginBottom: 12,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  teamName: {
    color: '#1f2937',
    flex: 1,
  },
  scoreChip: {
    backgroundColor: '#f3f4f6',
  },
  teamDetails: {
    color: '#6b7280',
  },
  limitReached: {
    color: '#ef4444',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6b7280',
    textAlign: 'center',
  },
  createTeamCard: {
    margin: 16,
    elevation: 4,
  },
  createTeamTitle: {
    color: '#1f2937',
    marginBottom: 16,
  },
  teamNameInput: {
    marginBottom: 16,
  },
  createTeamButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});
