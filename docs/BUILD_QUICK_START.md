# Quick Start: Building Your First Development Build

## Prerequisites Setup (5 minutes)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure Project** (if not done)
   ```bash
   eas build:configure
   ```

## Build Your First Development Build

### For iOS (Simulator - Fastest Option)
```bash
# Build for iOS Simulator (no device needed)
eas build --profile development-simulator --platform ios
```

### For iOS (Physical Device)
```bash
# Build for physical iOS device
eas build --profile development --platform ios
```

### For Android
```bash
# Build APK for Android device
eas build --profile development --platform android
```

## Installing Your Build

### iOS Simulator
1. Wait for build to complete (5-15 minutes)
2. Download the `.tar.gz` file from the build page
3. Extract the file
4. Drag the `.app` file to your iOS Simulator

### iOS Device  
1. Download the `.ipa` file
2. Use the QR code on the build page to install via web browser
3. Or use Apple Configurator 2 / Xcode to install

### Android Device
1. Download the `.apk` file
2. Enable "Install from Unknown Sources" on your device
3. Install the APK directly

## Running Your Development Build

1. **Start the development server:**
   ```bash
   npx expo start --dev-client
   ```

2. **Open the app on your device/simulator**
3. **The app will connect to your development server automatically**

## Quick Commands Reference

```bash
# Check build status
eas build:list

# Cancel current build
eas build:cancel

# Build for both platforms
eas build --profile development --platform all

# Build with cleared cache (if issues)
eas build --profile development --platform ios --clear-cache
```

## What's Next?

- Your development build includes the Expo dev client
- You can now make code changes and see them instantly
- Use `npx expo start --dev-client` to start development
- For production builds, see the full [EXPO_BUILDS.md](./EXPO_BUILDS.md) guide

## Troubleshooting

**Build failing?**
- Check the build logs on expo.dev
- Try clearing cache: `eas build --clear-cache`
- Ensure your Apple Developer account is set up (for iOS)

**Can't install on device?**
- iOS: Check if device is registered in Apple Developer portal
- Android: Enable "Install from Unknown Sources"