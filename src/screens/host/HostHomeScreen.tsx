import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HostStackParamList } from '../../navigation/HostNavigator';
import { PartyService } from '../../services/partyService';
import { Database } from '../../types/database';

type Party = Database['public']['Tables']['parties']['Row'];
type Navigation = StackNavigationProp<HostStackParamList, 'HostHome'>;

export default function HostHomeScreen() {
  const navigation = useNavigation<Navigation>();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadParties = async () => {
    try {
      const userParties = await PartyService.getUserParties();
      setParties(userParties);
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParties();
    setRefreshing(false);
  };

  useEffect(() => {
    loadParties();
  }, []);

  const getStatusColor = (status: Party['status']) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#6b7280';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  const getStatusLabel = (status: Party['status']) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderPartyCard = ({ item }: { item: Party }) => (
    <Card style={styles.partyCard} onPress={() => navigation.navigate('PartySetup', { partyId: item.id })}>
      <Card.Content>
        <View style={styles.partyHeader}>
          <Text variant="titleMedium" style={styles.partyName}>
            {item.name}
          </Text>
          <Chip
            mode="outlined"
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        </View>
        
        {item.description && (
          <Text variant="bodyMedium" style={styles.partyDescription}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.partyDetails}>
          <Text variant="bodySmall" style={styles.detailText}>
            Join Code: {item.join_code}
          </Text>
          <Text variant="bodySmall" style={styles.detailText}>
            Scheduled: {new Date(item.scheduled_date).toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.detailText}>
            Max Teams: {item.max_teams || 'Unlimited'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge">Loading your parties...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Your Trivia Parties
      </Text>

      {parties.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No parties yet!
          </Text>
          <Text variant="bodyLarge" style={styles.emptySubtitle}>
            Create your first trivia party to get started
          </Text>
          <Button
            mode="contained"
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateParty')}
          >
            Create Your First Party
          </Button>
        </View>
      ) : (
        <FlatList
          data={parties}
          keyExtractor={(item) => item.id}
          renderItem={renderPartyCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateParty')}
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
  title: {
    padding: 16,
    paddingBottom: 8,
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
  },
  partyCard: {
    marginBottom: 12,
    elevation: 2,
  },
  partyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyName: {
    flex: 1,
    color: '#1f2937',
  },
  partyDescription: {
    color: '#6b7280',
    marginBottom: 12,
  },
  partyDetails: {
    gap: 4,
  },
  detailText: {
    color: '#9ca3af',
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
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});
