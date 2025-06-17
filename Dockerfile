# Multi-stage Dockerfile for Na Winie (Grab & Cook) Application
# This Dockerfile builds both the Astro frontend and FastAPI backend

# Stage 1: Build Frontend (Astro + React)
FROM node:18-slim AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY astro.config.mjs ./
COPY tailwind.config.mjs ./
COPY vitest.config.ts ./

# Install dependencies including dev deps needed for Astro build
RUN npm install --include=optional

# Copy frontend source code
COPY src/ ./src/

# Create a placeholder .env for build (will be replaced at runtime)
RUN echo 'PUBLIC_SUPABASE_URL=placeholder-will-be-replaced-at-runtime' > .env && \
    echo 'PUBLIC_SUPABASE_ANON_KEY=placeholder-will-be-replaced-at-runtime' >> .env && \
    echo 'PUBLIC_USE_LOCAL_BACKEND=false' >> .env

# Build frontend with placeholder values
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 3: Production Runtime
FROM python:3.11-slim AS production

WORKDIR /app

# Install system dependencies for runtime
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --disabled-password --gecos '' appuser

# Copy Python dependencies from builder stage
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend source code
COPY backend/ ./backend/
COPY db/ ./db/

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/logs /app/backend/images && \
    chown -R appuser:appuser /app

# Create runtime environment configuration script
RUN echo '#!/bin/bash\n\
# Configure runtime environment variables for frontend\n\
configure_frontend_env() {\n\
    echo "Configuring frontend environment variables..."\n\
    \n\
    # Create runtime environment configuration for frontend\n\
    cat > /app/dist/runtime-config.js << EOF\n\
window.__RUNTIME_CONFIG__ = {\n\
  PUBLIC_SUPABASE_URL: "${PUBLIC_SUPABASE_URL:-}",\n\
  PUBLIC_SUPABASE_ANON_KEY: "${PUBLIC_SUPABASE_ANON_KEY:-}",\n\
  PUBLIC_USE_LOCAL_BACKEND: "${PUBLIC_USE_LOCAL_BACKEND:-false}"\n\
};\n\
EOF\n\
    \n\
    # Inject runtime config into all HTML files\n\
    find /app/dist -name "*.html" -type f -exec sed -i "s|<head>|<head><script src=\"/runtime-config.js\"></script>|g" {} +\n\
    \n\
    echo "Frontend environment configuration completed."\n\
}\n\
' > /app/configure-env.sh

# Create enhanced startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "=== Na Winie Application Startup ==="\n\
echo "Environment: ${ENVIRONMENT:-production}"\n\
echo "Port: ${PORT:-4321}"\n\
echo\n\
\n\
# Check for required environment variables\n\
required_vars=("PUBLIC_SUPABASE_URL" "PUBLIC_SUPABASE_ANON_KEY" "JWT_SECRET_KEY")\n\
missing_vars=()\n\
\n\
for var in "${required_vars[@]}"; do\n\
    if [ -z "${!var}" ]; then\n\
        missing_vars+=("$var")\n\
    else\n\
        echo "✓ $var is set"\n\
    fi\n\
done\n\
\n\
if [ ${#missing_vars[@]} -ne 0 ]; then\n\
    echo "❌ Missing required environment variables:"\n\
    printf "   %s\n" "${missing_vars[@]}"\n\
    echo\n\
    echo "Please set these environment variables in your Cloud Run service:"\n\
    echo "1. Go to Google Cloud Console > Cloud Run > Services"\n\
    echo "2. Click on your service > Edit & Deploy New Revision"\n\
    echo "3. Go to Variables & Secrets tab"\n\
    echo "4. Add the missing environment variables"\n\
    echo\n\
    echo "Continuing startup with warnings..."\n\
else\n\
    echo "✅ All required environment variables are set"\n\
fi\n\
\n\
echo\n\
\n\
# Export environment variables for child processes (Astro SSR)\n\
export PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL:-}"\n\
export PUBLIC_SUPABASE_ANON_KEY="${PUBLIC_SUPABASE_ANON_KEY:-}"\n\
export PUBLIC_USE_LOCAL_BACKEND="${PUBLIC_USE_LOCAL_BACKEND:-false}"\n\
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-}"\n\
export DATABASE_URL="${DATABASE_URL:-sqlite:///./backend/nawinie.db}"\n\
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000,http://localhost:4321,http://localhost:8000}"\n\
\n\
# Configure frontend environment variables\n\
source /app/configure-env.sh\n\
configure_frontend_env\n\
\n\
echo "Starting services..."\n\
\n\
# Start FastAPI backend\n\
echo "🚀 Starting FastAPI backend on port 8000..."\n\
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &\n\
BACKEND_PID=$!\n\
\n\
# Wait a moment for backend to start\n\
sleep 3\n\
\n\
# Start Astro frontend with proper environment variables\n\
FRONTEND_PORT=${PORT:-4321}\n\
echo "🌐 Starting Astro frontend on port $FRONTEND_PORT..."\n\
echo "Frontend environment variables:"\n\
echo "  PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:0:30}..."\n\
echo "  PUBLIC_USE_LOCAL_BACKEND: ${PUBLIC_USE_LOCAL_BACKEND}"\n\
echo "  HOST: 0.0.0.0"\n\
echo "  PORT: $FRONTEND_PORT"\n\
\n\
cd /app\n\
\n\
# Check if Astro build exists\n\
if [ ! -f "/app/dist/server/entry.mjs" ]; then\n\
    echo "❌ Astro server entry point not found"\n\
    echo "Available files in /app/dist:"\n\
    ls -la /app/dist/ || echo "dist directory not found"\n\
    echo "Available files in /app/dist/server:"\n\
    ls -la /app/dist/server/ || echo "dist/server directory not found"\n\
    exit 1\n\
fi\n\
\n\
# Start Astro with error handling\n\
echo "Starting Astro server..."\n\
if ! HOST=0.0.0.0 PORT=$FRONTEND_PORT node dist/server/entry.mjs &\n\
then\n\
    echo "❌ Failed to start Astro server"\n\
    exit 1\n\
fi\n\
\n\
FRONTEND_PID=$!\n\
echo "✅ Frontend started with PID: $FRONTEND_PID"\n\
\n\
# Wait a moment to check if frontend started successfully\n\
sleep 5\n\
\n\
# Check if frontend process is still running\n\
if ! kill -0 $FRONTEND_PID 2>/dev/null; then\n\
    echo "❌ Frontend process died after startup"\n\
    echo "Last 50 lines of system logs:"\n\
    tail -50 /var/log/syslog 2>/dev/null || echo "No system logs available"\n\
    exit 1\n\
fi\n\
\n\
# Test if frontend is responding\n\
echo "Testing frontend health..."\n\
sleep 2\n\
if curl -f http://localhost:$FRONTEND_PORT/health >/dev/null 2>&1; then\n\
    echo "✅ Frontend health check passed"\n\
else\n\
    echo "⚠️  Frontend health check failed, but process is running"\n\
    echo "Checking if main page is accessible..."\n\
    if curl -f http://localhost:$FRONTEND_PORT/ >/dev/null 2>&1; then\n\
        echo "✅ Frontend main page is accessible"\n\
    else\n\
        echo "❌ Frontend main page is not accessible"\n\
        echo "Process status:"\n\
        ps aux | grep node || echo "No node processes found"\n\
        echo "Port status:"\n\
        netstat -tlnp | grep $FRONTEND_PORT || echo "Port $FRONTEND_PORT not listening"\n\
    fi\n\
fi\n\
\n\
echo\n\
echo "✅ Both services started successfully!"\n\
echo "   - Backend: http://localhost:8000 (PID: $BACKEND_PID)"\n\
echo "   - Frontend: http://localhost:$FRONTEND_PORT (PID: $FRONTEND_PID)"\n\
echo "   - API Docs: http://localhost:8000/docs"\n\
echo\n\
\n\
# Function to handle shutdown\n\
shutdown() {\n\
    echo\n\
    echo "🛑 Shutting down services..."\n\
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    echo "👋 Shutdown complete"\n\
    exit 0\n\
}\n\
\n\
# Trap SIGTERM and SIGINT\n\
trap shutdown SIGTERM SIGINT\n\
\n\
# Wait for processes\n\
wait $BACKEND_PID $FRONTEND_PID\n\
' > /app/start.sh

RUN chmod +x /app/start.sh /app/configure-env.sh && \
    chown appuser:appuser /app/start.sh /app/configure-env.sh

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 4321 8000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/docs > /dev/null && curl -f http://localhost:${PORT:-4321}/ > /dev/null || exit 1

# Default environment variables (can be overridden at runtime)
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    PUBLIC_USE_LOCAL_BACKEND=false

# Command to run both servers
CMD ["/app/start.sh"] 