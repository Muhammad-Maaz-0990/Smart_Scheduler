#!/bin/bash
set -e

echo "================================================"
echo "Smart Scheduler Backend - Starting Deployment"
echo "================================================"

# Display versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --production

# Verify Express is installed
if [ ! -d "node_modules/express" ]; then
    echo "ERROR: Express not installed!"
    echo "Attempting to install Express directly..."
    npm install express
fi

echo ""
echo "✅ Dependencies installed successfully"
echo "================================================"
echo "Starting server..."
echo ""

# Start server
exec node server.js
