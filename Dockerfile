# Multi-stage Dockerfile for Na Winie (Grab & Cook) Application
# This Dockerfile builds both the Astro frontend and FastAPI backend

# Stage 1: Build Frontend (Astro + React)
FROM node:18-slim AS frontend-builder

WORKDIR /app

# Define build arguments for environment variables (for cloud deployment)
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_USE_LOCAL_BACKEND=false

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY astro.config.mjs ./
COPY tailwind.config.mjs ./
COPY vitest.config.ts ./

# Install dependencies including dev deps needed for Astro build
# Astro/Rollup needs platform-specific optional dependencies
RUN npm install --include=optional

# Copy frontend source code
COPY src/ ./src/

# Build with environment variables from either build args (cloud) or .env file (local)
# The build script will handle missing .env gracefully
RUN if [ -f ".env" ]; then \
        echo "Building with .env file (local development)..." && \
        export $(grep -v '^#' .env | xargs) && npm run build; \
    else \
        echo "Building with environment variables (cloud deployment)..." && \
        export PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL}" && \
        export PUBLIC_SUPABASE_ANON_KEY="${PUBLIC_SUPABASE_ANON_KEY}" && \
        export PUBLIC_USE_LOCAL_BACKEND="${PUBLIC_USE_LOCAL_BACKEND}" && \
        npm run build; \
    fi

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

# Create startup script that works for both local and cloud environments
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Load environment variables from .env file if it exists (local development)\n\
if [ -f "/app/.env" ] && [ -s "/app/.env" ]; then\n\
    echo "Loading environment variables from .env file (local development)..."\n\
    export $(grep -v "^#" /app/.env | xargs)\n\
    echo "Environment loaded from .env file."\n\
else\n\
    echo "No .env file found or file is empty. Using environment variables from cloud platform."\n\
    if [ -n "$PUBLIC_SUPABASE_URL" ]; then\n\
        echo "PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:0:30}..."\n\
    else\n\
        echo "Warning: PUBLIC_SUPABASE_URL not set"\n\
    fi\n\
fi\n\
\n\
echo "Starting FastAPI backend..."\n\
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &\n\
BACKEND_PID=$!\n\
echo "Starting Astro frontend..."\n\
cd /app && HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs &\n\
FRONTEND_PID=$!\n\
echo "Both servers started. Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"\n\
\n\
# Function to handle shutdown\n\
shutdown() {\n\
    echo "Shutting down..."\n\
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    exit 0\n\
}\n\
\n\
# Trap SIGTERM and SIGINT\n\
trap shutdown SIGTERM SIGINT\n\
\n\
# Wait for processes\n\
wait $BACKEND_PID $FRONTEND_PID\n\
' > /app/start.sh

RUN chmod +x /app/start.sh && chown appuser:appuser /app/start.sh

# Switch to non-root user
USER appuser

# Expose both ports
EXPOSE 4321 8000

# Health check (updated to check both services)
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/ && curl -f http://localhost:4321/ || exit 1

# Default environment variables (can be overridden)
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    CORS_ORIGINS=http://localhost:3000,http://localhost:4321,http://localhost:8000 \
    DATABASE_URL=sqlite:///./backend/nawinie.db

# Command to run both servers
CMD ["/app/start.sh"] 