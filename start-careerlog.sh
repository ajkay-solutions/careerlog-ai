#!/bin/bash

echo "🚀 Starting CareerLog AI Development Environment..."
echo "================================================"

# Kill any existing processes on our ports
echo "🔧 Cleaning up existing processes..."
fuser -k 5174/tcp 2>/dev/null
fuser -k 3005/tcp 2>/dev/null

# Start backend
echo "📦 Starting Backend Server (Port 3005)..."
cd /home/ajk/careerlog-ai/backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend Server (Port 5174)..."
cd /home/ajk/careerlog-ai/frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo "✅ CareerLog AI is running!"
echo "================================"
echo "📍 Frontend: http://localhost:5174"
echo "📍 Backend:  http://localhost:3005"
echo "📍 Health:   http://localhost:3005/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to handle shutdown
cleanup() {
    echo ""
    echo "🛑 Stopping CareerLog AI..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    fuser -k 5174/tcp 2>/dev/null
    fuser -k 3005/tcp 2>/dev/null
    echo "✅ CareerLog AI stopped"
    exit 0
}

# Set up trap to handle Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done