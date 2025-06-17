#!/bin/bash
set -e

echo "🚀 Starting Na Winie application..."

# Check required environment variables
check_env_vars() {
    local missing_vars=()
    
    if [ -z "${PUBLIC_SUPABASE_URL:-}" ]; then
        missing_vars+=("PUBLIC_SUPABASE_URL")
    fi
    
    if [ -z "${PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
        missing_vars+=("PUBLIC_SUPABASE_ANON_KEY")
    fi
    
    if [ -z "${JWT_SECRET_KEY:-}" ]; then
        missing_vars+=("JWT_SECRET_KEY")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "❌ Missing required environment variables: ${missing_vars[*]}"
        echo "Please set these in Cloud Run environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "For debugging, here are the current environment variables:"
        env | grep -E "^(PUBLIC_|JWT_)" | sort || echo "No environment variables found matching pattern"
        return 1
    fi
    
    echo "✅ All required environment variables are set"
    return 0
}

# Configure runtime environment variables for frontend
configure_frontend_env() {
    echo "🔧 Configuring frontend environment variables..."
    
    # Create runtime environment configuration for frontend
    cat > /app/dist/runtime-config.js << EOF
window.__RUNTIME_CONFIG__ = {
  PUBLIC_SUPABASE_URL: "${PUBLIC_SUPABASE_URL:-}",
  PUBLIC_SUPABASE_ANON_KEY: "${PUBLIC_SUPABASE_ANON_KEY:-}",
  PUBLIC_USE_LOCAL_BACKEND: "${PUBLIC_USE_LOCAL_BACKEND:-false}"
};
console.log("✅ Runtime config loaded:", window.__RUNTIME_CONFIG__);
EOF
    
    # Make the config file accessible
    chmod 644 /app/dist/runtime-config.js
    
    echo "📄 Runtime config created:"
    cat /app/dist/runtime-config.js
    echo ""
    
    # Inject runtime config into HTML files
    echo "🔗 Injecting runtime config into HTML files..."
    
    # Find and inject into all HTML files in the dist directory
    find /app/dist -name "*.html" -type f | while read -r html_file; do
        if grep -q "runtime-config.js" "$html_file"; then
            echo "  ⏭️  $html_file already has runtime config"
        else
            sed -i 's|<head>|<head><script src="/runtime-config.js"></script>|g' "$html_file"
            echo "  ✅ Injected runtime config into $html_file"
        fi
    done
    
    echo "✅ Frontend environment configuration completed."
}

# Start backend service
start_backend() {
    echo "🔧 Starting backend service..."
    cd /app/backend
    
    # Set backend environment variables
    export PYTHONPATH="/app/backend:$PYTHONPATH"
    
    # Start backend in background
    python main.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    
    # Wait a moment for backend to start
    sleep 2
    
    # Check if backend is running
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✅ Backend is running"
    else
        echo "❌ Backend failed to start"
        return 1
    fi
    
    return 0
}

# Start frontend service
start_frontend() {
    echo "🔧 Starting frontend service..."
    cd /app
    
    # Start frontend on port 8080 (required by Cloud Run)
    PORT=8080 node dist/server/entry.mjs &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
    
    return 0
}

# Health check function
health_check() {
    echo "🏥 Running health checks..."
    
    # Check backend health
    echo "  Checking backend (port 8000)..."
    for i in {1..10}; do
        if curl -s http://localhost:8000/api/ingredients > /dev/null 2>&1; then
            echo "  ✅ Backend is healthy"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "  ⚠️  Backend health check failed after 10 attempts"
        fi
        sleep 1
    done
    
    # Check frontend health
    echo "  Checking frontend (port 8080)..."
    for i in {1..10}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo "  ✅ Frontend is healthy"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "  ⚠️  Frontend health check failed after 10 attempts"
        fi
        sleep 1
    done
    
    # Check runtime config accessibility
    echo "  Checking runtime config..."
    if curl -s http://localhost:8080/runtime-config.js | grep -q "window.__RUNTIME_CONFIG__"; then
        echo "  ✅ Runtime config is accessible"
    else
        echo "  ⚠️  Runtime config is not accessible"
    fi
}

# Main execution
main() {
    echo "Environment check..."
    if ! check_env_vars; then
        echo "❌ Environment variable check failed"
        exit 1
    fi
    
    echo ""
    echo "Configuring frontend environment..."
    if ! configure_frontend_env; then
        echo "❌ Frontend configuration failed"
        exit 1
    fi
    
    echo ""
    echo "Starting backend..."
    if ! start_backend; then
        echo "❌ Backend startup failed"
        exit 1
    fi
    
    echo ""
    echo "Starting frontend..."
    if ! start_frontend; then
        echo "❌ Frontend startup failed"
        exit 1
    fi
    
    echo ""
    health_check
    
    echo ""
    echo "🎉 Application started successfully!"
    echo "📋 Services:"
    echo "  - Frontend: http://localhost:8080"
    echo "  - Backend: http://localhost:8000"
    echo "  - Runtime Config: http://localhost:8080/runtime-config.js"
    echo ""
    echo "🔍 Debugging tips:"
    echo "  - Check browser console for 'Runtime config loaded' message"
    echo "  - Verify Supabase configuration in browser dev tools"
    echo "  - Check Network tab for API request patterns"
    
    # Keep the container running
    wait
}

# Handle cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    pkill -f "python main.py" 2>/dev/null || true
    pkill -f "node dist/server/entry.mjs" 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start the application
main 