-- Create party_questions table for questions selected for each round
CREATE TABLE IF NOT EXISTS party_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    question_order INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    time_limit INTEGER DEFAULT 30, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure question order is unique within a round
    UNIQUE(round_id, question_order),
    -- Ensure a question is only used once per party
    UNIQUE(party_id, question_id)
);

-- Create indexes
CREATE INDEX idx_party_questions_party_id ON party_questions(party_id);
CREATE INDEX idx_party_questions_round_id ON party_questions(round_id);
CREATE INDEX idx_party_questions_question_id ON party_questions(question_id);
CREATE INDEX idx_party_questions_order ON party_questions(round_id, question_order);

-- Enable RLS
ALTER TABLE party_questions ENABLE ROW LEVEL SECURITY;