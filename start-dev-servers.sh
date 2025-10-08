#!/bin/bash

# WorkLog AI Development Servers Startup Script
# This script starts both backend and frontend development servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} ✅ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} ⚠️  $1"
}

print_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} ❌ $1"
}

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the worklog-ai project root directory"
    exit 1
fi

print_status "🚀 Starting WorkLog AI Development Servers..."

# Kill any existing processes on the ports
print_status "🔍 Checking for existing processes on ports 3004 and 5173..."

# Kill processes on port 3004 (backend)
if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Killing existing process on port 3004..."
    sudo fuser -k 3004/tcp 2>/dev/null || true
    sleep 2
fi

# Kill processes on port 5173 (frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Killing existing process on port 5173..."
    sudo fuser -k 5173/tcp 2>/dev/null || true
    sleep 2
fi

# Create log directory
mkdir -p logs

# Start backend server
print_status "🔧 Starting backend server (port 3004)..."
cd backend
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
fi

# Start backend in background and redirect output to log file
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend server started (PID: $BACKEND_PID)"
    echo $BACKEND_PID > logs/backend.pid
else
    print_error "Failed to start backend server"
    exit 1
fi

# Start frontend server
print_status "🎨 Starting frontend server (port 5173)..."
cd frontend
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Start frontend in background and redirect output to log file
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend server started (PID: $FRONTEND_PID)"
    echo $FRONTEND_PID > logs/frontend.pid
else
    print_error "Failed to start frontend server"
    # Kill backend if frontend failed
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Wait for servers to fully initialize
print_status "⏳ Waiting for servers to initialize..."
sleep 5

# Test if servers are responding
print_status "🔍 Testing server connectivity..."

# Test backend
if curl -s http://localhost:3004/health > /dev/null 2>&1; then
    print_success "Backend is responding on http://localhost:3004"
else
    print_warning "Backend health check failed (might still be starting up)"
fi

# Test frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    print_success "Frontend is responding on http://localhost:5173"
else
    print_warning "Frontend health check failed (might still be starting up)"
fi

print_success "🎉 WorkLog AI development servers started successfully!"
echo ""
echo -e "${BLUE}📋 Server Information:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3004${NC}"
echo ""
echo -e "${BLUE}📁 Log Files:${NC}"
echo -e "   Backend:  logs/backend.log"
echo -e "   Frontend: logs/frontend.log"
echo ""
echo -e "${BLUE}🔧 Management:${NC}"
echo -e "   Stop servers: ./stop-dev-servers.sh"
echo -e "   View logs:    tail -f logs/backend.log logs/frontend.log"
echo -e "   Check status: ./check-servers.sh"
echo ""
echo -e "${YELLOW}Note: Servers are running in background. Use the stop script to terminate them.${NC}"