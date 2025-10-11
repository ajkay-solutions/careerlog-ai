#!/bin/bash

echo "🛑 Stopping CareerLog AI..."
echo "=========================="

# Kill processes on CareerLog ports
echo "📍 Stopping Frontend (Port 5174)..."
fuser -k 5174/tcp 2>/dev/null

echo "📍 Stopping Backend (Port 3005)..."
fuser -k 3005/tcp 2>/dev/null

# Also kill any node processes in careerlog directories
pkill -f "careerlog-ai/frontend" 2>/dev/null
pkill -f "careerlog-ai/backend" 2>/dev/null

echo ""
echo "✅ CareerLog AI stopped successfully!"
echo ""