-- Row Level Security Policies

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