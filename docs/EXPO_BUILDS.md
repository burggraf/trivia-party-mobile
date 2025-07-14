# Expo Build & Deployment Guide

Complete guide for building and deploying the Trivia Party mobile app using Expo Application Services (EAS).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [EAS Setup](#eas-setup)
3. [Build Profiles](#build-profiles)
4. [Development Builds](#development-builds)
5. [Testing Builds](#testing-builds)
6. [TestFlight (iOS)](#testflight-ios)
7. [Internal Testing (Android)](#internal-testing-android)
8. [Production Releases](#production-releases)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Prerequisites

### Required Accounts
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **Apple Developer Account**: Required for iOS builds ($99/year)
- **Google Play Console Account**: Required for Android releases ($25 one-time)

### Required Tools
```bash
# Install Expo CLI and EAS CLI
npm install -g @expo/cli eas-cli

# Login to Expo
expo login

# Login to EAS
eas login
```

### Project Setup
```bash
# Initialize EAS in your project
eas build:configure

# This creates eas.json configuration file
```

## EAS Setup

### 1. Configure eas.json

Create or update `eas.json` in your project root:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      },
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "preview-simulator": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    },
    "production-simulator": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2. Configure app.json/app.config.js

Ensure your app configuration is production-ready:

```json
{
  "expo": {
    "name": "Trivia Party",
    "slug": "trivia-party",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "bundleIdentifier": "com.yourcompany.triviaparty",
      "supportsTablet": true,
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.triviaparty",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      "expo-router"
    ],
    "scheme": "trivia-party",
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

## Build Profiles

### Development Builds
- **Purpose**: Testing with custom native code during development
- **Distribution**: Internal only
- **Includes**: Development tools, debugging capabilities
- **Update Method**: Expo Updates for JS changes

### Preview Builds
- **Purpose**: Internal testing and QA
- **Distribution**: Internal (TestFlight, Internal App Sharing)
- **Includes**: Production-like builds for testing
- **Update Method**: Expo Updates

### Production Builds
- **Purpose**: App Store releases
- **Distribution**: Public app stores
- **Includes**: Optimized, minified builds
- **Update Method**: Expo Updates (for JS-only changes)

## Development Builds

### Creating Development Builds

#### iOS Development Build
```bash
# Build for physical device
eas build --profile development --platform ios

# Build for iOS Simulator (faster, no device needed)
eas build --profile development --platform ios --simulator
```

#### Android Development Build
```bash
# Build APK for development
eas build --profile development --platform android
```

### Installing Development Builds

#### iOS (Physical Device)
1. Download the `.ipa` file from the EAS build page
2. Install using Apple Configurator 2 or Xcode
3. Or use the QR code to install via TestFlight (if distributed internally)

#### iOS (Simulator)
1. Download the `.tar.gz` file
2. Extract and drag to iOS Simulator
3. Or use: `xcrun simctl install booted path/to/app.app`

#### Android
1. Download the `.apk` file
2. Enable "Install from Unknown Sources" on your device
3. Install the APK directly

### Running Development Builds

```bash
# Start the development server
npx expo start --dev-client

# Or specify a specific build
npx expo start --dev-client --tunnel
```

## Testing Builds

### Internal Testing Builds

#### Preview Build for Testing
```bash
# Build for internal testing
eas build --profile preview --platform all

# Build specific platform
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Sharing Builds with Team

#### Using Internal Distribution
```bash
# Build with internal distribution
eas build --profile preview --platform ios

# Share the link from EAS dashboard
# Team members can install via web browser (iOS) or direct APK (Android)
```

## TestFlight (iOS)

### Automatic TestFlight Distribution

#### 1. Configure eas.json for TestFlight
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "testflight": {
      "distribution": "store",
      "ios": {
        "autoIncrement": "buildNumber"
      },
      "channel": "testflight"
    }
  }
}
```

#### 2. Build and Submit to TestFlight
```bash
# Build for TestFlight
eas build --profile testflight --platform ios

# Submit to TestFlight (requires Apple Developer account)
eas submit --profile testflight --platform ios
```

#### 3. Manual TestFlight Submission
```bash
# Build only
eas build --profile testflight --platform ios

# Download and submit manually via App Store Connect
# Or use eas submit with the build ID
eas submit --platform ios --id [BUILD_ID]
```

### TestFlight Configuration

#### App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with your bundle identifier
3. Fill in app information
4. Add testers to TestFlight
5. Submit builds for review if needed

## Internal Testing (Android)

### Google Play Internal Testing

#### 1. Configure for Internal Testing
```json
{
  "build": {
    "internal-testing": {
      "distribution": "store",
      "android": {
        "buildType": "apk",
        "autoIncrement": "versionCode"
      },
      "channel": "internal-testing"
    }
  }
}
```

#### 2. Build and Submit
```bash
# Build for Play Store
eas build --profile internal-testing --platform android

# Submit to Play Console
eas submit --profile internal-testing --platform android
```

### Play Console Setup
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Set up Internal Testing track
4. Upload your AAB file
5. Add internal testers via email lists

## Production Releases

### iOS App Store Release

#### 1. Production Build Configuration
```json
{
  "build": {
    "production": {
      "distribution": "store",
      "ios": {
        "autoIncrement": "buildNumber",
        "buildConfiguration": "Release"
      },
      "android": {
        "autoIncrement": "versionCode",
        "buildType": "aab"
      },
      "channel": "production"
    }
  }
}
```

#### 2. Build and Submit
```bash
# Build for production
eas build --profile production --platform ios

# Submit to App Store
eas submit --profile production --platform ios
```

#### 3. App Store Connect Review Process
1. Complete app metadata in App Store Connect
2. Add screenshots, descriptions, keywords
3. Set pricing and availability
4. Submit for review
5. Review typically takes 24-48 hours

### Android Play Store Release

#### 1. Build for Play Store
```bash
# Build AAB for Play Store
eas build --profile production --platform android

# Submit to Play Store
eas submit --profile production --platform android
```

#### 2. Play Console Release Process
1. Upload AAB to Play Console
2. Complete store listing
3. Set content rating
4. Review and publish
5. Rollout can be gradual (5%, 10%, 50%, 100%)

### Cross-Platform Release
```bash
# Build both platforms
eas build --profile production --platform all

# Submit both platforms
eas submit --profile production --platform all
```

## Environment Configuration

### Managing Environment Variables

#### 1. Create environment files
```bash
# .env.development
EXPO_PUBLIC_SUPABASE_URL=your-dev-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key

# .env.production  
EXPO_PUBLIC_SUPABASE_URL=your-prod-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

#### 2. Configure in eas.json
```json
{
  "build": {
    "development": {
      "env": {
        "ENVIRONMENT": "development"
      }
    },
    "production": {
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

## App Updates

### Over-the-Air (OTA) Updates

#### 1. Publishing Updates
```bash
# Publish to development channel
eas update --channel development --message "Fix login bug"

# Publish to production channel
eas update --channel production --message "New feature release"
```

#### 2. Automatic Updates
Configure automatic updates in your app:

```typescript
// App.tsx
import * as Updates from 'expo-updates';

export default function App() {
  useEffect(() => {
    async function updateApp() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }
    
    updateApp();
  }, []);

  // Rest of your app
}
```

## Troubleshooting

### Common Build Issues

#### iOS Build Failures
```bash
# Clear cache and retry
eas build:cancel  # Cancel current builds
eas cache:clear
eas build --profile development --platform ios --clear-cache
```

#### Android Build Failures
```bash
# Check Java version compatibility
# Ensure Gradle wrapper is up to date
eas build --profile development --platform android --clear-cache
```

#### Certificate Issues (iOS)
```bash
# List certificates
eas credentials

# Generate new certificates
eas credentials --platform ios
```

### Build Debugging

#### Check Build Logs
1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project
3. Click on the failed build
4. Review build logs for specific errors

#### Local Build Debugging
```bash
# Run local prebuild to check for issues
npx expo prebuild --clean

# Check for configuration issues
npx expo config --type introspect
```

## Best Practices

### Version Management
```bash
# Increment version before production builds
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### Build Optimization
- Use production builds for store submissions
- Enable tree shaking and minification
- Optimize images and assets
- Test on multiple devices and OS versions

### Release Workflow
1. **Development**: Use development builds for feature development
2. **Testing**: Use preview builds for QA testing
3. **Beta**: Use TestFlight/Internal Testing for beta users
4. **Production**: Use production builds for store releases
5. **Updates**: Use OTA updates for JavaScript-only changes

### Security Considerations
- Store sensitive credentials in EAS secrets
- Use different Supabase projects for dev/prod
- Implement proper authentication flows
- Regular security audits

## Command Reference

### Quick Commands
```bash
# Development build
eas build -p ios --profile development
eas build -p android --profile development

# Preview build  
eas build -p all --profile preview

# Production build
eas build -p all --profile production

# Submit to stores
eas submit -p ios --profile production
eas submit -p android --profile production

# Publish update
eas update --channel production --message "Bug fixes"

# Check build status
eas build:list

# View project info
eas project:info
```

This comprehensive guide covers all aspects of building and deploying your Trivia Party app using Expo. Adapt the configurations based on your specific needs and requirements.