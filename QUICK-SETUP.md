# 🚀 Quick Setup Guide

## Step 1: Run Database Migrations

**Easiest Method - Use Supabase Dashboard:**

1. **Go to your Supabase project** at [supabase.com](https://supabase.com)
2. **Click "SQL Editor"** in the left sidebar
3. **Copy ALL the contents** of `supabase/all-migrations-combined.sql`
4. **Paste into SQL Editor** and click "Run"
5. **Wait for success message** - should see "Success. No rows returned"

## Step 2: Set Environment Variables

Create a `.env` file in your project root:

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**To get these values:**
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy **Project URL** and **anon public** key

## Step 3: Test Your Setup

```bash
# Restart your app
npx expo start --tunnel --clear
```

**You should now be able to:**
- ✅ Create accounts and sign in
- ✅ Navigate to all screens without errors
- ✅ See real authentication working

## Step 4: Verify Database

In Supabase dashboard, go to **Table Editor** - you should see:
- ✅ `parties` table
- ✅ `rounds` table  
- ✅ `teams` table
- ✅ `players` table
- ✅ `party_questions` table
- ✅ `answers` table

## Troubleshooting

**"relation does not exist" error:**
- Make sure you ran the entire `all-migrations-combined.sql` file
- Check that you have a `questions` table with your trivia data

**"permission denied" error:**
- Make sure you're signed in to your app
- Check RLS policies are working correctly

**App still shows "Supabase not configured":**
- Double-check your `.env` file has the correct values
- Restart the Expo development server

## What's Next?

Once setup is complete, you're ready for **Phase 3: Core Host Features**!

Your database is now fully configured and ready for trivia parties! 🎉