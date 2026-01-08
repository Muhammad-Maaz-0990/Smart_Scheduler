#!/bin/bash
# Start script for Replit deployment

echo "🚀 Starting Smart Scheduler Backend..."

# Navigate to backend directory
cd backend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please configure environment variables in Replit Secrets"
fi

# Start the server
echo "✅ Starting Node.js server..."
npm start
