import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { PartyService } from '../../services/partyService';
import { supabase } from '../../lib/supabase';

interface Team {
  id: string;
  name: string;
  color: string | null;
  score: number;
}

interface LiveLeaderboardProps {
  partyId: string;
  maxTeams?: number;
  compact?: boolean;
}

export default function LiveLeaderboard({ partyId, maxTeams = 5, compact = false }: LiveLeaderboardProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedTeamIds, setUpdatedTeamIds] = useState<Set<string>>(new Set());
  const animationRefs = useRef<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    loadTeams();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [partyId]);

  const loadTeams = async () => {
    try {
      console.log('LiveLeaderboard: Loading teams for party:', partyId);
      const teamsData = await PartyService.getPartyTeams(partyId);
      console.log('LiveLeaderboard: Loaded teams:', teamsData.map(t => `${t.name}: ${t.score}`));
      setTeams(teamsData.slice(0, maxTeams));
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateTeamUpdate = (teamId: string) => {
    if (!animationRefs.current[teamId]) {
      animationRefs.current[teamId] = new Animated.Value(1);
    }
    
    // Pulse animation
    Animated.sequence([
      Animated.timing(animationRefs.current[teamId], {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationRefs.current[teamId], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Show update indicator for 3 seconds
    setUpdatedTeamIds(prev => new Set(prev).add(teamId));
    setTimeout(() => {
      setUpdatedTeamIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }, 3000);
  };

  const setupRealtimeSubscription = () => {
    console.log('LiveLeaderboard: Setting up realtime subscription for party:', partyId);
    
    // Subscribe to team score updates
    const teamSubscription = supabase
      .channel(`teams-${partyId}`)
      .on('broadcast', { event: 'team_score_updated' }, (payload) => {
        console.log('LiveLeaderboard: Received team score update:', payload);
        const updatedTeam = payload.payload;
        
        if (!updatedTeam || !updatedTeam.id) {
          console.warn('LiveLeaderboard: Invalid team data received:', updatedTeam);
          return;
        }
        
        setTeams(prevTeams => {
          console.log('LiveLeaderboard: Updating teams. Previous teams:', prevTeams.length);
          const updated = prevTeams.map(team => {
            if (team.id === updatedTeam.id) {
              console.log(`LiveLeaderboard: Updating team ${team.name} score from ${team.score} to ${updatedTeam.score}`);
              // Trigger animation if score changed
              if (team.score !== updatedTeam.score) {
                animateTeamUpdate(team.id);
              }
              return { ...team, score: updatedTeam.score };
            }
            return team;
          });
          // Re-sort by score
          const sorted = updated.sort((a, b) => b.score - a.score);
          console.log('LiveLeaderboard: Teams after update and sort:', sorted.map(t => `${t.name}: ${t.score}`));
          return sorted;
        });
      })
      .subscribe((status) => {
        console.log('LiveLeaderboard: Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(teamSubscription);
    };
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
      default: return {};
    }
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <Text variant="bodyMedium">Loading leaderboard...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Live Leaderboard
          </Text>
          <Text variant="bodyMedium" style={styles.noTeams}>
            No teams have joined yet
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant={compact ? "titleMedium" : "titleLarge"} style={styles.title}>
            🏆 Live Leaderboard
          </Text>
          <Button
            mode="text"
            onPress={loadTeams}
            style={styles.refreshButton}
            labelStyle={styles.refreshButtonText}
          >
            🔄
          </Button>
        </View>
        
        <View style={styles.teamsList}>
          {teams.map((team, index) => {
            const rank = index + 1;
            const isUpdated = updatedTeamIds.has(team.id);
            
            // Initialize animation value if needed
            if (!animationRefs.current[team.id]) {
              animationRefs.current[team.id] = new Animated.Value(1);
            }
            
            return (
              <Animated.View 
                key={team.id}
                style={[
                  compact ? styles.compactTeamRow : styles.teamRow,
                  getRankStyle(rank),
                  isUpdated && styles.updatedTeam,
                  {
                    transform: [{ scale: animationRefs.current[team.id] }]
                  }
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text variant={compact ? "bodyLarge" : "titleMedium"} style={styles.rank}>
                    {getRankIcon(rank)}
                  </Text>
                </View>
                
                <View style={styles.teamInfo}>
                  <View style={[
                    styles.teamColor, 
                    { backgroundColor: team.color || '#6366f1' },
                    compact && styles.compactTeamColor
                  ]} />
                  <Text 
                    variant={compact ? "bodyLarge" : "titleMedium"} 
                    style={styles.teamName}
                    numberOfLines={1}
                  >
                    {team.name}
                  </Text>
                </View>
                
                <View style={styles.scoreContainer}>
                  <Text 
                    variant={compact ? "bodyLarge" : "titleMedium"} 
                    style={[styles.score, isUpdated && styles.updatedScore]}
                  >
                    {team.score}
                  </Text>
                  {isUpdated && (
                    <Text style={styles.updateIndicator}>+1</Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
        
        {teams.length === maxTeams && (
          <Text variant="bodySmall" style={styles.moreTeams}>
            Showing top {maxTeams} teams
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    minWidth: 30,
    margin: 0,
  },
  refreshButtonText: {
    fontSize: 16,
    margin: 0,
  },
  noTeams: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  teamsList: {
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  firstPlace: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  secondPlace: {
    backgroundColor: '#d1d5db',
    borderColor: '#9ca3af',
  },
  thirdPlace: {
    backgroundColor: '#cd7c2f',
    borderColor: '#d97706',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontWeight: 'bold',
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  teamColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  compactTeamColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  teamName: {
    color: '#1f2937',
    flex: 1,
  },
  score: {
    color: '#059669',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  moreTeams: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  updatedTeam: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#ecfdf5',
  },
  scoreContainer: {
    position: 'relative',
    alignItems: 'center',
    minWidth: 60,
  },
  updatedScore: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  updateIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});