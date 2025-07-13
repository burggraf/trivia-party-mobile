import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Party = Database['public']['Tables']['parties']['Row'];
type PartyInsert = Database['public']['Tables']['parties']['Insert'];
type Round = Database['public']['Tables']['rounds']['Row'];
type RoundInsert = Database['public']['Tables']['rounds']['Insert'];
type Team = Database['public']['Tables']['teams']['Row'];
type Player = Database['public']['Tables']['players']['Row'];

export class PartyService {
  // Create a new party
  static async createParty(
    partyData: Omit<PartyInsert, 'join_code'>
  ): Promise<Party> {
    const { data: joinCode } = await supabase.rpc('generate_join_code');

    const { data, error } = await supabase
      .from('parties')
      .insert({
        ...partyData,
        join_code: joinCode,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get party by join code
  static async getPartyByJoinCode(joinCode: string): Promise<Party | null> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('join_code', joinCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  // Get party by ID
  static async getPartyById(partyId: string): Promise<Party | null> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('id', partyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  // Get parties for current user (as host)
  static async getUserParties(): Promise<Party[]> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return [];
    }

    // For now, only get parties where user is the host to avoid RLS recursion
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('host_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update party status
  static async updatePartyStatus(
    partyId: string,
    status: Party['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('parties')
      .update({ status })
      .eq('id', partyId);

    if (error) throw error;
  }

  // Add round to party
  static async addRound(roundData: RoundInsert): Promise<Round> {
    const { data, error } = await supabase
      .from('rounds')
      .insert(roundData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get rounds for a party
  static async getPartyRounds(partyId: string): Promise<Round[]> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('party_id', partyId)
      .order('round_number');

    if (error) throw error;
    return data || [];
  }

  // Select questions for a round
  static async selectQuestionsForRound(
    roundId: string,
    categories: string[],
    difficulty?: string,
    questionCount?: number
  ): Promise<void> {
    const { error } = await supabase.rpc('select_questions_for_round', {
      round_uuid: roundId,
      categories_array: categories,
      difficulty_level: difficulty || null,
      question_count_param: questionCount || 10,
    });

    if (error) throw error;
  }

  // Get existing player or create new one
  static async getOrCreatePlayer(
    partyId: string,
    displayName: string,
    userId: string
  ): Promise<Player> {
    // First try to find existing player
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('party_id', partyId)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      return existingPlayer;
    }

    // Create new player if doesn't exist
    const { data, error } = await supabase
      .from('players')
      .insert({
        party_id: partyId,
        user_id: userId,
        display_name: displayName,
        is_host: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Join party as player (legacy method - now uses getOrCreatePlayer)
  static async joinParty(
    partyId: string,
    displayName: string,
    userId: string
  ): Promise<Player> {
    return this.getOrCreatePlayer(partyId, displayName, userId);
  }

  // Get player's existing team in a party
  static async getPlayerTeam(partyId: string, userId: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        team_id,
        teams (*)
      `)
      .eq('party_id', partyId)
      .eq('user_id', userId)
      .single();

    if (error || !data?.team_id) return null;
    return data.teams as Team;
  }

  // Create or join team
  static async createOrJoinTeam(
    partyId: string,
    teamName: string,
    playerId: string,
    teamColor?: string
  ): Promise<Team> {
    // Try to find existing team first
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('party_id', partyId)
      .eq('name', teamName)
      .single();

    let team: Team;

    if (existingTeam) {
      team = existingTeam;
    } else {
      // Create new team
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          party_id: partyId,
          name: teamName,
          color: teamColor || '#6366f1',
        })
        .select()
        .single();

      if (teamError) throw teamError;
      team = newTeam;
    }

    // Update player's team
    const { error: updateError } = await supabase
      .from('players')
      .update({ team_id: team.id })
      .eq('id', playerId);

    if (updateError) throw updateError;

    return team;
  }

  // Get teams for a party
  static async getPartyTeams(partyId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('party_id', partyId)
      .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get leaderboard for party
  static async getPartyLeaderboard(partyId: string) {
    const { data, error } = await supabase.rpc('get_party_leaderboard', {
      party_uuid: partyId,
    });

    if (error) throw error;
    return data || [];
  }

  // Submit team answer
  static async submitAnswer(
    partyQuestionId: string,
    teamId: string,
    selectedAnswer: 'a' | 'b' | 'c' | 'd'
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('submit_team_answer', {
      party_question_uuid: partyQuestionId,
      team_uuid: teamId,
      selected_answer_param: selectedAnswer,
    });

    if (error) throw error;
    return data;
  }

  // Check if all teams have answered
  static async checkAllTeamsAnswered(
    partyQuestionId: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('all_teams_answered', {
      party_question_uuid: partyQuestionId,
    });

    if (error) throw error;
    return data;
  }

  // Get current question for a round
  static async getCurrentQuestion(roundId: string, questionOrder: number) {
    const { data, error } = await supabase
      .from('party_questions')
      .select(
        `
        *,
        questions (*)
      `
      )
      .eq('round_id', roundId)
      .eq('question_order', questionOrder)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Get players in a party
  static async getPartyPlayers(partyId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('party_id', partyId)
      .order('joined_at');

    if (error) throw error;
    return data || [];
  }

  // Get questions for a round
  static async getRoundQuestions(roundId: string) {
    const { data, error } = await supabase
      .from('party_questions')
      .select(`
        *,
        questions (*)
      `)
      .eq('round_id', roundId)
      .order('question_order');

    if (error) throw error;
    return data || [];
  }

  // Update current game state (for host)
  static async updateGameState(
    partyId: string,
    roundId: string,
    questionOrder: number
  ): Promise<void> {
    const { error } = await supabase
      .from('parties')
      .update({
        current_round_id: roundId,
        current_question_order: questionOrder,
        game_state_updated_at: new Date().toISOString(),
      })
      .eq('id', partyId);

    if (error) throw error;
  }

  // Get current game state
  static async getCurrentGameState(partyId: string) {
    const { data, error } = await supabase
      .from('parties')
      .select(`
        current_round_id,
        current_question_order,
        game_state_updated_at
      `)
      .eq('id', partyId)
      .single();

    if (error) throw error;
    return data;
  }

  // Find next unanswered question for resume functionality
  static async findNextUnansweredQuestion(partyId: string) {
    try {
      // Get all rounds for this party
      const rounds = await this.getPartyRounds(partyId);
      if (rounds.length === 0) return null;

      // Get all teams for this party
      const teams = await this.getPartyTeams(partyId);
      if (teams.length === 0) return null;

      // Check each round and question to find the next unanswered one
      for (const round of rounds) {
        const questions = await this.getRoundQuestions(round.id);
        
        for (const question of questions) {
          // Count how many teams have answered this question
          const { data: answers, error } = await supabase
            .from('answers')
            .select('team_id')
            .eq('party_question_id', question.id);

          if (error) throw error;

          const answeredTeamIds = new Set(answers?.map(a => a.team_id) || []);
          const unansweredTeams = teams.filter(team => !answeredTeamIds.has(team.id));

          // If not all teams have answered, this is our next question
          if (unansweredTeams.length > 0) {
            return {
              round,
              question,
              questionOrder: question.question_order,
              unansweredTeams: unansweredTeams.length,
              totalTeams: teams.length
            };
          }
        }
      }

      // All questions have been answered
      return null;
    } catch (error) {
      console.error('Error finding next unanswered question:', error);
      throw error;
    }
  }

  // Broadcast game events
  static async broadcastGameStarted(partyId: string) {
    console.log('PartyService: Broadcasting game started for party:', partyId);
    try {
      const channelName = `party-${partyId}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to the channel first to ensure it exists
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          console.log('PartyService: Broadcast channel status for game_started:', status);
          if (status === 'SUBSCRIBED') {
            resolve(true);
          }
        });
      });

      const result = await channel.send({
        type: 'broadcast',
        event: 'game_started',
        payload: { partyId }
      });
      console.log('PartyService: Game started broadcast result:', result);
      
      // Clean up channel
      supabase.removeChannel(channel);
    } catch (error) {
      console.error('PartyService: Error broadcasting game started:', error);
    }
  }

  static async broadcastQuestionToPlayers(partyId: string, questionData: any) {
    console.log('PartyService: Broadcasting question to players for party:', partyId);
    try {
      const channelName = `party-${partyId}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to the channel first to ensure it exists
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          console.log('PartyService: Broadcast channel status for question:', status);
          if (status === 'SUBSCRIBED') {
            resolve(true);
          }
        });
      });

      const payload = {
        party_question_id: questionData.id,
        question: questionData.questions.question,
        option_a: questionData.questions.a,
        option_b: questionData.questions.b,
        option_c: questionData.questions.c,
        option_d: questionData.questions.d,
        category: questionData.questions.category,
        difficulty: questionData.questions.difficulty,
        round_name: questionData.round_name,
        question_number: questionData.question_order
      };

      console.log('PartyService: Sending question payload:', payload);
      
      const result = await channel.send({
        type: 'broadcast',
        event: 'question_data',
        payload: payload
      });
      
      console.log('PartyService: Question broadcast result:', result);
      
      // Clean up channel
      supabase.removeChannel(channel);
    } catch (error) {
      console.error('PartyService: Error broadcasting question:', error);
    }
  }

  static async broadcastGameEnded(partyId: string) {
    console.log('PartyService: Broadcasting game ended for party:', partyId);
    try {
      const channelName = `party-${partyId}`;
      const channel = supabase.channel(channelName);
      
      const result = await channel.send({
        type: 'broadcast',
        event: 'game_ended',
        payload: { partyId }
      });
      console.log('PartyService: Game ended broadcast result:', result);
    } catch (error) {
      console.error('PartyService: Error broadcasting game ended:', error);
    }
  }

  static async broadcastQuestionResults(partyId: string, questionData: any) {
    console.log('PartyService: Broadcasting question results for party:', partyId);
    try {
      const channelName = `party-${partyId}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to the channel first to ensure it exists
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          console.log('PartyService: Broadcast channel status for results:', status);
          if (status === 'SUBSCRIBED') {
            resolve(true);
          }
        });
      });

      const result = await channel.send({
        type: 'broadcast',
        event: 'question_results',
        payload: {
          party_question_id: questionData.id,
          correct_answer: 'a', // 'a' is always correct in our schema
          question: questionData.questions.question,
          option_a: questionData.questions.a,
          option_b: questionData.questions.b,
          option_c: questionData.questions.c,
          option_d: questionData.questions.d
        }
      });
      console.log('PartyService: Question results broadcast result:', result);
      
      // Clean up channel
      supabase.removeChannel(channel);
    } catch (error) {
      console.error('PartyService: Error broadcasting question results:', error);
    }
  }

  static async broadcastTeamScoreUpdate(partyId: string, team: Team) {
    console.log('PartyService: Broadcasting team score update for party:', partyId, 'team:', team.id);
    try {
      const channelName = `party-${partyId}`;
      const channel = supabase.channel(channelName);
      
      const result = await channel.send({
        type: 'broadcast',
        event: 'team_score_updated',
        payload: team
      });
      console.log('PartyService: Team score broadcast result:', result);
    } catch (error) {
      console.error('PartyService: Error broadcasting team score update:', error);
    }
  }
}
