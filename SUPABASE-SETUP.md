# Supabase Setup Guide

## ✅ Current Status
Your app now runs without crashing! It's in **demo mode** since Supabase isn't configured yet.

## What You Can Test Right Now

**Without Supabase setup:**
- ✅ App loads and runs
- ✅ Navigation between all screens works
- ✅ UI components display correctly  
- ✅ You can see the login screen and all tabs
- ❌ Login/signup won't work (shows helpful error message)

## Next Steps: Setting Up Supabase

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/sign in
3. Click "New Project"
4. Choose organization and enter project details:
   - **Name**: `trivia-party`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
5. Wait for project to be created (~2 minutes)

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Replace the placeholder values with your actual Supabase credentials.

### 4. Set Up Database Tables

Once you have Supabase configured, we'll create these tables:

- `parties` - trivia party events
- `rounds` - rounds within parties  
- `teams` - team information
- `players` - player profiles
- `questions` - trivia questions (you mentioned you already have 60k+)
- `party_questions` - questions selected for each round
- `answers` - team responses

### 5. Restart Your App

After setting up the environment variables:

```bash
# Restart Expo
npx expo start --tunnel --clear
```

## Testing With Supabase

Once configured, you'll be able to:

- ✅ Create accounts and sign in/out
- ✅ Test authentication flow
- ✅ Navigate to authenticated screens
- ✅ See real user data in profile

## Current Demo Mode Features

**What works now (without Supabase):**
- App navigation and UI
- Screen layouts and components
- Basic app structure

**What shows helpful errors:**
- Login attempts (shows "Supabase not configured" message)
- Registration attempts
- Any backend operations

## Need Help?

The app is designed to fail gracefully - it will show clear error messages when Supabase operations are attempted without proper configuration.

**Your app is working perfectly!** You just need to connect it to Supabase for full functionality.