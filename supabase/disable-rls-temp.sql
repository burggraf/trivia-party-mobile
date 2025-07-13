-- Temporary fix: Disable RLS on players table to stop infinite recursion
-- This is a quick fix to get the app working

-- Drop all existing problematic policies
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

-- Temporarily disable RLS on players table
ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- Keep simple RLS on other tables
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Simple party policy - users can access their own hosted parties
DROP POLICY IF EXISTS "Users can view their parties" ON parties;
CREATE POLICY "host_parties_only" ON parties
    FOR ALL USING (host_id = auth.uid());

-- Simple team policy - allow access to teams
DROP POLICY IF EXISTS "Users can view teams in their parties" ON teams;
DROP POLICY IF EXISTS "Users can create teams in joined parties" ON teams;
DROP POLICY IF EXISTS "Hosts can manage teams in their parties" ON teams;
CREATE POLICY "teams_access" ON teams
    FOR ALL USING (auth.uid() IS NOT NULL);

COMMIT;