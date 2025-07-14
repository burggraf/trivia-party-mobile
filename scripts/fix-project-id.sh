#!/bin/bash

# Script to fix Expo project ID configuration
# Run this on your local machine after cloning the repo

echo "🔧 Fixing Expo Project Configuration"
echo "=================================="

# Get the current project ID
echo "📋 Getting your Expo project ID..."
PROJECT_ID=$(eas project:info --json | jq -r '.id')

if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not get project ID. Make sure you're logged in and the project exists."
    echo "   Run: eas login"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Found project ID: $PROJECT_ID"

# Update app.json with the real project ID
echo "📝 Updating app.json..."
sed -i.bak "s/your-project-id-here/$PROJECT_ID/g" app.json

# Update any other files that might reference the placeholder
sed -i.bak "s/your-project-id-here/$PROJECT_ID/g" eas.json 2>/dev/null || true

echo "✅ Updated configuration files"

# Clean up backup files
rm -f app.json.bak eas.json.bak

echo ""
echo "🎉 Configuration fixed!"
echo "📋 Your project ID: $PROJECT_ID"
echo ""
echo "Now you can run:"
echo "   eas build --profile development --platform ios"
echo ""