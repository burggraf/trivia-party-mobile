# Testing the Trivia Party Mobile App

## Testing in Docker Container

Since you're running in a Docker container, you'll need to use **tunnel mode** to test the app on your mobile device.

### Prerequisites

1. **Expo Go app** installed on your mobile device
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Same network**: Your mobile device should be able to access the internet (tunnel mode works over the internet, not local network)

### Starting the Development Server

```bash
# Start in tunnel mode (already configured)
npm start -- --tunnel

# Or use npx directly
npx expo start --tunnel
```

### Testing Steps

1. **Start the server** (as shown above)
2. **Wait for tunnel connection** - you'll see "Tunnel ready" in the console
3. **Open Expo Go** on your mobile device
4. **Scan the QR code** displayed in the terminal or browser
5. **Wait for the app to load** - first load may take a few minutes

### What You Should See

1. **Loading screen** initially
2. **Login screen** since no user is authenticated yet
3. **Navigation structure** with tabs for Home, Host, Player, Profile

### Current Functionality

✅ **Working:**
- App launches and loads
- Navigation between screens works
- UI components render correctly
- Authentication flow (login/register screens)

❌ **Not Yet Implemented:**
- Supabase backend connection (needs environment variables)
- Database functionality
- Real-time features
- QR code scanning
- Actual trivia game logic

### Environment Setup (Next Steps)

To test with full functionality, you'll need:

1. **Supabase project** set up
2. **Environment variables** configured:
   ```bash
   # Create .env file
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Troubleshooting

**App won't load:**
- Make sure tunnel shows "Tunnel ready"
- Check internet connection on mobile device
- Try refreshing the Expo Go app

**QR Code not scanning:**
- Use the manual "Enter URL manually" option in Expo Go
- Copy the tunnel URL from the terminal

**Slow loading:**
- First load is always slower over tunnel
- Subsequent reloads should be faster

### Development Commands

```bash
# Start with tunnel (for Docker)
npm start -- --tunnel

# Start normally (for local development)
npm start

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Format code
npm run format
```

### Next Development Steps

1. Set up Supabase database tables
2. Configure environment variables
3. Implement host party creation
4. Implement player party joining
5. Add real-time functionality
6. Implement TV casting features