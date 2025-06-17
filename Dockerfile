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

# Create simplified startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "=== Na Winie Application Startup ==="\n\
echo "Current time: $(date)"\n\
echo "Port: ${PORT:-8080}"\n\
echo "Environment: ${ENVIRONMENT:-production}"\n\
echo "User: $(whoami)"\n\
echo "Working directory: $(pwd)"\n\
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
        echo "✓ $var is set (length: ${#var})")\n\
    fi\n\
done\n\
\n\
if [ ${#missing_vars[@]} -ne 0 ]; then\n\
    echo "❌ Missing required environment variables:"\n\
    printf "   %s\n" "${missing_vars[@]}"\n\
    echo "Will continue with warnings..."\n\
else\n\
    echo "✅ All required environment variables are set"\n\
fi\n\
\n\
echo\n\
\n\
# Export environment variables for child processes\n\
export PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL:-}"\n\
export PUBLIC_SUPABASE_ANON_KEY="${PUBLIC_SUPABASE_ANON_KEY:-}"\n\
export PUBLIC_USE_LOCAL_BACKEND="${PUBLIC_USE_LOCAL_BACKEND:-false}"\n\
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-}"\n\
export DATABASE_URL="${DATABASE_URL:-sqlite:///./backend/nawinie.db}"\n\
export CORS_ORIGINS="${CORS_ORIGINS:-*}"\n\
\n\
# Set NODE_ENV to production\n\
export NODE_ENV=production\n\
\n\
echo "📁 Checking application files..."\n\
ls -la /app/ | head -10\n\
echo\n\
\n\
# Configure frontend environment variables\n\
if [ -f "/app/configure-env.sh" ]; then\n\
    echo "🔧 Configuring frontend environment..."\n\
    source /app/configure-env.sh\n\
    configure_frontend_env\n\
else\n\
    echo "⚠️  Frontend environment configuration script not found"\n\
fi\n\
\n\
# Start FastAPI backend in background\n\
echo "🚀 Starting FastAPI backend on port 8000..."\n\
cd /app\n\
\n\
# Start backend with output redirection\n\
uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /app/logs/backend.log 2>&1 &\n\
BACKEND_PID=$!\n\
echo "Backend started with PID: $BACKEND_PID"\n\
\n\
# Wait for backend to start and test it\n\
echo "⏳ Waiting for backend to be ready..."\n\
for i in {1..10}; do\n\
    if curl -f http://localhost:8000/ >/dev/null 2>&1; then\n\
        echo "✅ Backend is responding"\n\
        break\n\
    fi\n\
    echo "   Attempt $i/10 - waiting 2 seconds..."\n\
    sleep 2\n\
done\n\
\n\
# Check if backend is still running\n\
if ! kill -0 $BACKEND_PID 2>/dev/null; then\n\
    echo "❌ Backend process died during startup"\n\
    echo "Backend logs:"\n\
    cat /app/logs/backend.log\n\
    exit 1\n\
fi\n\
\n\
# Prepare frontend startup\n\
MAIN_PORT=${PORT:-8080}\n\
echo "🌐 Starting Astro frontend on port $MAIN_PORT..."\n\
echo "Node version: $(node --version)"\n\
echo "NPM version: $(npm --version)"\n\
\n\
# Check if Astro build exists\n\
echo "📦 Checking Astro build..."\n\
if [ ! -f "/app/dist/server/entry.mjs" ]; then\n\
    echo "❌ Astro server entry point not found at /app/dist/server/entry.mjs"\n\
    echo "Contents of /app/dist:"\n\
    ls -la /app/dist/ || echo "dist directory not found"\n\
    echo "Contents of /app/dist/server:"\n\
    ls -la /app/dist/server/ || echo "dist/server directory not found"\n\
    exit 1\n\
else\n\
    echo "✅ Astro build found"\n\
fi\n\
\n\
# Test if the port is free\n\
if netstat -tuln | grep ":$MAIN_PORT " >/dev/null; then\n\
    echo "❌ Port $MAIN_PORT is already in use"\n\
    netstat -tuln | grep ":$MAIN_PORT"\n\
    exit 1\n\
fi\n\
\n\
echo "🚀 Starting Astro server..."\n\
echo "Command: HOST=0.0.0.0 PORT=$MAIN_PORT node dist/server/entry.mjs"\n\
\n\
# Function to handle shutdown\n\
shutdown() {\n\
    echo "🛑 Shutting down..."\n\
    kill $BACKEND_PID 2>/dev/null || true\n\
    exit 0\n\
}\n\
\n\
# Trap SIGTERM and SIGINT\n\
trap shutdown SIGTERM SIGINT\n\
\n\
# Start Astro frontend as the main process with timeout\n\
timeout 30 bash -c "HOST=0.0.0.0 PORT=$MAIN_PORT node dist/server/entry.mjs" &\n\
FRONTEND_PID=$!\n\
\n\
# Wait a few seconds to see if it starts successfully\n\
sleep 5\n\
\n\
if kill -0 $FRONTEND_PID 2>/dev/null; then\n\
    echo "✅ Frontend started successfully with PID: $FRONTEND_PID"\n\
    echo "🎉 Application is ready on port $MAIN_PORT"\n\
    \n\
    # Wait for the frontend process to complete\n\
    wait $FRONTEND_PID\n\
else\n\
    echo "❌ Frontend failed to start or died quickly"\n\
    echo "Trying alternative startup method..."\n\
    \n\
    # Try without timeout\n\
    exec HOST=0.0.0.0 PORT=$MAIN_PORT node dist/server/entry.mjs\n\
fi\n\
' > /app/start.sh

RUN chmod +x /app/start.sh /app/configure-env.sh && \
    chown -R appuser:appuser /app

# Create a simple fallback startup script if the main one fails
RUN echo '#!/bin/bash\n\
echo "=== FALLBACK STARTUP ==="\n\
export PORT=${PORT:-8080}\n\
export NODE_ENV=production\n\
cd /app\n\
echo "Starting simple Astro server on port $PORT"\n\
exec HOST=0.0.0.0 PORT=$PORT node dist/server/entry.mjs\n\
' > /app/fallback-start.sh && \
    chmod +x /app/fallback-start.sh && \
    chown appuser:appuser /app/fallback-start.sh

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/ > /dev/null 2>&1 || exit 1

# Default environment variables (can be overridden at runtime)
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    PUBLIC_USE_LOCAL_BACKEND=false

# Command to run both servers
CMD ["/app/start.sh"] 