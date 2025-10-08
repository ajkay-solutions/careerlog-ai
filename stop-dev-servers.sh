#!/bin/bash

# WorkLog AI Development Servers Stop Script
# This script stops both backend and frontend development servers

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

print_status "🛑 Stopping WorkLog AI Development Servers..."

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local server_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $server_name (PID: $pid)..."
            kill $pid
            sleep 2
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "Force killing $server_name..."
                kill -9 $pid
            fi
            print_success "$server_name stopped"
        else
            print_warning "$server_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_warning "No PID file found for $server_name"
    fi
}

# Stop servers using PID files
if [ -d "logs" ]; then
    kill_by_pid_file "logs/backend.pid" "Backend server"
    kill_by_pid_file "logs/frontend.pid" "Frontend server"
fi

# Also kill any processes on the ports as backup
print_status "🔍 Checking for any remaining processes on ports..."

# Kill processes on port 3004 (backend)
if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "Killing remaining processes on port 3004..."
    sudo fuser -k 3004/tcp 2>/dev/null || true
fi

# Kill processes on port 5173 (frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "Killing remaining processes on port 5173..."
    sudo fuser -k 5173/tcp 2>/dev/null || true
fi

# Kill any node processes related to worklog-ai
print_status "🔍 Checking for any worklog-ai node processes..."
pkill -f "worklog-ai" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

sleep 2

# Verify ports are free
backend_free=true
frontend_free=true

if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    backend_free=false
    print_error "Port 3004 is still occupied"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    frontend_free=false
    print_error "Port 5173 is still occupied"
fi

if [ "$backend_free" = true ] && [ "$frontend_free" = true ]; then
    print_success "🎉 All WorkLog AI development servers stopped successfully!"
    print_status "📊 Ports 3004 and 5173 are now free"
else
    print_warning "Some processes may still be running. You may need to restart your system."
fi

echo ""
echo -e "${BLUE}💡 To start servers again, run:${NC}"
echo -e "   ./start-dev-servers.sh"