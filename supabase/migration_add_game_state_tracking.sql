-- Migration: Add game state tracking to parties table
-- Run this in Supabase SQL Editor

-- Add columns to track current game state
ALTER TABLE parties 
ADD COLUMN IF NOT EXISTS current_round_id UUID,
ADD COLUMN IF NOT EXISTS current_question_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS game_state_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraint for current_round_id
ALTER TABLE parties 
ADD CONSTRAINT parties_current_round_id_fkey 
FOREIGN KEY (current_round_id) REFERENCES rounds(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_parties_current_round ON parties(current_round_id);
CREATE INDEX IF NOT EXISTS idx_parties_game_state_updated ON parties(game_state_updated_at);