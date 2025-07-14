#!/bin/bash

# Trivia Party Build Setup Script
# This script helps set up your project for Expo builds

echo "🎯 Trivia Party Build Setup"
echo "=========================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

# Check if user is logged in
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log in to EAS..."
    eas login
else
    echo "✅ Already logged in to EAS"
fi

# Check if project is configured
if [ ! -f "eas.json" ]; then
    echo "⚙️ Configuring EAS for this project..."
    eas build:configure
else
    echo "✅ EAS already configured"
fi

# Create environment files if they don't exist
if [ ! -f ".env.development" ]; then
    echo "📄 Creating .env.development..."
    cp .env.example .env.development
    echo "⚠️  Please update .env.development with your Supabase credentials"
fi

if [ ! -f ".env.production" ]; then
    echo "📄 Creating .env.production..."
    cp .env.example .env.production
    echo "⚠️  Please update .env.production with your production Supabase credentials"
fi

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update your environment files with Supabase credentials"
echo "2. Update app.json with your bundle identifiers"
echo "3. Run your first build:"
echo ""
echo "   Development (iOS Simulator):"
echo "   eas build --profile development-simulator --platform ios"
echo ""
echo "   Development (Android):"
echo "   eas build --profile development --platform android"
echo ""
echo "📖 For more details, see docs/BUILD_QUICK_START.md"