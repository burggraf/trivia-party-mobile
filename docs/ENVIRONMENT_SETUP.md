# Environment Setup for Production Builds

This guide explains how to configure environment variables for EAS builds without exposing secrets in the repository.

## Overview

The app requires Supabase configuration to function properly. In development, these are loaded from `.env` files, but production builds (TestFlight, App Store) require environment variables to be set through EAS.

## Required Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

## Setting Environment Variables for Production

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g @expo/eas-cli
```

### 2. Login to EAS
```bash
eas login
```

### 3. Set Environment Variables
Use the modern `eas env:create` command (not the deprecated `eas secret:create`):

```bash
# Set Supabase URL (choose "Plain text" for visibility, "production" for environment)
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_URL_HERE"

# Set Supabase anon key (choose "Sensitive" for visibility, "production" for environment)  
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_ANON_KEY_HERE"
```

### 4. Environment Selection Guidelines

When prompted for **visibility**:
- `EXPO_PUBLIC_SUPABASE_URL` → **Plain text** (it's just a URL)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → **Sensitive** (public key but somewhat protected)

When prompted for **environment**:
- Select **production** (required for TestFlight builds)
- Optionally also select **development** and **preview** for consistency

### 5. Verify Environment Variables
```bash
# List all environment variables for your project
eas env:list
```

## Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **URL** (for `EXPO_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (for `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

## Security Notes

- ✅ **DO NOT** commit Supabase credentials to the repository
- ✅ **DO** use EAS environment variables for production builds
- ✅ **DO** use `.env` files for local development (they're in `.gitignore`)
- ⚠️ The anon key is safe to expose in client apps (it's designed for this)
- ⚠️ Never expose your **service role key** in client apps

## Troubleshooting

### White Screen on TestFlight
If you see a white screen in TestFlight builds:
1. Verify environment variables are set: `eas env:list`
2. Check that variables are set for the **production** environment
3. Rebuild with: `eas build --profile testflight --platform ios`

### Local Development Issues
If local development stops working:
1. Check that `.env` file exists and contains correct values
2. Restart Expo dev server: `npx expo start --clear`
3. Environment variables in `.env` should match those in EAS

### Environment Variable Updates
To update an existing environment variable:
```bash
eas env:update --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "NEW_VALUE"
```

To delete an environment variable:
```bash
eas env:delete --scope project --name EXPO_PUBLIC_SUPABASE_URL
```

## Build Process

After setting environment variables:

1. **Build for TestFlight:**
   ```bash
   eas build --profile testflight --platform ios
   ```

2. **Submit to TestFlight:**
   ```bash
   eas submit --profile testflight --platform ios
   ```

The environment variables will be automatically included in the production build.