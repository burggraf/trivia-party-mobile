# 🎯 Trivia Party Mobile App

A React Native mobile app for hosting local trivia parties at homes, pubs, and other gathering places. Built with Expo and featuring real-time multiplayer gameplay with TV display capabilities.

## 🚀 Features

### 🎮 Core Gameplay
- **Real-time Multiplayer**: Synchronized trivia games with live updates
- **60,000+ Questions**: Comprehensive trivia database across multiple categories
- **TV Display Support**: Cast questions and leaderboards to big screens
- **QR Code Joining**: Easy party joining via QR code scanning
- **Live Leaderboards**: Real-time scoring with animations and round-by-round analytics

### 👑 Host Features
- **Party Management**: Create and manage trivia events
- **Flexible Rounds**: Configure multiple rounds with different categories and difficulties
- **Game Control**: Advance questions, monitor responses, display results
- **Enhanced Analytics**: Detailed team performance tracking and statistics

### 👥 Player Features
- **Team Formation**: Join existing teams or create new ones
- **Mobile Answering**: Submit answers directly from your phone
- **Real-time Updates**: See live scores and team status
- **Cross-platform**: Works on both iOS and Android

### 🔐 Security & Anti-Cheating
- **Row Level Security**: Comprehensive database security policies
- **Party Isolation**: Teams can only access their own party data
- **Answer Integrity**: Immutable answers prevent tampering
- **Future Question Protection**: Players can't see upcoming questions

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Real-time)
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime & Broadcasts
- **QR Scanning**: Expo Barcode Scanner

## 📱 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trivia-party-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

### Detailed Setup Guides
- 📋 [Supabase Setup](./SUPABASE-SETUP.md) - Database configuration
- 🏗️ [Build Setup](./docs/BUILD_QUICK_START.md) - Creating development builds
- 🐳 [Docker Development](./docs/DEVELOPMENT_ENVIRONMENT.md) - Environment options

## 📖 Documentation

### Development
- [Quick Setup Guide](./QUICK-SETUP.md) - Get started in 5 minutes
- [Development Environment](./docs/DEVELOPMENT_ENVIRONMENT.md) - Local vs Docker setup
- [Database Schema](./supabase/SCHEMA.md) - Complete database documentation

### Building & Deployment
- [Expo Builds Guide](./docs/EXPO_BUILDS.md) - Comprehensive build documentation
- [Build Quick Start](./docs/BUILD_QUICK_START.md) - Create your first build
- [Testing Guide](./TESTING.md) - Testing strategies and procedures

### Database
- [Supabase Setup](./SUPABASE-SETUP.md) - Backend configuration
- [Schema Documentation](./supabase/SCHEMA.md) - Tables, functions, and security
- [Migration Files](./supabase/migrations/) - Database version history

## 🏗️ Building the App

### Development Builds
```bash
# iOS Simulator (fastest)
eas build --profile development-simulator --platform ios

# Android Device
eas build --profile development --platform android
```

### Production Builds
```bash
# Build for app stores
eas build --profile production --platform all

# Submit to stores
eas submit --profile production --platform all
```

See [Expo Builds Guide](./docs/EXPO_BUILDS.md) for complete instructions.

## 📊 Database Schema

### Core Tables
- **parties** - Trivia party events
- **rounds** - Round configuration per party  
- **teams** - Team information and scores
- **players** - Player participation
- **questions** - Master question bank (60K+ questions)
- **party_questions** - Questions selected for each round
- **answers** - Team responses and scoring

### Security Features
- Row Level Security (RLS) on all tables
- Role-based access (hosts vs players)
- Anti-cheating measures
- Party data isolation

See [Database Schema](./supabase/SCHEMA.md) for complete documentation.

## 🎮 How to Play

### For Hosts
1. **Create a Party** - Set name, date, and configure rounds
2. **Add Rounds** - Choose categories, difficulty, and question count
3. **Generate Questions** - Auto-select questions based on criteria
4. **Start the Game** - Share join code/QR with players
5. **Control Flow** - Advance questions and display results
6. **View Analytics** - Track team performance and statistics

### For Players
1. **Join Party** - Scan QR code or enter join code
2. **Select Team** - Join existing team or create new one
3. **Answer Questions** - Submit responses on your mobile device
4. **Track Progress** - Watch live leaderboards and scores
5. **Celebrate** - See final results and team rankings

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E testing
npm run test:e2e
```

See [Testing Guide](./TESTING.md) for comprehensive testing strategies.

## 📱 Supported Platforms

- **iOS**: iPhone and iPad (iOS 13+)
- **Android**: Phones and tablets (Android 8+)
- **TV Display**: Via AirPlay (iOS) or Chromecast (Android)

## 🔧 Development Scripts

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator  
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm test           # Run test suite
npm run lint       # Lint code
npm run typecheck  # TypeScript type checking
```

## 🌍 Environment Management

The app supports multiple environments:

- **Development** (`development`) - Local development
- **Staging** (`staging`) - QA testing
- **Production** (`production`) - Live app

Configure via `.env.development`, `.env.staging`, `.env.production` files.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📧 Email: [your-email@domain.com]
- 🐛 Issues: [GitHub Issues](../../issues)
- 📖 Documentation: See `/docs` folder

## 🎯 Roadmap

- [ ] Voice questions and answers
- [ ] Custom question upload
- [ ] Tournament brackets
- [ ] Social features and sharing
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

## ⭐ Acknowledgments

- Built with [Expo](https://expo.dev)
- Backend powered by [Supabase](https://supabase.com)
- UI components from [React Native Paper](https://callstack.github.io/react-native-paper/)
- Question database from [Open Trivia Database](https://opentdb.com/)

---

**🎉 Ready to host your first trivia party?** Follow the [Quick Setup Guide](./QUICK-SETUP.md) and get started in minutes!