-- Migration: Fix submit_team_answer function to properly check correct answers
-- Run this in Supabase SQL Editor

-- Fix submit_team_answer function to properly check correct answers
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
    -- Note: In this schema, 'a' is always the correct answer
    SELECT 'a' INTO correct_answer;
    
    -- Check if the selected answer matches the correct answer
    is_answer_correct := (selected_answer_param = correct_answer);
    
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