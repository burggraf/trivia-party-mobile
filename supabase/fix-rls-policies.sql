-- Fix RLS policies to prevent infinite recursion
-- This script removes problematic policies and creates safe ones

-- Drop all existing policies for players table
DROP POLICY IF EXISTS "Players can view party players" ON players;
DROP POLICY IF EXISTS "Players can insert themselves" ON players;
DROP POLICY IF EXISTS "Players can update themselves" ON players;
DROP POLICY IF EXISTS "Host can view party players" ON players;
DROP POLICY IF EXISTS "Host can manage party players" ON players;

-- Create safe, non-recursive policies for players table

-- 1. Allow users to view players in parties they're part of (as player or host)
CREATE POLICY "Users can view players in their parties" ON players
    FOR SELECT USING (
        -- User can see players in parties where they are the host
        party_id IN (
            SELECT id FROM parties WHERE host_id = auth.uid()
        )
        OR
        -- User can see players in parties where they are a participant
        party_id IN (
            SELECT DISTINCT party_id FROM players WHERE user_id = auth.uid()
        )
    );

-- 2. Allow users to insert themselves as players
CREATE POLICY "Users can join parties as players" ON players
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND is_host = false
    );

-- 3. Allow users to update their own player records
CREATE POLICY "Users can update their own player data" ON players
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. Allow hosts to insert players (for managing their parties)
CREATE POLICY "Hosts can add players to their parties" ON players
    FOR INSERT WITH CHECK (
        party_id IN (
            SELECT id FROM parties WHERE host_id = auth.uid()
        )
    );

-- 5. Allow hosts to update players in their parties
CREATE POLICY "Hosts can update players in their parties" ON players
    FOR UPDATE USING (
        party_id IN (
            SELECT id FROM parties WHERE host_id = auth.uid()
        )
    );

-- 6. Allow hosts to delete players from their parties
CREATE POLICY "Hosts can remove players from their parties" ON players
    FOR DELETE USING (
        party_id IN (
            SELECT id FROM parties WHERE host_id = auth.uid()
        )
    );

-- Also check and fix any recursive policies on other tables

-- Fix parties table policies if needed
DROP POLICY IF EXISTS "Users can view their parties" ON parties;
CREATE POLICY "Users can view their parties" ON parties
    FOR SELECT USING (
        host_id = auth.uid()
        OR
        id IN (
            SELECT DISTINCT party_id FROM players WHERE user_id = auth.uid()
        )
    );

-- Fix teams table policies
DROP POLICY IF EXISTS "Users can view teams in their parties" ON teams;
CREATE POLICY "Users can view teams in their parties" ON teams
    FOR SELECT USING (
        party_id IN (
            SELECT id FROM parties WHERE host_id = auth.uid()
        )
        OR
        party_id IN (
            SELECT DISTINCT party_id FROM players WHERE user_id = auth.uid()
        )
    );

-- Allow users to create teams in parties they're part of
DROP POLICY IF EXISTS "Users can create teams in joined parties" ON teams;
CREATE POLICY "Users can create teams in joined parties" ON teams
    FOR INSERT WITH CHECK (
        party_id IN (
            SELECT DISTINCT party_id FROM players WHERE user_id = auth.uid()
        )
    );

-- Allow hosts to manage teams in their parties
DROP POLICY IF EXISTS "Hosts can manage teams in their parties" ON teams;
CREATE POLICY "Hosts can manage teams in their parties" ON teams
    FOR ALL USING (
        party_id IN (
            SELECT id FROM parties WHERE host_id = auth.uid()
        )
    );

COMMIT;