# Trivia Party Database Schema

## Overview
Complete database schema for the Trivia Party mobile application, including all tables, relationships, functions, and Row Level Security (RLS) policies.

## Tables

### parties
Main party/event table for hosting trivia games.

```sql
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  join_code TEXT NOT NULL UNIQUE,
  max_teams INTEGER DEFAULT 8,
  current_round_id UUID REFERENCES rounds(id),
  current_question_order INTEGER DEFAULT 1,
  game_state_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### rounds
Round configuration for each party.

```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id),
  round_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  question_count INTEGER DEFAULT 10,
  categories TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### teams
Team information for each party.

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### players
Player/user participation in parties.

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  party_id UUID NOT NULL REFERENCES parties(id),
  team_id UUID REFERENCES teams(id),
  display_name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now()
);
```

### questions
Master question bank (60,000+ trivia questions).

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  category TEXT,
  subcategory TEXT,
  difficulty TEXT,
  question TEXT,
  a TEXT, -- correct answer (always correct)
  b TEXT, -- incorrect answer
  c TEXT, -- incorrect answer
  d TEXT, -- incorrect answer
  level NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### party_questions
Questions selected for specific party rounds.

```sql
CREATE TABLE party_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id),
  round_id UUID NOT NULL REFERENCES rounds(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  question_order INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### answers
Team responses to questions.

```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_question_id UUID NOT NULL REFERENCES party_questions(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);
```

## Database Functions

### Core Functions

#### `generate_join_code()`
Generates unique 6-character join codes for parties.

#### `calculate_team_score(team_uuid UUID)`
Calculates total score for a team based on correct answers.

#### `get_party_leaderboard(party_uuid UUID)`
Returns ranked leaderboard for a party.

#### `submit_team_answer(party_question_uuid UUID, team_uuid UUID, selected_answer_param TEXT)`
Securely submits team answer and calculates score.

#### `all_teams_answered(party_question_uuid UUID)`
Checks if all teams have answered a question.

#### `select_questions_for_round(round_uuid UUID, categories_array TEXT[], difficulty_level TEXT, question_count_param INTEGER)`
Randomly selects questions for a round based on criteria.

### Enhanced Leaderboard Functions

#### `get_enhanced_party_leaderboard(party_uuid UUID)`
Returns comprehensive leaderboard with round-by-round breakdown and analytics.

#### `get_round_leaderboard(party_uuid UUID, round_number_param INTEGER)`
Returns leaderboard for a specific round.

#### `get_team_analytics(team_uuid UUID)`
Returns detailed analytics for a team's performance.

### RLS Helper Functions

#### `is_party_host(party_uuid UUID, user_uuid UUID)`
Checks if user is the host of a party.

#### `is_party_player(party_uuid UUID, user_uuid UUID)`
Checks if user is a player in a party.

#### `is_team_member(team_uuid UUID, user_uuid UUID)`
Checks if user is a member of a specific team.

#### `get_user_team_in_party(party_uuid UUID, user_uuid UUID)`
Returns user's team ID in a party.

#### `has_party_access(party_uuid UUID, user_uuid UUID)`
Checks if user has access to a party (either host or player).

## Row Level Security (RLS) Policies

### Security Model
- **Party Isolation**: Users can only access data for parties they're involved in
- **Role-Based Access**: Hosts have admin rights, players have limited rights
- **Anti-Cheating**: Teams can't see other teams' answers during gameplay
- **Game Integrity**: Prevents tampering with submitted answers and scores

### Policy Categories

#### parties Table
- Hosts can manage their own parties
- Players can view parties they've joined
- Anyone can find parties by join code (for joining)

#### players Table
- Hosts can view all players in their parties
- Players can see other players in the same party
- Users can update their own player record
- Users can join parties as players
- No deleting player records (maintains game integrity)

#### teams Table
- Hosts can manage teams in their parties
- Players can see teams in their party
- Team members can update their team name/color (but not score)

#### rounds Table
- Hosts can manage rounds for their parties
- Players can view rounds for their party

#### party_questions Table
- Hosts can manage party questions for their parties
- Players cannot see future questions not yet reached in gameplay

#### answers Table
- Team members can submit answers for their team
- Users can view answers for their team
- Hosts can see all answers for scoring purposes
- No updates or deletions allowed (prevents cheating)

#### questions Table
- Everyone can read question content
- No modifications allowed (read-only question bank)

## Relationships

```
parties (1) ←→ (n) rounds
parties (1) ←→ (n) teams  
parties (1) ←→ (n) players
parties (1) ←→ (n) party_questions

rounds (1) ←→ (n) party_questions

teams (1) ←→ (n) players
teams (1) ←→ (n) answers

questions (1) ←→ (n) party_questions

party_questions (1) ←→ (n) answers

auth.users (1) ←→ (n) parties (as host)
auth.users (1) ←→ (n) players
```

## Indexes

Key indexes for performance:
- `parties.join_code` (unique)
- `parties.host_id`
- `teams.party_id`
- `players.party_id`
- `players.user_id`
- `party_questions.party_id`
- `party_questions.round_id`
- `answers.party_question_id`
- `answers.team_id`

## Security Features

### Authentication
- Uses Supabase Auth with `auth.users` table
- JWT-based authentication for API access

### Authorization
- Comprehensive RLS policies on all tables
- Role-based access control (hosts vs players)
- Function-level security with `SECURITY DEFINER`

### Anti-Cheating Measures
- Immutable answers once submitted
- Score calculations server-side only
- Future questions hidden from players
- Team isolation for answer viewing

### Data Integrity
- Foreign key constraints
- Check constraints on enums
- Unique constraints where needed
- Automatic timestamps

## Migration History

1. `001_create_parties_table.sql` - Initial parties table
2. `002_create_rounds_table.sql` - Rounds configuration
3. `003_create_teams_table.sql` - Team management
4. `004_create_players_table.sql` - Player participation
5. `005_create_party_questions_table.sql` - Question selection
6. `006_create_answers_table.sql` - Answer submission
7. `007_create_rls_policies.sql` - Initial RLS policies
8. `008_create_helper_functions.sql` - Core functions
9. `015_enhanced_leaderboard_functions.sql` - Enhanced leaderboard
10. `016_comprehensive_rls_policies.sql` - Complete RLS security

## Performance Considerations

- Partitioning could be considered for large-scale deployments
- Question bank is read-heavy, consider read replicas
- Real-time features use Supabase broadcasts for efficiency
- Leaderboard queries optimized with proper indexing