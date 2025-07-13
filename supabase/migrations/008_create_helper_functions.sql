-- Helper functions for game logic

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

-- Function to randomly select questions for a round
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