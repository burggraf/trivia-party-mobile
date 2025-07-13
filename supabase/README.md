# Supabase Database Setup

This directory contains all the SQL migrations needed to set up your Trivia Party database.

## Prerequisites

1. **Supabase project** created at [supabase.com](https://supabase.com)
2. **Questions table** with 60,000+ trivia questions (as mentioned in your requirements)

## Database Schema Overview

The database consists of these main tables:

- **`parties`** - Trivia party events with host info and settings
- **`rounds`** - Rounds within parties (multiple rounds per party)
- **`teams`** - Teams participating in parties
- **`players`** - Player profiles and party participation
- **`party_questions`** - Questions selected for each round
- **`answers`** - Team responses to questions
- **`questions`** - Your existing trivia questions table

## Installation Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project dashboard**
2. **Go to SQL Editor**
3. **Run each migration file in order:**
   - Copy the contents of each `.sql` file
   - Paste into SQL Editor
   - Click "Run"
   - Repeat for all 8 migration files

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

## Migration Files

1. **`001_create_parties_table.sql`** - Main party events table
2. **`002_create_rounds_table.sql`** - Rounds within parties
3. **`003_create_teams_table.sql`** - Team information
4. **`004_create_players_table.sql`** - Player participation
5. **`005_create_party_questions_table.sql`** - Selected questions per round
6. **`006_create_answers_table.sql`** - Team responses
7. **`007_create_rls_policies.sql`** - Row Level Security policies
8. **`008_create_helper_functions.sql`** - Utility functions for game logic

## Key Features

### Security
- **Row Level Security (RLS)** enabled on all tables
- **Policy-based access control** - users can only see data they should
- **Hosts control their parties**, players see only their party data

### Game Logic Functions
- **`generate_join_code()`** - Creates unique 6-character party codes
- **`calculate_team_score()`** - Updates team scores based on correct answers
- **`get_party_leaderboard()`** - Returns ranked team scores
- **`select_questions_for_round()`** - Randomly selects questions by category/difficulty
- **`all_teams_answered()`** - Checks if all teams have responded
- **`submit_team_answer()`** - Records answers and updates scores

### Real-time Features
All tables support Supabase real-time subscriptions for:
- Live score updates
- Team answer notifications
- Party state changes
- Player join/leave events

## After Running Migrations

1. **Test the database** by creating a sample party
2. **Configure your app environment variables:**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Restart your Expo app** to connect to the database

## Sample Data

You can create test data using the SQL editor:

```sql
-- Create a test party
INSERT INTO parties (host_id, name, description, scheduled_date, join_code, status)
VALUES (
    auth.uid(),
    'Test Trivia Night',
    'A fun test party',
    NOW() + INTERVAL '1 hour',
    generate_join_code(),
    'draft'
);
```

## Troubleshooting

**Common issues:**
- **RLS blocking queries** - Make sure you're authenticated in your app
- **Missing questions table** - Ensure your 60k questions are imported first
- **Permission denied** - Check that RLS policies allow your user's actions

**Need help?** Check the Supabase dashboard logs for detailed error messages.