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
  static async createParty(partyData: Omit<PartyInsert, 'join_code'>): Promise<Party> {
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

  // Get parties for current user (as host or player)
  static async getUserParties(): Promise<Party[]> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update party status
  static async updatePartyStatus(partyId: string, status: Party['status']): Promise<void> {
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
      difficulty_level: difficulty,
      question_count_param: questionCount,
    });

    if (error) throw error;
  }

  // Join party as player
  static async joinParty(
    partyId: string,
    displayName: string,
    userId: string
  ): Promise<Player> {
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
  static async checkAllTeamsAnswered(partyQuestionId: string): Promise<boolean> {
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
      .select(`
        *,
        questions (*)
      `)
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
}