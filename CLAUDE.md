# Trivia Party Mobile App

## Project Overview
Trivia Party is a React Native mobile app built with Expo for hosting local trivia parties at homes, pubs, and other gathering places. The app supports real-time multiplayer trivia games with TV display capabilities via Chromecast/AirPlay.

## Architecture
- **Frontend**: React Native with Expo
- **Backend**: Supabase (real-time database, authentication, storage)
- **Platforms**: iOS and Android
- **Display**: TV casting support (Chromecast/AirPlay)

## Core Features

### Host Functionality
1. **Party Management**
   - Create party events with specific date & time
   - Add multiple rounds to each party
   - Configure questions per round and categories
   - Start parties and advance through slides
   - Display questions on TV via casting

2. **Question Management**
   - Select from 60,000+ trivia questions in database
   - Choose categories for random question selection
   - Control question flow and timing
   - Monitor team responses in real-time

3. **Game Control**
   - See which teams have answered each question
   - Advance to next question when ready
   - Display scores at end of each round
   - Manage multiple simultaneous parties

### Player Functionality
1. **Party Participation**
   - Scan QR code to join party
   - Select existing team or create new team
   - Answer questions on mobile device
   - View scores and leaderboards

2. **Team Management**
   - One answer per team per question
   - Real-time answer synchronization
   - Score tracking across rounds

## Database Schema

### Questions Table (Existing)
```sql
questions:
- id (uuid, primary key)
- category (text) - question category
- subcategory (text, nullable) - question subcategory  
- difficulty (text) - easy/medium/hard
- question (text) - question text
- a (text) - correct answer (always correct)
- b (text) - incorrect answer
- c (text) - incorrect answer  
- d (text) - incorrect answer
- level (ignore for now)
- metadata (jsonb, ignore for now)
- created_at (timestamp)
- updated_at (timestamp)
```

**Note**: Correct answer is always in column 'a'. Answer order is randomized for display.

### Additional Tables Needed
- `parties` - party events and metadata
- `rounds` - round configuration per party
- `teams` - team information per party
- `players` - player profiles and party participation
- `answers` - team responses to questions
- `party_questions` - questions selected for each round

## Key Technical Requirements

### Real-time Features
- Live answer submission and tracking
- Real-time score updates
- Party state synchronization between host and players
- Team status monitoring

### User Authentication
- Host and player account creation
- Profile management
- Session management across devices

### Multi-party Support
- Concurrent party hosting
- Isolated party data
- No cross-party interference

### UI/UX Requirements
- Modern, user-friendly interface
- Easy QR code scanning
- Clear question display on mobile
- Responsive design for various screen sizes
- TV-optimized display for casting

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for production
npm run build
```

## Environment Setup
- Supabase project with questions table populated
- Expo development environment
- iOS/Android development tools
- TV casting capabilities testing

## Current Status
- Database contains 60,000+ trivia questions
- Project structure needs to be established
- Core features need implementation
- Real-time synchronization needs setup