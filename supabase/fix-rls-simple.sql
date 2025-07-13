-- Simple fix for RLS infinite recursion
-- Remove all policies that reference the same table they're defined on

-- Disable RLS temporarily to clean up
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view players in their parties" ON players;
DROP POLICY IF EXISTS "Users can join parties as players" ON players;
DROP POLICY IF EXISTS "Users can update their own player data" ON players;
DROP POLICY IF EXISTS "Hosts can add players to their parties" ON players;
DROP POLICY IF EXISTS "Hosts can update players in their parties" ON players;
DROP POLICY IF EXISTS "Hosts can remove players from their parties" ON players;
DROP POLICY IF EXISTS "Players can view party players" ON players;
DROP POLICY IF EXISTS "Players can insert themselves" ON players;
DROP POLICY IF EXISTS "Players can update themselves" ON players;
DROP POLICY IF EXISTS "Host can view party players" ON players;
DROP POLICY IF EXISTS "Host can manage party players" ON players;

DROP POLICY IF EXISTS "Users can view their parties" ON parties;
DROP POLICY IF EXISTS "Users can view teams in their parties" ON teams;
DROP POLICY IF EXISTS "Users can create teams in joined parties" ON teams;
DROP POLICY IF EXISTS "Hosts can manage teams in their parties" ON teams;

-- Re-enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- PARTIES: Users can only see/modify parties they host
CREATE POLICY "parties_host_access" ON parties
    FOR ALL USING (host_id = auth.uid());

-- PLAYERS: Simple policies without cross-table references
CREATE POLICY "players_own_records" ON players
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "players_host_access" ON players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = players.party_id 
            AND parties.host_id = auth.uid()
        )
    );

CREATE POLICY "players_host_insert" ON players
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = players.party_id 
            AND parties.host_id = auth.uid()
        )
    );

CREATE POLICY "players_host_update" ON players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = players.party_id 
            AND parties.host_id = auth.uid()
        )
    );

CREATE POLICY "players_host_delete" ON players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = players.party_id 
            AND parties.host_id = auth.uid()
        )
    );

-- TEAMS: Simple policies
CREATE POLICY "teams_party_host" ON teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM parties 
            WHERE parties.id = teams.party_id 
            AND parties.host_id = auth.uid()
        )
    );

-- Allow team creation for any authenticated user (they can join parties)
CREATE POLICY "teams_user_insert" ON teams
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "teams_user_select" ON teams
    FOR SELECT USING (auth.uid() IS NOT NULL);

COMMIT;