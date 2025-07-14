-- Enhanced leaderboard functions for round-by-round tracking

-- Function to get leaderboard with round-by-round breakdown
CREATE OR REPLACE FUNCTION get_enhanced_party_leaderboard(party_uuid UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_color TEXT,
    total_score INTEGER,
    round_scores JSONB,
    total_questions INTEGER,
    correct_answers INTEGER,
    accuracy DECIMAL,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH team_stats AS (
        SELECT 
            t.id AS team_id,
            t.name AS team_name,
            t.color AS team_color,
            t.score AS total_score,
            COUNT(a.id) AS total_questions,
            COUNT(CASE WHEN a.is_correct THEN 1 END) AS correct_answers,
            CASE 
                WHEN COUNT(a.id) > 0 THEN 
                    ROUND((COUNT(CASE WHEN a.is_correct THEN 1 END)::DECIMAL / COUNT(a.id)) * 100, 1)
                ELSE 0 
            END AS accuracy
        FROM teams t
        LEFT JOIN answers a ON t.id = a.team_id
        LEFT JOIN party_questions pq ON a.party_question_id = pq.id
        WHERE t.party_id = party_uuid
        GROUP BY t.id, t.name, t.color, t.score
    ),
    round_scores AS (
        SELECT 
            t.id AS team_id,
            JSON_OBJECT_AGG(
                r.round_number::TEXT,
                JSON_BUILD_OBJECT(
                    'round_name', r.name,
                    'score', COALESCE(round_totals.round_score, 0),
                    'total_questions', r.question_count,
                    'correct_answers', COALESCE(round_totals.correct_count, 0)
                )
            ) AS round_breakdown
        FROM teams t
        CROSS JOIN rounds r
        LEFT JOIN (
            SELECT 
                a.team_id,
                r2.id AS round_id,
                COUNT(CASE WHEN a.is_correct THEN 1 END) AS round_score,
                COUNT(CASE WHEN a.is_correct THEN 1 END) AS correct_count
            FROM answers a
            JOIN party_questions pq ON a.party_question_id = pq.id
            JOIN rounds r2 ON pq.round_id = r2.id
            GROUP BY a.team_id, r2.id
        ) round_totals ON t.id = round_totals.team_id AND r.id = round_totals.round_id
        WHERE t.party_id = party_uuid AND r.party_id = party_uuid
        GROUP BY t.id
    )
    SELECT 
        ts.team_id,
        ts.team_name,
        ts.team_color,
        ts.total_score,
        rs.round_breakdown::JSONB AS round_scores,
        ts.total_questions,
        ts.correct_answers,
        ts.accuracy,
        RANK() OVER (ORDER BY ts.total_score DESC, ts.accuracy DESC) AS rank
    FROM team_stats ts
    LEFT JOIN round_scores rs ON ts.team_id = rs.team_id
    ORDER BY ts.total_score DESC, ts.accuracy DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard for a specific round
CREATE OR REPLACE FUNCTION get_round_leaderboard(party_uuid UUID, round_number_param INTEGER)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_color TEXT,
    round_score INTEGER,
    total_questions INTEGER,
    correct_answers INTEGER,
    accuracy DECIMAL,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH round_stats AS (
        SELECT 
            t.id AS team_id,
            t.name AS team_name,
            t.color AS team_color,
            COUNT(CASE WHEN a.is_correct THEN 1 END) AS round_score,
            COUNT(pq.id) AS total_questions,
            COUNT(CASE WHEN a.is_correct THEN 1 END) AS correct_answers,
            CASE 
                WHEN COUNT(pq.id) > 0 THEN 
                    ROUND((COUNT(CASE WHEN a.is_correct THEN 1 END)::DECIMAL / COUNT(pq.id)) * 100, 1)
                ELSE 0 
            END AS accuracy
        FROM teams t
        LEFT JOIN answers a ON t.id = a.team_id
        LEFT JOIN party_questions pq ON a.party_question_id = pq.id
        LEFT JOIN rounds r ON pq.round_id = r.id
        WHERE t.party_id = party_uuid 
        AND (r.round_number = round_number_param OR r.round_number IS NULL)
        GROUP BY t.id, t.name, t.color
    )
    SELECT 
        rs.team_id,
        rs.team_name,
        rs.team_color,
        rs.round_score,
        rs.total_questions,
        rs.correct_answers,
        rs.accuracy,
        RANK() OVER (ORDER BY rs.round_score DESC, rs.accuracy DESC) AS rank
    FROM round_stats rs
    ORDER BY rs.round_score DESC, rs.accuracy DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get team performance analytics
CREATE OR REPLACE FUNCTION get_team_analytics(team_uuid UUID)
RETURNS TABLE (
    total_score INTEGER,
    total_questions INTEGER,
    correct_answers INTEGER,
    overall_accuracy DECIMAL,
    best_round TEXT,
    best_round_score INTEGER,
    worst_round TEXT,
    worst_round_score INTEGER,
    average_response_time INTERVAL,
    round_breakdown JSONB
) AS $$
DECLARE
    best_round_info RECORD;
    worst_round_info RECORD;
BEGIN
    -- Get best and worst rounds
    SELECT r.name, COUNT(CASE WHEN a.is_correct THEN 1 END) AS score
    INTO best_round_info
    FROM answers a
    JOIN party_questions pq ON a.party_question_id = pq.id
    JOIN rounds r ON pq.round_id = r.id
    WHERE a.team_id = team_uuid
    GROUP BY r.id, r.name
    ORDER BY score DESC, r.round_number ASC
    LIMIT 1;

    SELECT r.name, COUNT(CASE WHEN a.is_correct THEN 1 END) AS score
    INTO worst_round_info
    FROM answers a
    JOIN party_questions pq ON a.party_question_id = pq.id
    JOIN rounds r ON pq.round_id = r.id
    WHERE a.team_id = team_uuid
    GROUP BY r.id, r.name
    ORDER BY score ASC, r.round_number ASC
    LIMIT 1;

    RETURN QUERY
    SELECT 
        t.score AS total_score,
        COUNT(a.id)::INTEGER AS total_questions,
        COUNT(CASE WHEN a.is_correct THEN 1 END)::INTEGER AS correct_answers,
        CASE 
            WHEN COUNT(a.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN a.is_correct THEN 1 END)::DECIMAL / COUNT(a.id)) * 100, 1)
            ELSE 0 
        END AS overall_accuracy,
        COALESCE(best_round_info.name, 'None') AS best_round,
        COALESCE(best_round_info.score, 0) AS best_round_score,
        COALESCE(worst_round_info.name, 'None') AS worst_round,
        COALESCE(worst_round_info.score, 0) AS worst_round_score,
        AVG(EXTRACT(EPOCH FROM (a.answered_at - pq.created_at)) * INTERVAL '1 second') AS average_response_time,
        JSON_OBJECT_AGG(
            r.round_number::TEXT,
            JSON_BUILD_OBJECT(
                'round_name', r.name,
                'score', round_scores.score,
                'accuracy', round_scores.accuracy,
                'questions', round_scores.questions
            )
        )::JSONB AS round_breakdown
    FROM teams t
    LEFT JOIN answers a ON t.id = a.team_id
    LEFT JOIN party_questions pq ON a.party_question_id = pq.id
    LEFT JOIN rounds r ON pq.round_id = r.id
    LEFT JOIN (
        SELECT 
            r2.id,
            r2.round_number,
            COUNT(CASE WHEN a2.is_correct THEN 1 END) AS score,
            ROUND((COUNT(CASE WHEN a2.is_correct THEN 1 END)::DECIMAL / COUNT(a2.id)) * 100, 1) AS accuracy,
            COUNT(a2.id) AS questions
        FROM rounds r2
        LEFT JOIN party_questions pq2 ON r2.id = pq2.round_id
        LEFT JOIN answers a2 ON pq2.id = a2.party_question_id AND a2.team_id = team_uuid
        GROUP BY r2.id, r2.round_number
    ) round_scores ON r.id = round_scores.id
    WHERE t.id = team_uuid
    GROUP BY t.id, t.score;
END;
$$ LANGUAGE plpgsql;