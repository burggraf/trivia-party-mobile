import { create } from 'zustand';
import { Database } from '../types/database';

type Party = Database['public']['Tables']['parties']['Row'];
type Round = Database['public']['Tables']['rounds']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Player = Database['public']['Tables']['players']['Row'];

interface PartyState {
  currentParty: Party | null;
  rounds: Round[];
  teams: Team[];
  players: Player[];
  currentRound: Round | null;
  currentQuestionIndex: number;
  isHost: boolean;
  setCurrentParty: (party: Party | null) => void;
  setRounds: (rounds: Round[]) => void;
  setTeams: (teams: Team[]) => void;
  setPlayers: (players: Player[]) => void;
  setCurrentRound: (round: Round | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setIsHost: (isHost: boolean) => void;
  resetPartyState: () => void;
}

export const usePartyStore = create<PartyState>((set) => ({
  currentParty: null,
  rounds: [],
  teams: [],
  players: [],
  currentRound: null,
  currentQuestionIndex: 0,
  isHost: false,

  setCurrentParty: (party) => set({ currentParty: party }),
  setRounds: (rounds) => set({ rounds }),
  setTeams: (teams) => set({ teams }),
  setPlayers: (players) => set({ players }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setIsHost: (isHost) => set({ isHost }),

  resetPartyState: () =>
    set({
      currentParty: null,
      rounds: [],
      teams: [],
      players: [],
      currentRound: null,
      currentQuestionIndex: 0,
      isHost: false,
    }),
}));
