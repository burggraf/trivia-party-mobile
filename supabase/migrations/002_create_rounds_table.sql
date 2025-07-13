-- Create rounds table for rounds within parties
CREATE TABLE IF NOT EXISTS rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    round_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 10,
    categories TEXT[] NOT NULL DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure round numbers are unique within a party
    UNIQUE(party_id, round_number)
);

-- Create indexes
CREATE INDEX idx_rounds_party_id ON rounds(party_id);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_round_number ON rounds(party_id, round_number);

-- Enable RLS
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_rounds_updated_at 
    BEFORE UPDATE ON rounds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();