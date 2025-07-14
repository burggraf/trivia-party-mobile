# Fixing Expo Project ID Configuration

## The Issue
You're getting an "Invalid UUID appId" error because the `app.json` file has placeholder values that need to be replaced with your actual Expo project ID.

## Quick Fix (Local Machine)

### Option 1: Automatic Fix (Recommended)
Run the provided script on your local machine:

```bash
./scripts/fix-project-id.sh
```

### Option 2: Manual Fix

1. **Get your project ID:**
   ```bash
   eas project:info
   ```
   
   Copy the `ID` value from the output.

2. **Update app.json:**
   Replace `"your-project-id-here"` with your actual project ID in two places:
   
   ```json
   {
     "expo": {
       "extra": {
         "eas": {
           "projectId": "YOUR_ACTUAL_PROJECT_ID_HERE"
         }
       },
       "updates": {
         "url": "https://u.expo.dev/YOUR_ACTUAL_PROJECT_ID_HERE"
       }
     }
   }
   ```

3. **Update bundle identifiers (if needed):**
   Change `com.yourcompany.triviaparty` to your actual company/app identifier:
   
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.triviaparty"
       },
       "android": {
         "package": "com.yourcompany.triviaparty"
       }
     }
   }
   ```

## After Fixing

Your build command should now work:
```bash
eas build --profile development --platform ios
```

## If You Don't Have a Project Yet

If you haven't created an Expo project yet:

```bash
# This will create a new project and update your config
eas project:init
```

Then follow the manual fix steps above to update the placeholders.

## Troubleshooting

**Still getting UUID errors?**
- Make sure you're logged in: `eas login`
- Verify project exists: `eas project:info`
- Check that app.json has the correct project ID (no placeholder text)

**Build failing for other reasons?**
- Try clearing cache: `eas build --clear-cache`
- Check Apple Developer account setup (for iOS)
- Verify bundle identifier is unique and properly formatted