# Development Environment Setup

## Local Development Requirements

### For Expo Builds
⚠️ **Important**: Expo builds cannot be performed inside Docker containers or remote development environments. You'll need to run builds from your local machine.

### Required Local Setup

1. **Node.js & npm** (v18 or later)
   ```bash
   # Install Node.js from nodejs.org
   node --version  # Should be v18+
   npm --version
   ```

2. **Expo CLI & EAS CLI**
   ```bash
   npm install -g @expo/cli eas-cli
   ```

3. **Platform-specific Tools**

   **For iOS Development:**
   - macOS required
   - Xcode (latest version)
   - iOS Simulator
   - Apple Developer Account ($99/year for device testing & App Store)

   **For Android Development:**
   - Android Studio
   - Android SDK
   - Android Emulator or physical device
   - Google Play Console Account ($25 one-time for store releases)

### Getting Started Locally

1. **Clone the repository to your local machine:**
   ```bash
   git clone <your-repo-url>
   cd trivia-party-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   # Run the setup script
   ./scripts/setup-build.sh
   
   # Or manually:
   cp .env.example .env.development
   # Edit .env.development with your Supabase credentials
   ```

4. **Configure EAS:**
   ```bash
   eas login
   eas build:configure  # Already done, but run if needed
   ```

5. **Start your first build:**
   ```bash
   # For iOS Simulator (fastest)
   eas build --profile development-simulator --platform ios
   
   # For Android device
   eas build --profile development --platform android
   ```

## Docker Environment Limitations

The current Docker development environment is perfect for:
- ✅ Code development and editing
- ✅ Running Expo development server (`npx expo start`)
- ✅ Database management and migrations
- ✅ Testing and debugging (with Expo Go)

But cannot be used for:
- ❌ Creating development builds (requires native compilation)
- ❌ Submitting to app stores
- ❌ TestFlight or Play Console uploads
- ❌ Certificate management

## Recommended Workflow

1. **Development**: Use Docker environment for rapid development
2. **Testing**: Use Expo Go in Docker environment for initial testing
3. **Builds**: Switch to local machine for creating builds
4. **Deployment**: Use local machine for store submissions

## Transitioning from Docker to Local

When you're ready to create builds:

1. **Ensure your code is committed and pushed**
2. **Clone to your local machine**
3. **Set up local environment** (see above)
4. **Copy environment variables** from your Docker setup
5. **Run builds locally**

This hybrid approach gives you the best of both worlds - fast development in a consistent Docker environment, and native build capabilities on your local machine.