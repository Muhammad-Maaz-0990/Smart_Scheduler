#!/bin/bash
set -e

echo "================================================"
echo "Smart Scheduler Backend - Deployment Starting"
echo "================================================"

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Display Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in backend directory!"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
if [ -f "package-lock.json" ]; then
    echo "Found package-lock.json, using npm ci..."
    npm ci --omit=dev --prefer-offline || {
        echo "npm ci failed, falling back to npm install..."
        npm install --omit=dev
    }
else
    echo "No package-lock.json found, using npm install..."
    npm install --omit=dev
fi

# Verify critical modules are installed
echo ""
echo "Verifying installation..."
if [ ! -d "node_modules/express" ]; then
    echo "ERROR: Express not installed!"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""
echo "Starting server..."
echo "================================================"

# Start the server
exec node server.js
