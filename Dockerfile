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
    nginx \
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

# Create nginx configuration for reverse proxy
RUN echo 'server {\n\
    listen 8080;\n\
    server_name localhost;\n\
    \n\
    # Frontend (Astro) - serve from port 4321\n\
    location / {\n\
        proxy_pass http://localhost:4321;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_cache_bypass $http_upgrade;\n\
        proxy_read_timeout 86400;\n\
    }\n\
    \n\
    # Backend API - proxy to FastAPI on port 8000\n\
    location /api/ {\n\
        proxy_pass http://localhost:8000/api/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_cache_bypass $http_upgrade;\n\
    }\n\
    \n\
    # Backend docs and other endpoints\n\
    location /docs {\n\
        proxy_pass http://localhost:8000/docs;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
    \n\
    location /openapi.json {\n\
        proxy_pass http://localhost:8000/openapi.json;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
}\n\
' > /etc/nginx/sites-available/default

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
echo "Main Port (nginx): 8080"\n\
echo "Frontend Port: 4321"\n\
echo "Backend Port: 8000"\n\
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
# Start FastAPI backend on port 8000\n\
echo "🚀 Starting FastAPI backend on port 8000..."\n\
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &\n\
BACKEND_PID=$!\n\
\n\
# Wait for backend to start\n\
sleep 3\n\
\n\
# Start Astro frontend on port 4321\n\
echo "🌐 Starting Astro frontend on port 4321..."\n\
echo "Frontend environment variables:"\n\
echo "  PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:0:30}..."\n\
echo "  PUBLIC_USE_LOCAL_BACKEND: ${PUBLIC_USE_LOCAL_BACKEND}"\n\
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
# Start Astro on port 4321\n\
echo "Starting Astro server on port 4321..."\n\
if ! HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs &\n\
then\n\
    echo "❌ Failed to start Astro server"\n\
    exit 1\n\
fi\n\
\n\
FRONTEND_PID=$!\n\
echo "✅ Frontend started with PID: $FRONTEND_PID"\n\
\n\
# Wait for frontend to start\n\
sleep 5\n\
\n\
# Check if both services are running\n\
if ! kill -0 $BACKEND_PID 2>/dev/null; then\n\
    echo "❌ Backend process died after startup"\n\
    exit 1\n\
fi\n\
\n\
if ! kill -0 $FRONTEND_PID 2>/dev/null; then\n\
    echo "❌ Frontend process died after startup"\n\
    exit 1\n\
fi\n\
\n\
# Start nginx as the main service on port 8080\n\
echo "🌐 Starting nginx reverse proxy on port 8080..."\n\
\n\
# Test nginx configuration\n\
nginx -t\n\
if [ $? -ne 0 ]; then\n\
    echo "❌ Nginx configuration test failed"\n\
    exit 1\n\
fi\n\
\n\
# Start nginx in foreground (this keeps the container running)\n\
echo "✅ All services started successfully!"\n\
echo "   - Backend: http://localhost:8000 (PID: $BACKEND_PID)"\n\
echo "   - Frontend: http://localhost:4321 (PID: $FRONTEND_PID)"\n\
echo "   - Nginx Proxy: http://localhost:8080 (main service)"\n\
echo "   - API Docs: http://localhost:8080/docs"\n\
echo\n\
echo "🚀 Ready to serve requests on port 8080"\n\
\n\
# Function to handle shutdown\n\
shutdown() {\n\
    echo\n\
    echo "🛑 Shutting down services..."\n\
    nginx -s quit 2>/dev/null || true\n\
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    echo "👋 Shutdown complete"\n\
    exit 0\n\
}\n\
\n\
# Trap SIGTERM and SIGINT\n\
trap shutdown SIGTERM SIGINT\n\
\n\
# Start nginx in foreground (this is the main process)\n\
exec nginx -g "daemon off;"\n\
' > /app/start.sh

RUN chmod +x /app/start.sh /app/configure-env.sh && \
    chown appuser:appuser /app/start.sh /app/configure-env.sh

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/health > /dev/null || exit 1

# Default environment variables (can be overridden at runtime)
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    PUBLIC_USE_LOCAL_BACKEND=false

# Command to run both servers
CMD ["/app/start.sh"] 