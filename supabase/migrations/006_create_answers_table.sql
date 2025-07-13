-- Create answers table for team responses to questions
CREATE TABLE IF NOT EXISTS answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_question_id UUID REFERENCES party_questions(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    selected_answer TEXT CHECK (selected_answer IN ('a', 'b', 'c', 'd')) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure only one answer per team per question
    UNIQUE(party_question_id, team_id)
);

-- Create indexes
CREATE INDEX idx_answers_party_question_id ON answers(party_question_id);
CREATE INDEX idx_answers_team_id ON answers(team_id);
CREATE INDEX idx_answers_answered_at ON answers(answered_at);
CREATE INDEX idx_answers_is_correct ON answers(team_id, is_correct);

-- Enable RLS
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;