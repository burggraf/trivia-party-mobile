-- =========================================================================
-- TRIVIA PARTY DATABASE MIGRATIONS - FIXED VERSION
-- =========================================================================
-- This version matches your existing questions table with TEXT id column
-- Copy this entire file and paste it into Supabase SQL Editor, then click Run
-- =========================================================================

-- MIGRATION 001: Create parties table
CREATE TABLE IF NOT EXISTS parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
    join_code TEXT UNIQUE NOT NULL,
    max_teams INTEGER DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_parties_host_id ON parties(host_id);
CREATE INDEX idx_parties_join_code ON parties(join_code);
CREATE INDEX idx_parties_status ON parties(status);
CREATE INDEX idx_parties_scheduled_date ON parties(scheduled_date);

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parties_updated_at 
    BEFORE UPDATE ON parties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- MIGRATION 002: Create rounds table
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
    
    UNIQUE(party_id, round_number)
);

CREATE INDEX idx_rounds_party_id ON rounds(party_id);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_round_number ON rounds(party_id, round_number);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_rounds_updated_at 
    BEFORE UPDATE ON rounds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- MIGRATION 003: Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(party_id, name)
);

CREATE INDEX idx_teams_party_id ON teams(party_id);
CREATE INDEX idx_teams_score ON teams(party_id, score DESC);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- MIGRATION 004: Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, party_id)
);

CREATE INDEX idx_players_party_id ON players(party_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_is_host ON players(party_id, is_host);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- MIGRATION 005: Create party_questions table (FIXED: question_id is TEXT)
CREATE TABLE IF NOT EXISTS party_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
    question_id TEXT NOT NULL, -- CHANGED FROM UUID TO TEXT
    question_order INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    time_limit INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(round_id, question_order),
    UNIQUE(party_id, question_id)
);

-- Add foreign key constraint after checking if questions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions' AND table_schema = 'public') THEN
        ALTER TABLE party_questions 
        ADD CONSTRAINT party_questions_question_id_fkey 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX idx_party_questions_party_id ON party_questions(party_id);
CREATE INDEX idx_party_questions_round_id ON party_questions(round_id);
CREATE INDEX idx_party_questions_question_id ON party_questions(question_id);
CREATE INDEX idx_party_questions_order ON party_questions(round_id, question_order);

ALTER TABLE party_questions ENABLE ROW LEVEL SECURITY;

-- MIGRATION 006: Create answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_question_id UUID REFERENCES party_questions(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    selected_answer TEXT CHECK (selected_answer IN ('a', 'b', 'c', 'd')) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(party_question_id, team_id)
);

CREATE INDEX idx_answers_party_question_id ON answers(party_question_id);
CREATE INDEX idx_answers_team_id ON answers(team_id);
CREATE INDEX idx_answers_answered_at ON answers(answered_at);
CREATE INDEX idx_answers_is_correct ON answers(team_id, is_correct);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- MIGRATION 007: Row Level Security Policies
-- =========================================================================

-- Parties policies
CREATE POLICY "Users can view parties they're involved in" ON parties
    FOR SELECT USING (
        auth.uid() = host_id OR 
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.party_id = parties.id 
            AND players.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create parties" ON parties
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their parties" ON parties
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their parties" ON parties
    FOR DELETE USING (auth.uid() = host_id);

-- Rounds policies
CREATE POLICY "Users can view rounds for parties they're in" ON rounds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = rounds.party_id 
            AND (
                parties.host_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM players 
                    WHERE players.party_id = parties.id 
                    AND players.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Hosts can manage rounds" ON rounds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = rounds.party_id 
            AND parties.host_id = auth.uid()
        )
    );

-- Teams policies
CREATE POLICY "Users can view teams in parties they're in" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = teams.party_id 
            AND (
                parties.host_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM players 
                    WHERE players.party_id = parties.id 
                    AND players.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Players can create teams" ON teams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.party_id = teams.party_id 
            AND players.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members and hosts can update team scores" ON teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = teams.party_id 
            AND (
                parties.host_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM players 
                    WHERE players.team_id = teams.id 
                    AND players.user_id = auth.uid()
                )
            )
        )
    );

-- Players policies
CREATE POLICY "Users can view players in parties they're in" ON players
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = players.party_id 
            AND (
                parties.host_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM players p2 
                    WHERE p2.party_id = parties.id 
                    AND p2.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can join parties" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player info" ON players
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave parties" ON players
    FOR DELETE USING (auth.uid() = user_id);

-- Party questions policies
CREATE POLICY "Users can view questions for parties they're in" ON party_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = party_questions.party_id 
            AND (
                parties.host_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM players 
                    WHERE players.party_id = parties.id 
                    AND players.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Hosts can manage party questions" ON party_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = party_questions.party_id 
            AND parties.host_id = auth.uid()
        )
    );

-- Answers policies
CREATE POLICY "Users can view answers for their team" ON answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = answers.team_id 
            AND EXISTS (
                SELECT 1 FROM players 
                WHERE players.team_id = teams.id 
                AND players.user_id = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM party_questions pq
            JOIN parties p ON p.id = pq.party_id
            WHERE pq.id = answers.party_question_id 
            AND p.host_id = auth.uid()
        )
    );

CREATE POLICY "Team members can submit answers" ON answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = answers.team_id 
            AND EXISTS (
                SELECT 1 FROM players 
                WHERE players.team_id = teams.id 
                AND players.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "No updates to answers once submitted" ON answers
    FOR UPDATE USING (false);

CREATE POLICY "No deleting answers" ON answers
    FOR DELETE USING (false);

-- =========================================================================
-- MIGRATION 008: Helper Functions for Game Logic (FIXED: TEXT question_id)
-- =========================================================================

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_join_code() 
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        code := upper(
            substring(
                md5(random()::text) 
                from 1 for 6
            )
        );
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_check 
        FROM parties 
        WHERE join_code = code;
        
        -- If code doesn't exist, return it
        IF exists_check = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team scores
CREATE OR REPLACE FUNCTION calculate_team_score(team_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER;
BEGIN
    SELECT COALESCE(SUM(pq.points), 0) INTO total_score
    FROM answers a
    JOIN party_questions pq ON pq.id = a.party_question_id
    WHERE a.team_id = team_uuid AND a.is_correct = true;
    
    -- Update the team's score
    UPDATE teams SET score = total_score WHERE id = team_uuid;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get party leaderboard
CREATE OR REPLACE FUNCTION get_party_leaderboard(party_uuid UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    score INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.score,
        ROW_NUMBER() OVER (ORDER BY t.score DESC)::INTEGER as rank
    FROM teams t
    WHERE t.party_id = party_uuid
    ORDER BY t.score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to randomly select questions for a round (FIXED: TEXT question_id)
CREATE OR REPLACE FUNCTION select_questions_for_round(
    round_uuid UUID,
    categories_array TEXT[],
    difficulty_level TEXT DEFAULT 'medium',
    question_count_param INTEGER DEFAULT 10
)
RETURNS VOID AS $$
DECLARE
    party_uuid UUID;
    question_record RECORD;
    order_counter INTEGER := 1;
BEGIN
    -- Get the party ID for this round
    SELECT party_id INTO party_uuid FROM rounds WHERE id = round_uuid;
    
    -- Clear existing questions for this round
    DELETE FROM party_questions WHERE round_id = round_uuid;
    
    -- Select random questions based on criteria
    FOR question_record IN
        SELECT id 
        FROM questions 
        WHERE 
            (categories_array = '{}' OR category = ANY(categories_array))
            AND (difficulty_level IS NULL OR difficulty = difficulty_level)
            AND id NOT IN (
                -- Exclude questions already used in this party
                SELECT question_id 
                FROM party_questions 
                WHERE party_id = party_uuid
            )
        ORDER BY RANDOM()
        LIMIT question_count_param
    LOOP
        -- Insert the selected question
        INSERT INTO party_questions (
            party_id,
            round_id,
            question_id,
            question_order,
            points
        ) VALUES (
            party_uuid,
            round_uuid,
            question_record.id,
            order_counter,
            10
        );
        
        order_counter := order_counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if all teams have answered a question
CREATE OR REPLACE FUNCTION all_teams_answered(party_question_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_teams INTEGER;
    answered_teams INTEGER;
    party_uuid UUID;
BEGIN
    -- Get party ID from party_question
    SELECT party_id INTO party_uuid 
    FROM party_questions 
    WHERE id = party_question_uuid;
    
    -- Count total teams in the party
    SELECT COUNT(*) INTO total_teams 
    FROM teams 
    WHERE party_id = party_uuid;
    
    -- Count teams that have answered this question
    SELECT COUNT(*) INTO answered_teams 
    FROM answers 
    WHERE party_question_id = party_question_uuid;
    
    RETURN answered_teams >= total_teams;
END;
$$ LANGUAGE plpgsql;

-- Function to submit team answer and calculate if correct
CREATE OR REPLACE FUNCTION submit_team_answer(
    party_question_uuid UUID,
    team_uuid UUID,
    selected_answer_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    correct_answer TEXT;
    is_answer_correct BOOLEAN;
BEGIN
    -- Get the correct answer for this question
    SELECT q.a INTO correct_answer
    FROM party_questions pq
    JOIN questions q ON q.id = pq.question_id
    WHERE pq.id = party_question_uuid;
    
    -- Check if the selected answer is correct
    is_answer_correct := (selected_answer_param = 'a');
    
    -- Insert the answer
    INSERT INTO answers (
        party_question_id,
        team_id,
        selected_answer,
        is_correct
    ) VALUES (
        party_question_uuid,
        team_uuid,
        selected_answer_param,
        is_answer_correct
    )
    ON CONFLICT (party_question_id, team_id) 
    DO NOTHING; -- Prevent duplicate answers
    
    -- Recalculate team score
    PERFORM calculate_team_score(team_uuid);
    
    RETURN is_answer_correct;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- MIGRATIONS COMPLETE! 
-- Your trivia party database is now ready to use.
-- =========================================================================