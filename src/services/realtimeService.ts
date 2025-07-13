import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to party updates
  static subscribeToParty(
    partyId: string,
    callbacks: {
      onPartyUpdate?: (payload: any) => void;
      onTeamUpdate?: (payload: any) => void;
      onPlayerJoin?: (payload: any) => void;
      onPlayerLeave?: (payload: any) => void;
      onAnswerSubmitted?: (payload: any) => void;
    }
  ): () => void {
    const channelName = `party-${partyId}`;

    // Remove existing channel if it exists
    this.unsubscribeFromParty(partyId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parties',
          filter: `id=eq.${partyId}`,
        },
        callbacks.onPartyUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `party_id=eq.${partyId}`,
        },
        callbacks.onTeamUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `party_id=eq.${partyId}`,
        },
        callbacks.onPlayerJoin || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `party_id=eq.${partyId}`,
        },
        callbacks.onPlayerLeave || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
        },
        callbacks.onAnswerSubmitted || (() => {})
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromParty(partyId);
  }

  // Subscribe to round updates
  static subscribeToRound(
    roundId: string,
    callbacks: {
      onRoundUpdate?: (payload: any) => void;
      onQuestionUpdate?: (payload: any) => void;
    }
  ): () => void {
    const channelName = `round-${roundId}`;

    // Remove existing channel if it exists
    this.unsubscribeFromRound(roundId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rounds',
          filter: `id=eq.${roundId}`,
        },
        callbacks.onRoundUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_questions',
          filter: `round_id=eq.${roundId}`,
        },
        callbacks.onQuestionUpdate || (() => {})
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromRound(roundId);
  }

  // Subscribe to team-specific updates
  static subscribeToTeam(
    teamId: string,
    callbacks: {
      onScoreUpdate?: (payload: any) => void;
      onMemberUpdate?: (payload: any) => void;
    }
  ): () => void {
    const channelName = `team-${teamId}`;

    // Remove existing channel if it exists
    this.unsubscribeFromTeam(teamId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${teamId}`,
        },
        callbacks.onScoreUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${teamId}`,
        },
        callbacks.onMemberUpdate || (() => {})
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromTeam(teamId);
  }

  // Subscribe to game events (for hosts)
  static subscribeToGameEvents(
    partyId: string,
    callbacks: {
      onAllTeamsAnswered?: (questionId: string) => void;
      onNewAnswer?: (payload: any) => void;
      onPlayerActivity?: (payload: any) => void;
    }
  ): () => void {
    const channelName = `game-events-${partyId}`;

    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
        },
        async (payload) => {
          if (callbacks.onNewAnswer) {
            callbacks.onNewAnswer(payload);
          }

          // Check if all teams have answered
          if (callbacks.onAllTeamsAnswered && payload.new?.party_question_id) {
            try {
              const { data: allAnswered } = await supabase.rpc(
                'all_teams_answered',
                {
                  party_question_uuid: payload.new.party_question_id,
                }
              );

              if (allAnswered) {
                callbacks.onAllTeamsAnswered(payload.new.party_question_id);
              }
            } catch (error) {
              console.error('Error checking if all teams answered:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `party_id=eq.${partyId}`,
        },
        callbacks.onPlayerActivity || (() => {})
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      if (this.channels.has(channelName)) {
        this.channels.get(channelName)?.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  // Unsubscribe from specific party
  static unsubscribeFromParty(partyId: string): void {
    const channelName = `party-${partyId}`;
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from specific round
  static unsubscribeFromRound(roundId: string): void {
    const channelName = `round-${roundId}`;
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from specific team
  static unsubscribeFromTeam(teamId: string): void {
    const channelName = `team-${teamId}`;
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  static unsubscribeFromAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  // Get active channel count (for debugging)
  static getActiveChannelCount(): number {
    return this.channels.size;
  }

  // List active channels (for debugging)
  static getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}
