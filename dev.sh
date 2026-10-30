#!/bin/bash
# Run both backend and frontend dev servers concurrently
# Usage: bash dev.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Royal's Myawaddy Delivery System..."
echo "Press Ctrl+C to stop both servers."
echo ""

# Start backend in background
echo "[BACKEND] Starting Laravel on http://localhost:8000 ..."
cd "$ROOT/backend"
php artisan serve --host=0.0.0.0 --port=8000 &
BACKEND_PID=$!

# Start frontend in background  
echo "[FRONTEND] Starting Vite on http://localhost:5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait and handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'; exit 0" SIGINT SIGTERM
wait
