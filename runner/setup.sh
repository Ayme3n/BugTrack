#!/bin/bash

# BugTrack Runner Setup Script

echo "🚀 Setting up BugTrack Runner..."
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "❌ .env file not found!"
    echo ""
    echo "Please create runner/.env with your DATABASE_URL:"
    echo ""
    echo "DATABASE_URL=\"postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres\""
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the runner:"
echo "  npm start"
echo ""

