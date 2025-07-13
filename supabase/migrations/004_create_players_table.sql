-- Create players table for player participation in parties
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure a user can only join a party once
    UNIQUE(user_id, party_id)
);

-- Create indexes
CREATE INDEX idx_players_party_id ON players(party_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_is_host ON players(party_id, is_host);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;